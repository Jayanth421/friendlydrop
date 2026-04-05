"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShippingDetails } from "@/types";

export function ShippingUpdater({ orderId, shipping }: { orderId: string; shipping?: ShippingDetails }) {
  const [courier, setCourier] = useState(shipping?.courier ?? "");
  const [trackingId, setTrackingId] = useState(shipping?.trackingId ?? "");
  const [eta, setEta] = useState(shipping?.eta?.slice(0, 10) ?? "");

  const update = async () => {
    const response = await fetch(`/api/admin/orders/${orderId}/shipping`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courier, trackingId, eta: eta ? new Date(eta).toISOString() : undefined }),
    });

    if (!response.ok) {
      toast.error("Could not update shipping");
      return;
    }

    toast.success("Shipping updated");
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      <input value={courier} onChange={(event) => setCourier(event.target.value)} placeholder="Courier" className="h-8 w-20 rounded border border-slate-200 px-2 text-xs" />
      <input value={trackingId} onChange={(event) => setTrackingId(event.target.value)} placeholder="Tracking" className="h-8 w-24 rounded border border-slate-200 px-2 text-xs" />
      <input type="date" value={eta} onChange={(event) => setEta(event.target.value)} className="h-8 rounded border border-slate-200 px-2 text-xs" />
      <button onClick={update} className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">Set</button>
    </div>
  );
}
