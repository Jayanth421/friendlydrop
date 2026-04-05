import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { verifyRazorpaySchema, couponValidationSchema } from "@/lib/validators";
import { createOrder, getCouponByCode, getProductById, getStoreSettings, saveCart } from "@/lib/firebase/firestore";
import { sendOrderEmail } from "@/lib/email";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { publishSystemEvent } from "@/lib/system-events";
import { runPostPaymentAutomation } from "@/lib/automation-engine";

export const runtime = "nodejs";

async function buildSecureItems(items: Array<{ productId: string; quantity: number; customImageUrl?: string }>) {
  const secureItems: Array<{
    productId: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
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
      image: product.images[0],
      customImageUrl: item.customImageUrl,
    });
  }

  return secureItems;
}

async function calculateTotal(items: Array<{ productId: string; quantity: number; customImageUrl?: string }>, couponCode?: string) {
  const secureItems = await buildSecureItems(items);
  const subtotal = secureItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  let discountAmount = 0;

  if (couponCode) {
    const normalized = couponValidationSchema.parse({ code: couponCode }).code;
    const coupon = await getCouponByCode(normalized);
    const isExpired = coupon?.expiresAt ? new Date(coupon.expiresAt).getTime() < Date.now() : false;

    if (coupon && coupon.active && !isExpired) {
      discountAmount = coupon.type === "percent" ? Math.round((subtotal * coupon.value) / 100) : coupon.value;
    }
  }

  const settings = await getStoreSettings();
  const summary = calculateCheckoutSummary({
    subtotal,
    discountAmount,
    taxRate: settings.taxRate,
    deliveryFee: settings.deliveryFee,
  });

  return {
    secureItems,
    ...summary,
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireApiUser(request);
    const payload = verifyRazorpaySchema.parse(await request.json());

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
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 401 });
    }

    const totals = await calculateTotal(payload.orderDraft.items, payload.orderDraft.couponCode);

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
      status: "confirmed",
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

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Payment verification failed" }, { status: 400 });
  }
}
