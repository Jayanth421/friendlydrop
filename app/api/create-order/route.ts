import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { createOrderSchema, couponValidationSchema } from "@/lib/validators";
import { getCouponByCode, getProductById, getStoreSettings, getUserById } from "@/lib/firebase/firestore";
import { getRazorpayInstance } from "@/lib/payments/razorpay";
import { getStripeInstance } from "@/lib/payments/stripe";
import { createCashfreeOrder } from "@/lib/payments/cashfree";
import { getAdminDb } from "@/lib/firebase/admin";
import { nanoid } from "nanoid";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { publishSystemEvent } from "@/lib/system-events";
import { canUseGateway, calculateDeliveryQuote, evaluateCheckoutControls } from "@/lib/settings-engine";
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
      image: product.images[0] ?? product.primaryImage ?? "",
      category: product.category,
      weightKg: Math.max(Number(product.weightGrams ?? 500) / 1000, 0.1),
      customImageUrl: item.customImageUrl,
    };
  });
}

async function calculateTotal(
  input: {
    userId: string;
    items: Array<{ productId: string; quantity: number; customImageUrl?: string }>;
    couponCode?: string;
    priority?: "normal" | "express";
    address: { postalCode?: string; city?: string };
    paymentMethod: "cashfree" | "razorpay" | "stripe";
  },
) {
  const secureItems = await buildSecureItems(input.items);
  const subtotal = secureItems.reduce((total, item) => total + item.price * item.quantity, 0);

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

  const gatewayCheck = canUseGateway(settings, input.paymentMethod, {
    subtotal,
    postalCode: input.address.postalCode,
    city: input.address.city,
    speed: input.priority === "express" ? "express" : "standard",
  });

  let selectedGateway: "cashfree" | "razorpay" | "stripe" = input.paymentMethod;
  if (!gatewayCheck.allowed) {
    const checkoutControls = evaluateCheckoutControls(settings, {
      subtotal,
      postalCode: input.address.postalCode,
      city: input.address.city,
      speed: input.priority === "express" ? "express" : "standard",
      customerSegment: profile?.segment,
      isFirstOrder,
      productIds: secureItems.map((item) => item.productId),
      categoryIds: secureItems.map((item) => item.category),
    });

    const fallbackGateway = checkoutControls.payments.fallbackGateway;
    const fallback = fallbackGateway === "cashfree" || fallbackGateway === "razorpay" || fallbackGateway === "stripe" ? fallbackGateway : undefined;
    const shouldFallback =
      settings.payments.rules.smartFallbackEnabled &&
      fallback &&
      fallback !== input.paymentMethod;

    if (!shouldFallback) {
      throw new Error(gatewayCheck.reason);
    }

    const fallbackCheck = canUseGateway(settings, fallback, {
      subtotal,
      postalCode: input.address.postalCode,
      city: input.address.city,
      speed: input.priority === "express" ? "express" : "standard",
    });

    if (!fallbackCheck.allowed) {
      throw new Error(fallbackCheck.reason);
    }

    selectedGateway = fallback;
  }

  const summary = calculateCheckoutSummary({
    subtotal,
    discountAmount,
    taxRate: settings.operations.taxEnabled ? settings.taxRate : 0,
    deliveryFee: deliveryQuote.allowed ? deliveryQuote.fee : 0,
  });

  const checkoutControls = evaluateCheckoutControls(settings, {
    subtotal,
    postalCode: input.address.postalCode,
    city: input.address.city,
    speed: input.priority === "express" ? "express" : "standard",
    customerSegment: profile?.segment,
    isFirstOrder,
    productIds: secureItems.map((item) => item.productId),
    categoryIds: secureItems.map((item) => item.category),
  });

  return {
    secureItems,
    deliveryQuote,
    checkoutControls,
    selectedGateway,
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
      key: buildRateLimitKey({ request, scope: "checkout:create-order", actorId: user.uid }),
      max: 8,
      windowMs: 60_000,
    });

    const idempotency = await beginIdempotentRequest({
      scope: "checkout:create-order",
      actorId: user.uid,
      key: idempotencyKey,
    });
    idempotencyKey = idempotency.key ?? idempotencyKey;

    if (idempotency.mode === "replay") {
      return NextResponse.json(idempotency.responseBody, { status: idempotency.responseStatus });
    }

    if (idempotency.mode === "in_progress") {
      return NextResponse.json({ error: "Checkout request already in progress" }, { status: 409 });
    }

    const payload = createOrderSchema.parse(await request.json());

    if (payload.paymentMethod === "upi-offline" || payload.paymentMethod === "cod") {
      await failIdempotentRequest({
        scope: "checkout:create-order",
        actorId: user.uid,
        key: idempotencyKey,
        errorMessage: "invalid_payment_method",
      });
      return NextResponse.json({ error: "Use the dedicated offline payment endpoint for this method" }, { status: 400 });
    }

    const { settings, ...totals } = await calculateTotal({
      userId: user.uid,
      items: payload.items,
      couponCode: payload.couponCode,
      priority: payload.priority,
      address: {
        postalCode: payload.address.postalCode,
        city: payload.address.city,
      },
      paymentMethod: payload.paymentMethod as "cashfree" | "razorpay" | "stripe",
    });

    await publishSystemEvent({
      type: "checkout_initiated",
      module: "orders",
      source: "api:create-order",
      userId: user.uid,
      payload: {
        paymentMethod: payload.paymentMethod,
        selectedGateway: totals.selectedGateway,
        priority: payload.priority ?? "normal",
        subtotal: totals.subtotal,
        total: totals.total,
        deliveryFee: totals.deliveryFee,
        deliveryZone: totals.deliveryQuote.zoneName,
        freeDeliveryRule: totals.deliveryQuote.freeRuleId,
      },
    });

    if (totals.selectedGateway === "cashfree") {
      const pendingOrderId = nanoid(14);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

      await getAdminDb().collection("pendingOrders").doc(pendingOrderId).set({
        id: pendingOrderId,
        userId: user.uid,
        userEmail: user.email,
        userName: user.name,
        orderDraft: {
          ...payload,
          paymentMethod: totals.selectedGateway,
          items: totals.secureItems,
        },
        totals,
        createdAt: new Date().toISOString(),
      });

      const cashfreeOrder = await createCashfreeOrder(
        {
          orderId: pendingOrderId,
          amount: totals.total,
          customerName: payload.address.fullName || user.name || "Customer",
          customerEmail: user.email || "noreply@friendlydrop.in",
          customerPhone: payload.address.phone || "9999999999",
          userId: user.uid,
          returnUrl: `${appUrl}/checkout/cashfree-return?order_id=${pendingOrderId}`,
        },
        settings,
      );

      const responseBody = {
        provider: "cashfree",
        paymentSessionId: cashfreeOrder.paymentSessionId,
        cfOrderId: cashfreeOrder.cfOrderId,
        orderId: pendingOrderId,
        isSandbox: settings.payments.cashfreeSandboxMode ?? true,
        amount: totals.total,
      };

      await completeIdempotentRequest({
        scope: "checkout:create-order",
        actorId: user.uid,
        key: idempotencyKey,
        responseStatus: 200,
        responseBody,
      });

      return NextResponse.json(responseBody);
    }

    if (totals.selectedGateway === "razorpay") {
      const razorpayOrder = await getRazorpayInstance().orders.create({
        amount: totals.total * 100,
        currency: "INR",
        receipt: `fd_${Date.now()}`,
        notes: {
          userId: user.uid,
        },
      });

      const responseBody = {
        provider: "razorpay",
        key: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
      };

      await completeIdempotentRequest({
        scope: "checkout:create-order",
        actorId: user.uid,
        key: idempotencyKey,
        responseStatus: 200,
        responseBody,
      });

      return NextResponse.json(responseBody);
    }

    const pendingOrderId = nanoid(14);

    await getAdminDb().collection("pendingOrders").doc(pendingOrderId).set({
      id: pendingOrderId,
      userId: user.uid,
      userEmail: user.email,
      userName: user.name,
      orderDraft: {
        ...payload,
        paymentMethod: totals.selectedGateway,
        items: totals.secureItems,
      },
      totals,
      createdAt: new Date().toISOString(),
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    const session = await getStripeInstance().checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "inr",
            product_data: {
              name: "FriendlyDrop Order",
              description: `Includes GST ${totals.taxRate}% and delivery charges`,
            },
            unit_amount: totals.total * 100,
          },
        },
      ],
      success_url: `${appUrl}/checkout/stripe-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/checkout?cancelled=true`,
      metadata: {
        pendingOrderId,
        userId: user.uid,
      },
    });

    const responseBody = { provider: "stripe", url: session.url };

    await completeIdempotentRequest({
      scope: "checkout:create-order",
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
    if (error instanceof Error && error.message !== "RATE_LIMITED") {
      await failIdempotentRequest({
        scope: "checkout:create-order",
        actorId,
        key: idempotencyKey,
        errorMessage: error.message,
      }).catch(() => undefined);
    }
    console.error(error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not create order" }, { status: 400 });
  }
}

