"use client";

import { useState } from "react";
import { toast } from "sonner";

export function OrderStatusUpdater({ orderId, currentStatus }: { orderId: string; currentStatus: string }) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);

    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Could not update status");
      }

      toast.success("Order status updated");
    } catch (error) {
      console.error(error);
      toast.error("Status update failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-9 rounded-md border border-slate-200 px-2 text-sm">
        <option value="pending">pending</option>
        <option value="confirmed">confirmed</option>
        <option value="packed">packed</option>
        <option value="shipped">shipped</option>
        <option value="delivered">delivered</option>
        <option value="returned">returned</option>
        <option value="cancelled">cancelled</option>
        <option value="refunded">refunded</option>
      </select>
      <button disabled={saving} onClick={onSave} className="rounded-md bg-ink px-3 py-1.5 text-xs font-semibold text-white">
        {saving ? "..." : "Save"}
      </button>
    </div>
  );
}
