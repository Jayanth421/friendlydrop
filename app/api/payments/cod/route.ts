import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { couponValidationSchema, createOrderSchema } from "@/lib/validators";
import { createOrder, getCouponByCode, getProductById, getStoreSettings, getUserById, saveCart } from "@/lib/firebase/firestore";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { calculateDeliveryQuote, canUseGateway } from "@/lib/settings-engine";
import { publishSystemEvent } from "@/lib/system-events";
import { beginIdempotentRequest, completeIdempotentRequest, failIdempotentRequest } from "@/lib/security/idempotency";
import { assertRateLimit, buildRateLimitKey } from "@/lib/security/rate-limit";
import { assertTrustedMutationRequest, toGuardErrorResponse } from "@/lib/security/request-guards";

export const runtime = "nodejs";

async function buildSecureItems(items: Array<{ productId: string; quantity: number; customImageUrl?: string }>) {
  const secureItems: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
    category: string;
    weightKg: number;
    customImageUrl?: string;
  }> = [];

  for (const item of items) {
    const product = await getProductById(item.productId);

    if (!product) {
      throw new Error("PRODUCT_NOT_FOUND");
    }

    secureItems.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
      image: product.images[0] ?? product.primaryImage ?? "",
      category: product.category,
      weightKg: Math.max(Number(product.weightGrams ?? 500) / 1000, 0.1),
      customImageUrl: item.customImageUrl,
    });
  }

  return secureItems;
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
  let discountAmount = 0;

  if (input.couponCode) {
    const normalized = couponValidationSchema.parse({ code: input.couponCode }).code;
    const coupon = await getCouponByCode(normalized);
    const isExpired = coupon?.expiresAt ? new Date(coupon.expiresAt).getTime() < Date.now() : false;

    if (coupon && coupon.active && !isExpired) {
      discountAmount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
    }
  }

  const [settings, profile] = await Promise.all([getStoreSettings(), getUserById(input.userId)]);
  const gatewayCheck = canUseGateway(settings, "cod", {
    subtotal,
    postalCode: input.address.postalCode,
    city: input.address.city,
    speed: input.priority === "express" ? "express" : "standard",
  });

  if (!gatewayCheck.allowed) {
    throw new Error(gatewayCheck.reason);
  }

  const isFirstOrder = (profile?.orderCount ?? 0) === 0;
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
      key: buildRateLimitKey({ request, scope: "payments:cod", actorId: user.uid }),
      max: 6,
      windowMs: 60_000,
    });

    const payload = createOrderSchema.parse(await request.json());
    idempotencyKey = idempotencyKey || `cod:${user.uid}:${Date.now()}`;

    const idempotency = await beginIdempotentRequest({
      scope: "payments:cod",
      actorId: user.uid,
      key: idempotencyKey,
    });

    if (idempotency.mode === "replay") {
      return NextResponse.json(idempotency.responseBody, { status: idempotency.responseStatus });
    }

    if (idempotency.mode === "in_progress") {
      return NextResponse.json({ error: "COD order submission already in progress" }, { status: 409 });
    }

    if (payload.paymentMethod !== "cod") {
      await failIdempotentRequest({
        scope: "payments:cod",
        actorId: user.uid,
        key: idempotencyKey,
        errorMessage: "invalid_payment_method",
      });
      return NextResponse.json({ error: "Invalid payment method for COD route" }, { status: 400 });
    }

    const totals = await calculateTotal({
      userId: user.uid,
      items: payload.items,
      couponCode: payload.couponCode,
      priority: payload.priority,
      address: {
        postalCode: payload.address.postalCode,
        city: payload.address.city,
      },
    });

    const paymentId = `COD-${Date.now()}-${nanoid(5)}`;
    const order = await createOrder({
      userId: user.uid,
      items: totals.secureItems,
      priority: payload.priority ?? "normal",
      totalAmount: totals.total,
      subtotalAmount: totals.subtotal,
      taxRate: totals.taxRate,
      taxAmount: totals.taxAmount,
      deliveryFee: totals.deliveryFee,
      paymentId,
      status: "pending",
      address: payload.address,
      couponCode: payload.couponCode,
      discountAmount: totals.discountAmount,
      payment: {
        provider: "cod",
        paymentId,
        orderId: paymentId,
        status: "pending",
      },
    });

    await saveCart(user.uid, []);

    await publishSystemEvent({
      type: "checkout_initiated",
      module: "payments",
      source: "api:payments-cod",
      userId: user.uid,
      orderId: order.id,
      payload: {
        provider: "cod",
        amount: totals.total,
        deliveryZone: totals.deliveryQuote.zoneName,
      },
    });

    const responseBody = {
      ok: true,
      order,
      message: "COD order placed. Please pay when your order is delivered.",
    };

    await completeIdempotentRequest({
      scope: "payments:cod",
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
      scope: "payments:cod",
      actorId,
      key: idempotencyKey,
      errorMessage: error instanceof Error ? error.message : "cod_submission_failed",
    }).catch(() => undefined);

    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not place COD order" }, { status: 400 });
  }
}
