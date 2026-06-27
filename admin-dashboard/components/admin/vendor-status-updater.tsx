"use client";

import { useState } from "react";
import { toast } from "sonner";

export function VendorStatusUpdater({
  vendorId,
  status,
}: {
  vendorId: string;
  status: "pending" | "approved" | "rejected" | "suspended";
}) {
  const [value, setValue] = useState(status);

  const onChange = async (next: typeof value) => {
    setValue(next);

    const response = await fetch(`/api/admin/vendors/${vendorId}/approval`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });

    if (!response.ok) {
      setValue(status);
      toast.error("Could not update vendor status");
      return;
    }

    toast.success("Vendor status updated");
  };

  return (
    <select value={value} onChange={(event) => onChange(event.target.value as typeof value)} className="h-9 rounded border border-slate-200 px-2 text-sm">
      <option value="pending">pending</option>
      <option value="approved">approved</option>
      <option value="rejected">rejected</option>
      <option value="suspended">suspended</option>
    </select>
  );
}
