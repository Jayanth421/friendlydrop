"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ReturnRequest } from "@/types";

export function ReturnRequestUpdater({ request }: { request: ReturnRequest }) {
  const [status, setStatus] = useState(request.status);
  const [refundAmount, setRefundAmount] = useState(request.refundAmount ?? 0);

  const update = async () => {
    const response = await fetch(`/api/admin/returns/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, refundAmount: Number(refundAmount) }),
    });

    if (!response.ok) {
      toast.error("Could not update return request");
      return;
    }

    toast.success("Return request updated");
  };

  return (
    <div className="flex items-center gap-1">
      <select value={status} onChange={(event) => setStatus(event.target.value as ReturnRequest["status"])} className="h-8 rounded border border-slate-200 px-1 text-xs">
        <option value="requested">requested</option>
        <option value="approved">approved</option>
        <option value="rejected">rejected</option>
        <option value="refunded">refunded</option>
      </select>
      <input value={refundAmount} onChange={(event) => setRefundAmount(Number(event.target.value))} type="number" className="h-8 w-16 rounded border border-slate-200 px-1 text-xs" />
      <button onClick={update} className="rounded bg-slate-100 px-2 py-1 text-xs">Save</button>
    </div>
  );
}
