"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useCartStore } from "@/store/use-cart-store";
import { calculateCheckoutSummary } from "@/lib/checkout-pricing";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

declare global {
  interface Window {
    Cashfree?: (options: { mode: "sandbox" | "production" }) => {
      checkout: (options: { paymentSessionId: string; redirectTarget?: string }) => Promise<{ error?: { message: string }; redirect?: boolean }>;
    };
  }
}

type PaymentMethod = "cashfree" | "upi-offline" | "cod";
type CreateOrderResponse = {
  provider?: "cashfree" | "razorpay" | "stripe";
  paymentSessionId?: string;
  isSandbox?: boolean;
  url?: string;
  error?: string;
};

function buildClientIdempotencyKey(scope: string) {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${scope}:${crypto.randomUUID()}`;
  }

  return `${scope}:${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadCashfreeSdk() {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cashfree checkout is only available in the browser."));
  }

  if (window.Cashfree) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const existingScript = document.getElementById("cashfree-sdk");

    if (existingScript) {
      existingScript.addEventListener("load", () => resolve(), { once: true });
      existingScript.addEventListener("error", () => reject(new Error("Could not load Cashfree checkout.")), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.id = "cashfree-sdk";
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Cashfree checkout."));
    document.head.appendChild(script);
  });
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { items, subtotal, clearCart } = useCartStore();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cashfree");
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
      availableMethods: {
        upi: true,
        cards: true,
        netBanking: true,
        cod: true,
        wallet: true,
        cashfree: true,
        paypal: false,
      },
      availableGateways: {
        cashfree: true,
        upi_offline: true,
        cod: true,
      },
      fallbackGateway: "cashfree" as "cashfree" | "razorpay" | "stripe" | "upi_offline" | "cod",
      message: "",
    },
    operations: {
      maintenanceMode: false,
      checkoutEnabled: true,
    },
  });
  const [submitting, setSubmitting] = useState(false);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [upiProofImageUrl, setUpiProofImageUrl] = useState("");
  const [upiTransactionId, setUpiTransactionId] = useState("");
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
  const upiId = process.env.NEXT_PUBLIC_UPI_ID ?? "friendlydrop@upi";
  const upiPayeeName = process.env.NEXT_PUBLIC_UPI_PAYEE_NAME ?? "FriendlyDrop";
  const onlinePaymentLabels = [
    pricingConfig.payments.availableMethods.upi ? "UPI" : null,
    pricingConfig.payments.availableMethods.cards ? "Cards" : null,
    pricingConfig.payments.availableMethods.netBanking ? "Net banking" : null,
    pricingConfig.payments.availableMethods.wallet ? "Wallets" : null,
  ].filter((item): item is string => Boolean(item));
  const cashfreeAvailable = pricingConfig.payments.availableGateways.cashfree && onlinePaymentLabels.length > 0;
  const offlineUpiAvailable = pricingConfig.payments.availableGateways.upi_offline && pricingConfig.payments.availableMethods.upi;
  const codAvailable = pricingConfig.payments.availableGateways.cod && pricingConfig.payments.availableMethods.cod;
  const hasAnyAvailablePaymentMethod = cashfreeAvailable || offlineUpiAvailable || codAvailable;
  const selectedPaymentAvailable =
    (paymentMethod === "cashfree" && cashfreeAvailable) ||
    (paymentMethod === "upi-offline" && offlineUpiAvailable) ||
    (paymentMethod === "cod" && codAvailable);

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
            availableMethods: {
              upi: Boolean(data.config.payments?.availableMethods?.upi ?? true),
              cards: Boolean(data.config.payments?.availableMethods?.cards ?? true),
              netBanking: Boolean(data.config.payments?.availableMethods?.netBanking ?? true),
              cod: Boolean(data.config.payments?.availableMethods?.cod ?? true),
              wallet: Boolean(data.config.payments?.availableMethods?.wallet ?? true),
              cashfree: Boolean(data.config.payments?.availableMethods?.cashfree ?? true),
              razorpay: Boolean(data.config.payments?.availableMethods?.razorpay ?? true),
              stripe: Boolean(data.config.payments?.availableMethods?.stripe ?? true),
              paypal: Boolean(data.config.payments?.availableMethods?.paypal ?? false),
            },
            availableGateways: {
              cashfree: Boolean(data.config.payments?.availableGateways?.cashfree ?? true),
              razorpay: Boolean(data.config.payments?.availableGateways?.razorpay ?? true),
              stripe: Boolean(data.config.payments?.availableGateways?.stripe ?? true),
              upi_offline: Boolean(data.config.payments?.availableGateways?.upi_offline ?? true),
              cod: Boolean(data.config.payments?.availableGateways?.cod ?? true),
            },
            fallbackGateway: (data.config.payments?.fallbackGateway ?? "cashfree") as "cashfree" | "razorpay" | "stripe" | "upi_offline" | "cod",
            message: data.config.payments?.message ?? "",
          },
          operations: {
            maintenanceMode: Boolean(data.config.operations?.maintenanceMode ?? false),
            checkoutEnabled: Boolean(data.config.operations?.checkoutEnabled ?? true),
          },
        };

        setPricingConfig(nextConfig);

        setPaymentMethod((current) => {
          if (
            (current === "cashfree" &&
              nextConfig.payments.availableGateways.cashfree &&
              (nextConfig.payments.availableMethods.upi ||
                nextConfig.payments.availableMethods.cards ||
                nextConfig.payments.availableMethods.netBanking ||
                nextConfig.payments.availableMethods.wallet)) ||
            (current === "upi-offline" && nextConfig.payments.availableGateways.upi_offline && nextConfig.payments.availableMethods.upi) ||
            (current === "cod" && nextConfig.payments.availableGateways.cod && nextConfig.payments.availableMethods.cod)
          ) {
            return current;
          }

          if (nextConfig.payments.availableGateways.cod && nextConfig.payments.availableMethods.cod) {
            return "cod";
          }

          if (nextConfig.payments.availableGateways.upi_offline && nextConfig.payments.availableMethods.upi) {
            return "upi-offline";
          }

          if (
            nextConfig.payments.availableGateways.cashfree &&
            (nextConfig.payments.availableMethods.upi ||
              nextConfig.payments.availableMethods.cards ||
              nextConfig.payments.availableMethods.netBanking ||
              nextConfig.payments.availableMethods.wallet)
          ) {
            return "cashfree";
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

  const upiPaymentNote = useMemo(() => {
    const firstItem = items[0]?.name?.slice(0, 25) ?? "FriendlyDrop Order";
    return `${firstItem} (${items.length} items)`;
  }, [items]);

  const upiPaymentLink = useMemo(() => {
    const params = new URLSearchParams({
      pa: upiId,
      pn: upiPayeeName,
      am: summary.total.toFixed(2),
      cu: "INR",
      tn: upiPaymentNote,
    });

    return `upi://pay?${params.toString()}`;
  }, [summary.total, upiId, upiPayeeName, upiPaymentNote]);

  const upiQrUrl = useMemo(
    () => `https://api.qrserver.com/v1/create-qr-code/?size=280x280&data=${encodeURIComponent(upiPaymentLink)}`,
    [upiPaymentLink],
  );

  const uploadUpiProof = async (file: File) => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }

    setUploadingProof(true);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "payments-upi");
      formData.append("record", "true");

      const response = await fetch("/api/uploads", {
        method: "POST",
        headers: {
          "Idempotency-Key": `upload:upi-proof:${file.name}:${file.size}:${file.lastModified}`,
        },
        body: formData,
      });

      const data = (await response.json()) as { imageUrl?: string; error?: string };
      if (!response.ok || !data.imageUrl) {
        throw new Error(data.error ?? "Could not upload screenshot");
      }

      const imageUrl = data.imageUrl;
      setUpiProofImageUrl(imageUrl);

      toast.success("Payment screenshot uploaded");
    } catch (error) {
      console.error(error);
      toast.error("Could not upload screenshot");
    } finally {
      setUploadingProof(false);
    }
  };

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

  const handleCashfree = async (orderDraft: Record<string, unknown>) => {
    const checkoutRequestKey = buildClientIdempotencyKey("checkout:create-order:cashfree");
    const createOrderResponse = await fetch("/api/create-order", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Idempotency-Key": checkoutRequestKey,
      },
      body: JSON.stringify(orderDraft),
    });

    const createOrderData = (await createOrderResponse.json()) as CreateOrderResponse;

    if (!createOrderResponse.ok) {
      throw new Error(createOrderData.error ?? "Could not create payment session");
    }

    if (createOrderData.provider === "stripe" && createOrderData.url) {
      window.location.href = createOrderData.url;
      return;
    }

    if (createOrderData.provider !== "cashfree" || !createOrderData.paymentSessionId) {
      throw new Error("Cashfree did not return a payment session. Please check gateway settings.");
    }

    await loadCashfreeSdk();

    if (!window.Cashfree) {
      throw new Error("Cashfree checkout is not available. Please retry.");
    }

    const cashfree = window.Cashfree({
      mode: createOrderData.isSandbox ? "sandbox" : "production",
    });

    const checkoutResult = await cashfree.checkout({
      paymentSessionId: createOrderData.paymentSessionId,
      redirectTarget: "_self",
    });

    if (checkoutResult?.error?.message) {
      throw new Error(checkoutResult.error.message);
    }
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

    if (!hasAnyAvailablePaymentMethod) {
      toast.error(pricingConfig.payments.message || "No payment option is available right now.");
      return;
    }

    if (!selectedPaymentAvailable) {
      toast.error(pricingConfig.payments.message || "Selected payment option is not available for this order.");
      return;
    }

    if (paymentMethod === "upi-offline" && !upiProofImageUrl) {
      toast.error("Upload payment screenshot to continue.");
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
      if (paymentMethod === "cashfree") {
        await handleCashfree(orderDraft);
      } else if (paymentMethod === "upi-offline") {
        const response = await fetch("/api/payments/upi", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": `upi:${upiTransactionId.trim() || upiProofImageUrl}`,
          },
          body: JSON.stringify({
            orderDraft,
            upiVpa: upiId,
            proofImageUrl: upiProofImageUrl,
            transactionId: upiTransactionId.trim() || undefined,
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.order?.id) {
          throw new Error(data.error ?? "Unable to submit UPI payment proof");
        }

        clearCart();
        toast.success("UPI proof submitted. Order pending verification.");
        router.push(`/orders/${data.order.id}`);
      } else {
        const response = await fetch("/api/payments/cod", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Idempotency-Key": buildClientIdempotencyKey("checkout:cod"),
          },
          body: JSON.stringify(orderDraft),
        });

        const data = await response.json();

        if (!response.ok || !data.order?.id) {
          throw new Error(data.error ?? "Unable to place COD order");
        }

        clearCart();
        toast.success("COD order placed. Pay on delivery.");
        router.push(`/orders/${data.order.id}`);
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
          <p className="mt-2 text-sm text-slate-600">Secure online payments, offline UPI verification, or cash on delivery.</p>

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
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {cashfreeAvailable ? (
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "cashfree"}
                  onChange={() => setPaymentMethod("cashfree")}
                />
                Online payment
              </label>
            ) : null}
            {offlineUpiAvailable ? (
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "upi-offline"}
                  onChange={() => setPaymentMethod("upi-offline")}
                />
                UPI Offline
              </label>
            ) : null}
            {codAvailable ? (
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />
                Cash on Delivery
              </label>
            ) : null}
          </div>
          {hasAnyAvailablePaymentMethod ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {cashfreeAvailable
                ? onlinePaymentLabels.map((label) => (
                    <span key={label} className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      {label}
                    </span>
                  ))
                : null}
              {offlineUpiAvailable ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">Manual UPI</span>
              ) : null}
              {codAvailable ? (
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">COD</span>
              ) : null}
            </div>
          ) : (
            <p className="mt-3 text-sm text-slate-600">No payment method is available for this order right now.</p>
          )}
          {pricingConfig.payments.availableMethods.cod && !pricingConfig.payments.availableGateways.cod ? (
            <p className="mt-2 text-xs text-amber-600">
              COD is enabled in admin, but it is not available for this cart total or pincode.
            </p>
          ) : null}
          {pricingConfig.payments.availableMethods.cashfree && !pricingConfig.payments.availableGateways.cashfree ? (
            <p className="mt-2 text-xs text-amber-600">
              Cashfree is enabled in admin, but App ID and Secret Key are required before checkout can create a payment session.
            </p>
          ) : null}

          {paymentMethod === "upi-offline" ? (
            <div className="mt-4 space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Image
                  src={upiQrUrl}
                  alt="UPI QR code"
                  width={160}
                  height={160}
                  className="h-40 w-40 rounded-lg border border-slate-200 bg-white object-contain p-2"
                />
                <div className="space-y-2 text-sm text-slate-700">
                  <p className="font-semibold">Scan & pay using any UPI app</p>
                  <p>UPI ID: {upiId}</p>
                  <p>Amount: {formatCurrency(summary.total)}</p>
                  <p>Note: {upiPaymentNote}</p>
                  <a href={upiPaymentLink} className="inline-block rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-white">
                    Open UPI App Link
                  </a>
                </div>
              </div>

              <label className="block text-sm font-medium text-slate-700">
                Upload Payment Screenshot (Required)
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      uploadUpiProof(file);
                    }
                  }}
                  className="mt-2 block w-full text-sm"
                />
                {uploadingProof ? <p className="mt-1 text-xs text-slate-500">Uploading screenshot...</p> : null}
                {upiProofImageUrl ? <p className="mt-1 text-xs text-emerald-600">Screenshot uploaded successfully.</p> : null}
              </label>

              <Input
                placeholder="Transaction ID (Optional)"
                value={upiTransactionId}
                onChange={(event) => setUpiTransactionId(event.target.value)}
              />
            </div>
          ) : paymentMethod === "cod" ? (
            <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-ink">Pay when your order arrives</p>
              <p className="mt-1">Keep {formatCurrency(summary.total)} ready at delivery. COD availability is controlled by order value and pincode in Admin Payment Settings.</p>
            </div>
          ) : (
            <p className="mt-2 text-xs text-slate-500">
              Accepted online methods: {onlinePaymentLabels.length ? onlinePaymentLabels.join(", ") : "configured by admin"}.
            </p>
          )}

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
            (paymentMethod === "upi-offline" && !upiProofImageUrl) ||
            pricingConfig.operations.maintenanceMode ||
            !pricingConfig.operations.checkoutEnabled ||
            !pricingConfig.delivery.allowed ||
            !hasAnyAvailablePaymentMethod ||
            !selectedPaymentAvailable
          }
        >
          {pricingConfig.operations.maintenanceMode || !pricingConfig.operations.checkoutEnabled
            ? "Checkout Disabled"
            : submitting
              ? "Processing..."
              : paymentMethod === "upi-offline"
                ? "Submit UPI Proof"
                : paymentMethod === "cod"
                  ? `Place COD Order ${formatCurrency(summary.total)}`
                : `Pay ${formatCurrency(summary.total)}`}
        </Button>
      </form>

      <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-ink">Order Summary</h2>
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div key={`${item.productId}-${item.variantId ?? "default"}`} className="flex items-center justify-between text-sm">
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
