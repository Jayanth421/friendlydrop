"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { useCartStore } from "@/store/use-cart-store";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

function CashfreeReturnContent() {
  const params = useSearchParams();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<"processing" | "success" | "failed">("processing");
  const [errorMessage, setErrorMessage] = useState("");
  const [orderDetails, setOrderDetails] = useState<{ id: string; totalAmount: number } | null>(null);

  const orderId = params.get("order_id");

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      setErrorMessage("Missing order reference parameter.");
      setLoading(false);
      return;
    }

    let checkAttempts = 0;
    const maxAttempts = 3;

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/payments/cashfree/verify?order_id=${orderId}`);
        const data = await response.json();

        if (response.ok && data.ok) {
          clearCart();
          setStatus("success");
          setOrderDetails({
            id: data.order.id,
            totalAmount: data.order.totalAmount,
          });
          toast.success("Payment verified successfully!");
          
          // Redirect after 2 seconds
          setTimeout(() => {
            router.replace(`/orders/${data.order.id}`);
          }, 2500);
        } else {
          // If it is pending, retry a couple of times before declaring failure
          if (data.status === "PENDING" && checkAttempts < maxAttempts) {
            checkAttempts++;
            setTimeout(verifyPayment, 3000);
          } else {
            setStatus("failed");
            setErrorMessage(data.error || "Payment verification failed. Please check your bank statement.");
          }
        }
      } catch (error) {
        console.error("Verification error:", error);
        setStatus("failed");
        setErrorMessage("An error occurred while confirming payment status.");
      } finally {
        if (checkAttempts === 0 || checkAttempts >= maxAttempts) {
          setLoading(false);
        }
      }
    };

    verifyPayment();
  }, [clearCart, orderId, router]);

  return (
    <main className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg transition-all duration-300 hover:shadow-xl">
        {status === "processing" && (
          <div className="flex flex-col items-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
            <h1 className="font-display text-2xl font-bold text-ink">Confirming Payment</h1>
            <p className="text-sm text-slate-600">
              Please do not refresh or close this window. We are verifying your transaction with Cashfree.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="flex flex-col items-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-emerald-600 animate-bounce" />
            <h1 className="font-display text-2xl font-bold text-ink">Order Confirmed!</h1>
            <p className="text-sm text-emerald-600 font-medium">Payment Successful</p>
            {orderDetails && (
              <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-slate-700">
                <p>Order ID: <span className="font-mono font-semibold">{orderDetails.id}</span></p>
                <p>Amount Paid: <span className="font-semibold">{formatCurrency(orderDetails.totalAmount)}</span></p>
              </div>
            )}
            <p className="text-xs text-slate-500">
              Redirecting you to your order summary page shortly...
            </p>
            <Button 
              className="mt-2 w-full bg-emerald-600 hover:bg-emerald-700 text-white" 
              onClick={() => router.push(`/orders/${orderDetails?.id}`)}
            >
              Go to Order Details
            </Button>
          </div>
        )}

        {status === "failed" && (
          <div className="flex flex-col items-center space-y-4">
            <XCircle className="h-16 w-16 text-rose-600" />
            <h1 className="font-display text-2xl font-bold text-ink">Payment Verification Failed</h1>
            <p className="text-sm text-rose-600 font-medium">Unable to verify your payment</p>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-xs text-slate-600 max-w-xs font-mono">
              {errorMessage}
            </div>
            <p className="text-xs text-slate-500">
              If your bank account was debited, the order will automatically confirm via webhook shortly. You can retry paying otherwise.
            </p>
            <div className="flex w-full gap-3 pt-2">
              <Button 
                variant="outline" 
                className="w-1/2" 
                onClick={() => router.push("/orders")}
              >
                View Orders
              </Button>
              <Button 
                className="w-1/2 bg-orange-600 hover:bg-orange-700 text-white"
                onClick={() => router.push("/checkout")}
              >
                Back to Cart
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function CashfreeReturnPage() {
  return (
    <Suspense fallback={
      <main className="flex min-h-[70vh] items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-600" />
          <h1 className="font-display text-2xl font-bold text-ink">Verifying payment status...</h1>
        </div>
      </main>
    }>
      <CashfreeReturnContent />
    </Suspense>
  );
}
