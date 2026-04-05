"use client";

import { useState } from "react";
import { toast } from "sonner";
import { SupportTicket } from "@/types";

export function SupportTicketUpdater({ ticket }: { ticket: SupportTicket }) {
  const [status, setStatus] = useState(ticket.status);
  const [assignedTo, setAssignedTo] = useState(ticket.assignedTo ?? "");

  const save = async () => {
    const response = await fetch(`/api/admin/support/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, assignedTo }),
    });

    if (!response.ok) {
      toast.error("Could not update ticket");
      return;
    }

    toast.success("Ticket updated");
  };

  return (
    <div className="flex items-center gap-1">
      <select value={status} onChange={(event) => setStatus(event.target.value as SupportTicket["status"])} className="h-8 rounded border border-slate-200 px-1 text-xs">
        <option value="open">open</option>
        <option value="in_progress">in progress</option>
        <option value="resolved">resolved</option>
      </select>
      <input value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)} placeholder="assignee" className="h-8 w-20 rounded border border-slate-200 px-1 text-xs" />
      <button onClick={save} className="rounded bg-slate-100 px-2 py-1 text-xs">Save</button>
    </div>
  );
}
