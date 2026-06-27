"use client";

import { useState } from "react";
import { toast } from "sonner";

export function UserStatusUpdater({ userId, currentStatus }: { userId: string; currentStatus: "active" | "suspended" | "blocked" }) {
  const [status, setStatus] = useState(currentStatus);

  const onChange = async (nextStatus: "active" | "suspended" | "blocked") => {
    setStatus(nextStatus);

    const response = await fetch(`/api/admin/customers/${userId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: nextStatus }),
    });

    if (!response.ok) {
      setStatus(currentStatus);
      toast.error("Could not update customer status");
      return;
    }

    toast.success("Customer status updated");
  };

  return (
    <select value={status} onChange={(event) => onChange(event.target.value as "active" | "suspended" | "blocked")} className="h-9 rounded-md border border-slate-200 px-2 text-sm">
      <option value="active">active</option>
      <option value="suspended">suspended</option>
      <option value="blocked">blocked</option>
    </select>
  );
}
