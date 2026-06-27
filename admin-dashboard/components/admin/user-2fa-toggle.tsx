"use client";

import { useState } from "react";
import { toast } from "sonner";

export function UserTwoFactorToggle({ userId, enabled }: { userId: string; enabled: boolean }) {
  const [checked, setChecked] = useState(enabled);

  const update = async (next: boolean) => {
    setChecked(next);

    const response = await fetch(`/api/admin/users/${userId}/2fa`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: next }),
    });

    if (!response.ok) {
      setChecked(enabled);
      toast.error("Could not update 2FA");
      return;
    }

    toast.success("2FA updated");
  };

  return (
    <label className="inline-flex items-center gap-2 text-xs">
      <input type="checkbox" checked={checked} onChange={(event) => update(event.target.checked)} />
      {checked ? "enabled" : "disabled"}
    </label>
  );
}
