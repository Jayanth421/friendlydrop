"use client";

import { toast } from "sonner";

export function UploadModerationActions({ uploadId }: { uploadId: string }) {
  const update = async (status: "approved" | "rejected" | "flagged") => {
    const response = await fetch(`/api/admin/uploads/${uploadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      toast.error("Could not update upload status");
      return;
    }

    toast.success("Upload updated");
  };

  return (
    <div className="flex gap-1">
      <button onClick={() => update("approved")} className="rounded bg-green-100 px-2 py-1 text-xs">Approve</button>
      <button onClick={() => update("rejected")} className="rounded bg-red-100 px-2 py-1 text-xs">Reject</button>
      <button onClick={() => update("flagged")} className="rounded bg-amber-100 px-2 py-1 text-xs">Flag</button>
    </div>
  );
}
