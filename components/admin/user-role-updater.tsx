"use client";

import { useState } from "react";
import { toast } from "sonner";
import { UserRole } from "@/types";

export function UserRoleUpdater({ userId, currentRole }: { userId: string; currentRole: UserRole }) {
  const [role, setRole] = useState<UserRole>(currentRole);

  const onChange = async (nextRole: UserRole) => {
    setRole(nextRole);

    const response = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });

    if (!response.ok) {
      setRole(currentRole);
      toast.error("Could not update role");
      return;
    }

    toast.success("Role updated");
  };

  return (
    <select value={role} onChange={(event) => onChange(event.target.value as UserRole)} className="h-9 rounded-md border border-slate-200 px-2 text-sm">
      <option value="user">user</option>
      <option value="vendor">vendor</option>
      <option value="staff">staff</option>
      <option value="manager">manager</option>
      <option value="admin">admin</option>
      <option value="super_admin">super admin</option>
    </select>
  );
}
