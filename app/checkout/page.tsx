"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/store/use-cart-store";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "stripe">("razorpay");
  const [priority, setPriority] = useState<"express" | "normal">("normal");
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [pricingConfig, setPricingConfig] = useState({
    taxRate: 18,
    deliveryFee: 0,
    delivery: {
      allowed: true,
      message: "",
      zoneName: "",
      freeRuleId: "",
      slaHours: 72,
    },
    payments: {
      enabled: true,
      availableGateways: {
        razorpay: true,
        stripe: true,
      },
      fallbackGateway: "razorpay" as "razorpay" | "stripe",
      message: "",
    },
    operations: {
      maintenanceMode: false,
      checkoutEnabled: true,
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
  });

  const orderSubtotal = subtotal();

  useEffect(() => {
    const params = new URLSearchParams({
      subtotal: String(orderSubtotal),
      postalCode: address.postalCode,
      city: address.city,
      speed: priority,
    });

    fetch(`/api/checkout/config?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data?.config) {
          return;
        }

        const nextConfig = {
          taxRate: Number(data.config.taxRate ?? 18),
          deliveryFee: Number(data.config.deliveryFee ?? 0),
          delivery: {
            allowed: Boolean(data.config.delivery?.allowed ?? true),
            message: data.config.delivery?.message ?? "",
            zoneName: data.config.delivery?.zoneName ?? "",
            freeRuleId: data.config.delivery?.freeRuleId ?? "",
            slaHours: Number(data.config.delivery?.slaHours ?? 72),
          },
          payments: {
            enabled: Boolean(data.config.payments?.enabled ?? true),
            availableGateways: {
              razorpay: Boolean(data.config.payments?.availableGateways?.razorpay ?? true),
              stripe: Boolean(data.config.payments?.availableGateways?.stripe ?? true),
            },
            fallbackGateway: (data.config.payments?.fallbackGateway ?? "razorpay") as "razorpay" | "stripe",
            message: data.config.payments?.message ?? "",
          },
          operations: {
            maintenanceMode: Boolean(data.config.operations?.maintenanceMode ?? false),
            checkoutEnabled: Boolean(data.config.operations?.checkoutEnabled ?? true),
          },
        };

        setPricingConfig(nextConfig);

        setPaymentMethod((current) => {
          if (nextConfig.payments.availableGateways[current]) {
            return current;
          }

          if (nextConfig.payments.availableGateways.razorpay) {
            return "razorpay";
          }

          if (nextConfig.payments.availableGateways.stripe) {
            return "stripe";
          }

          return current;
        });
      })
      .catch(() => {});
  }, [address.city, address.postalCode, orderSubtotal, priority]);

  const summary = useMemo(
    () =>
      calculateCheckoutSummary({
        subtotal: orderSubtotal,
        discountAmount,
        taxRate: pricingConfig.taxRate,
        deliveryFee: pricingConfig.deliveryFee,
      }),
    [discountAmount, orderSubtotal, pricingConfig.deliveryFee, pricingConfig.taxRate],
  );

  const applyCoupon = async () => {
    if (!couponCode) {
      return;
    }

    const response = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: couponCode, total: subtotal() }),
    });

    const data = await response.json();

    if (!response.ok) {
      setDiscountAmount(0);
      toast.error(data.error ?? "Invalid coupon");
      return;
    }

    setDiscountAmount(data.discountAmount);
    toast.success("Coupon applied");
  };

  const handleRazorpay = async (orderDraft: Record<string, unknown>) => {
    const createOrderResponse = await fetch("/api/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderDraft),
    });

    const createOrderData = await createOrderResponse.json();

    if (!createOrderResponse.ok) {
      toast.error(createOrderData.error ?? "Could not create payment");
      return;
    }

    const razorpay = new window.Razorpay({
      key: createOrderData.key,
      amount: createOrderData.amount,
      currency: createOrderData.currency,
      order_id: createOrderData.razorpayOrderId,
      name: "FriendlyDrop",
      description: "Custom photo products",
      prefill: {
        name: address.fullName,
        email: user?.email,
        contact: address.phone,
      },
      handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
        const verifyResponse = await fetch("/api/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            orderDraft,
          }),
        });

        const verifyData = await verifyResponse.json();

        if (!verifyResponse.ok) {
          toast.error(verifyData.error ?? "Payment verification failed");
          return;
        }

        clearCart();
        toast.success("Order confirmed");
        router.push(`/orders/${verifyData.order.id}`);
      },
    });

    razorpay.open();
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!items.length) {
      toast.error("Your cart is empty");
      return;
    }

    if (!pricingConfig.delivery.allowed) {
      toast.error(pricingConfig.delivery.message || "Delivery is not available for this address.");
      return;
    }

    if (!pricingConfig.payments.availableGateways.razorpay && !pricingConfig.payments.availableGateways.stripe) {
      toast.error(pricingConfig.payments.message || "No payment option is available right now.");
      return;
    }

    setSubmitting(true);

    const orderDraft = {
      items,
      address,
      couponCode: couponCode || undefined,
      paymentMethod,
      priority,
    };

    try {
      if (paymentMethod === "razorpay") {
        await handleRazorpay(orderDraft);
      } else {
        const response = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderDraft),
        });

        const data = await response.json();

        if (!response.ok || !data.url) {
          throw new Error(data.error ?? "Unable to start Stripe checkout");
        }

        window.location.href = data.url;
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h1 className="font-display text-3xl font-bold text-ink">Checkout</h1>
          <p className="mt-2 text-sm text-slate-600">Secure payments via Razorpay and Stripe.</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Input required placeholder="Full Name" value={address.fullName} onChange={(event) => setAddress({ ...address, fullName: event.target.value })} />
            <Input required placeholder="Phone" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} />
            <Input required className="sm:col-span-2" placeholder="Address Line 1" value={address.line1} onChange={(event) => setAddress({ ...address, line1: event.target.value })} />
            <Input className="sm:col-span-2" placeholder="Address Line 2" value={address.line2} onChange={(event) => setAddress({ ...address, line2: event.target.value })} />
            <Input required placeholder="City" value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
            <Input required placeholder="State" value={address.state} onChange={(event) => setAddress({ ...address, state: event.target.value })} />
            <Input required placeholder="Postal code" value={address.postalCode} onChange={(event) => setAddress({ ...address, postalCode: event.target.value })} />
            <Input required placeholder="Country" value={address.country} onChange={(event) => setAddress({ ...address, country: event.target.value })} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Payment Method</h2>
          {pricingConfig.payments.message ? <p className="mt-2 text-xs text-amber-600">{pricingConfig.payments.message}</p> : null}
          <div className="mt-3 flex gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "razorpay"}
                onChange={() => setPaymentMethod("razorpay")}
                disabled={!pricingConfig.payments.availableGateways.razorpay}
              />
              Razorpay (India)
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="paymentMethod"
                checked={paymentMethod === "stripe"}
                onChange={() => setPaymentMethod("stripe")}
                disabled={!pricingConfig.payments.availableGateways.stripe}
              />
              Stripe
            </label>
          </div>
          <p className="mt-2 text-xs text-slate-500">UPI, cards, and net banking are controlled in Admin Payment Settings.</p>
          <h3 className="mt-5 text-sm font-semibold text-ink">Delivery Priority</h3>
          <div className="mt-2 flex gap-3">
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="radio" name="priority" checked={priority === "normal"} onChange={() => setPriority("normal")} />
              Normal
            </label>
            <label className="inline-flex items-center gap-2 text-sm">
              <input type="radio" name="priority" checked={priority === "express"} onChange={() => setPriority("express")} />
              Express
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Coupon</h2>
          <div className="mt-3 flex gap-2">
            <Input value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} placeholder="Enter coupon code" />
            <Button type="button" variant="secondary" onClick={applyCoupon}>Apply</Button>
          </div>
        </div>

        <Button
          className="w-full"
          disabled={
            submitting ||
            !items.length ||
            !user ||
            pricingConfig.operations.maintenanceMode ||
            !pricingConfig.operations.checkoutEnabled ||
            !pricingConfig.delivery.allowed ||
            (!pricingConfig.payments.availableGateways.razorpay && !pricingConfig.payments.availableGateways.stripe)
          }
        >
          {pricingConfig.operations.maintenanceMode || !pricingConfig.operations.checkoutEnabled
            ? "Checkout Disabled"
            : submitting
              ? "Processing..."
              : `Pay ${formatCurrency(summary.total)}`}
        </Button>
      </form>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Order Summary</h2>
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={item.productId} className="flex items-center justify-between text-sm">
              <span>{item.name} x {item.quantity}</span>
              <span>{formatCurrency(item.price * item.quantity)}</span>
            </div>
          ))}
          <div className="border-t pt-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(summary.subtotal)}</span>
            </div>
            <div className="flex justify-between text-green-600">
              <span>Discount</span>
              <span>-{formatCurrency(summary.discountAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>GST ({summary.taxRate}%)</span>
              <span>{formatCurrency(summary.taxAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>Delivery</span>
              <span>{summary.deliveryFee === 0 ? "FREE" : formatCurrency(summary.deliveryFee)}</span>
            </div>
            {pricingConfig.delivery.zoneName ? (
              <div className="flex justify-between text-xs text-slate-500">
                <span>Zone</span>
                <span>{pricingConfig.delivery.zoneName}</span>
              </div>
            ) : null}
            <div className="flex justify-between text-xs text-slate-500">
              <span>SLA</span>
              <span>{pricingConfig.delivery.slaHours}h</span>
            </div>
            <div className="mt-1 flex justify-between text-base font-semibold text-ink">
              <span>Total</span>
              <span>{formatCurrency(summary.total)}</span>
            </div>
          </div>
        </div>
      </aside>
    </main>
  );
}
