import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { verifyRazorpaySchema, couponValidationSchema } from "@/lib/validators";
import {
  createOrder,
  getCouponByCode,
  getOrder,
  getProductById,
  getStoreSettings,
  getTransactionByProviderPaymentId,
  saveCart,
} from "@/lib/firebase/firestore";
import { getUserById } from "@/lib/firebase/firestore";
import { sendOrderEmail } from "@/lib/email";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { publishSystemEvent } from "@/lib/system-events";
import { runPostPaymentAutomation } from "@/lib/automation-engine";
import { calculateDeliveryQuote, canUseGateway } from "@/lib/settings-engine";
import { beginIdempotentRequest, completeIdempotentRequest, failIdempotentRequest } from "@/lib/security/idempotency";
import { assertRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";

export const runtime = "nodejs";

async function buildSecureItems(items: Array<{ productId: string; quantity: number; customImageUrl?: string }>) {
  const products = await Promise.all(items.map((item) => getProductById(item.productId)));

  return products.map((product, i) => {
    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }
    const item = items[i];
    return {
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.images[0],
      category: product.category,
      weightKg: Math.max(Number(product.weightGrams ?? 500) / 1000, 0.1),
      customImageUrl: item.customImageUrl,
    };
  });
}

async function calculateTotal(input: {
  userId: string;
  items: Array<{ productId: string; quantity: number; customImageUrl?: string }>;
  couponCode?: string;
  priority?: "normal" | "express";
  address: { postalCode?: string; city?: string };
}) {
  const secureItems = await buildSecureItems(input.items);
  const subtotal = secureItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const couponPromise = input.couponCode
    ? getCouponByCode(couponValidationSchema.parse({ code: input.couponCode }).code)
    : Promise.resolve(null);

  const [settings, profile, coupon] = await Promise.all([
    getStoreSettings(),
    getUserById(input.userId),
    couponPromise,
  ]);

  let discountAmount = 0;
  if (coupon) {
    const isExpired = coupon.expiresAt ? new Date(coupon.expiresAt).getTime() < Date.now() : false;
    if (coupon.active && !isExpired) {
      discountAmount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
    }
  }

  const isFirstOrder = (profile?.orderCount ?? 0) === 0;
  const gatewayCheck = canUseGateway(settings, "razorpay", {
    subtotal,
    postalCode: input.address.postalCode,
    city: input.address.city,
    speed: input.priority === "express" ? "express" : "standard",
  });

  if (!gatewayCheck.allowed) {
    throw new Error(gatewayCheck.reason);
  }

  const deliveryQuote = calculateDeliveryQuote(settings, {
    subtotal: Math.max(subtotal - discountAmount, 0),
    postalCode: input.address.postalCode,
    city: input.address.city,
    speed: input.priority === "express" ? "express" : "standard",
    customerSegment: profile?.segment,
    isFirstOrder,
    productIds: secureItems.map((item) => item.productId),
    categoryIds: secureItems.map((item) => item.category),
    weightKg: secureItems.reduce((sum, item) => sum + item.weightKg * item.quantity, 0),
  });

  const summary = calculateCheckoutSummary({
    subtotal,
    discountAmount,
    taxRate: settings.operations.taxEnabled ? settings.taxRate : 0,
    deliveryFee: deliveryQuote.allowed ? deliveryQuote.fee : 0,
  });

  return {
    secureItems,
    deliveryQuote,
    settings,
    ...summary,
  };
}

export async function POST(request: NextRequest) {
  let actorId = "anonymous";
  let idempotencyKey: string | null = request.headers.get("Idempotency-Key");
  try {
    const user = await requireApiUser(request);
    actorId = user.uid;
    assertTrustedMutationRequest(request);
    assertRateLimit({
      key: buildRateLimitKey({ request, scope: "payments:verify-razorpay", actorId: user.uid }),
      max: 10,
      windowMs: 60_000,
    });
    const payload = verifyRazorpaySchema.parse(await request.json());
    idempotencyKey = idempotencyKey || `razorpay:${payload.razorpayPaymentId}`;

    const idempotency = await beginIdempotentRequest({
      scope: "payments:verify-razorpay",
      actorId: user.uid,
      key: idempotencyKey,
    });

    if (idempotency.mode === "replay") {
      return NextResponse.json(idempotency.responseBody, { status: idempotency.responseStatus });
    }

    if (idempotency.mode === "in_progress") {
      return NextResponse.json({ error: "Payment verification already in progress" }, { status: 409 });
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json({ error: "Razorpay secret not configured" }, { status: 500 });
    }

    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== payload.razorpaySignature) {
      await publishSystemEvent({
        type: "payment_failed",
        module: "payments",
        source: "api:verify-payment",
        severity: "warning",
        userId: user.uid,
        payload: {
          provider: "razorpay",
          reason: "invalid_signature",
          razorpayOrderId: payload.razorpayOrderId,
        },
      });
      await failIdempotentRequest({
        scope: "payments:verify-razorpay",
        actorId: user.uid,
        key: idempotencyKey,
        errorMessage: "invalid_signature",
      });
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 401 });
    }

    const existingTransaction = await getTransactionByProviderPaymentId(payload.razorpayPaymentId);
    if (existingTransaction) {
      const existingOrder = await getOrder(existingTransaction.orderId);
      if (existingOrder) {
        const responseBody = { ok: true, order: existingOrder, replayed: true };
        await completeIdempotentRequest({
          scope: "payments:verify-razorpay",
          actorId: user.uid,
          key: idempotencyKey,
          responseStatus: 200,
          responseBody,
        });
        return NextResponse.json(responseBody);
      }
    }

    const { settings, ...totals } = await calculateTotal({
      userId: user.uid,
      items: payload.orderDraft.items,
      couponCode: payload.orderDraft.couponCode,
      priority: payload.orderDraft.priority,
      address: {
        postalCode: payload.orderDraft.address.postalCode,
        city: payload.orderDraft.address.city,
      },
    });
    const status = settings.operations.autoOrderConfirm ? "confirmed" : "pending";

    const order = await createOrder({
      userId: user.uid,
      items: totals.secureItems,
      priority: payload.orderDraft.priority ?? "normal",
      totalAmount: totals.total,
      subtotalAmount: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      deliveryFee: totals.deliveryFee,
      paymentId: payload.razorpayPaymentId,
      status,
      address: payload.orderDraft.address,
      couponCode: payload.orderDraft.couponCode,
      discountAmount: totals.discountAmount,
      payment: {
        provider: "razorpay",
        paymentId: payload.razorpayPaymentId,
        orderId: payload.razorpayOrderId,
        signature: payload.razorpaySignature,
        status: "success",
      },
    });

    await saveCart(user.uid, []);

    if (user.email) {
      await sendOrderEmail({
        to: user.email,
        customerName: user.name,
        orderId: order.id,
        amount: order.totalAmount,
        status: order.status,
      });
    }

    await runPostPaymentAutomation(order, { provider: "razorpay" });

    const responseBody = { ok: true, order };
    await completeIdempotentRequest({
      scope: "payments:verify-razorpay",
      actorId: user.uid,
      key: idempotencyKey,
      responseStatus: 200,
      responseBody,
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    const guardError = toGuardErrorResponse(error);
    if (guardError) {
      return guardError;
    }
    await failIdempotentRequest({
      scope: "payments:verify-razorpay",
      actorId,
      key: idempotencyKey,
      errorMessage: error instanceof Error ? error.message : "verify_payment_failed",
    }).catch(() => undefined);
    console.error(error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }
}

