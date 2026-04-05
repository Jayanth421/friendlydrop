"use client";

import { useState } from "react";
import { toast } from "sonner";

export function OrderRefundButton({ orderId }: { orderId: string }) {
  const [processing, setProcessing] = useState(false);

  const refund = async () => {
    const reason = window.prompt("Refund reason", "Customer request");

    if (!reason) {
      return;
    }

    setProcessing(true);

    const response = await fetch(`/api/admin/orders/${orderId}/refund`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 0, reason }),
    });

    setProcessing(false);

    if (!response.ok) {
      toast.error("Refund failed");
      return;
    }

    toast.success("Refund workflow triggered");
  };

  return (
    <button disabled={processing} onClick={refund} className="rounded bg-red-50 px-2 py-1 text-xs text-red-700">
      {processing ? "..." : "Refund"}
    </button>
  );
}
