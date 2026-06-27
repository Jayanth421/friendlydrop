"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function UpiProofActions({
  transactionId,
  proofStatus,
}: {
  transactionId: string;
  proofStatus?: "pending" | "approved" | "rejected";
}) {
  const router = useRouter();
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const reviewProof = async (status: "approved" | "rejected") => {
    setSaving(true);
    try {
      const response = await fetch(`/api/admin/transactions/${transactionId}/upi-proof`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, note: note.trim() || undefined }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        toast.error(data?.error ?? "Could not update payment proof");
        return;
      }

      toast.success(status === "approved" ? "UPI payment approved" : "UPI payment rejected");
      router.refresh();
    } catch {
      toast.error("Could not update payment proof");
    } finally {
      setSaving(false);
    }
  };

  if (proofStatus === "approved" || proofStatus === "rejected") {
    return <p className="text-xs text-slate-500">Reviewed</p>;
  }

  return (
    <div className="space-y-2">
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Note (optional)"
        className="h-8 text-xs"
      />
      <div className="flex gap-1">
        <Button type="button" size="sm" className="h-8 px-2 text-xs" disabled={saving} onClick={() => reviewProof("approved")}>
          Approve
        </Button>
        <Button type="button" size="sm" variant="secondary" className="h-8 px-2 text-xs" disabled={saving} onClick={() => reviewProof("rejected")}>
          Reject
        </Button>
      </div>
    </div>
  );
}
