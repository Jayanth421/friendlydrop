"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { SupportChatAttachment, SupportTicket } from "@/types";
import { normalizeMediaReference, resolveMediaUrl } from "@/lib/media";

function minutesAgo(date?: string) {
  if (!date) return "unknown";
  const delta = Date.now() - new Date(date).getTime();
  const mins = Math.max(0, Math.round(delta / 60000));
  return `${mins}m ago`;
}

function isOnline(date?: string) {
  if (!date) return false;
  return Date.now() - new Date(date).getTime() <= 2 * 60 * 1000;
}

function attachmentTypeForFile(file: File): SupportChatAttachment["type"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "file";
}

export function SupportChatDashboard({ initialTickets }: { initialTickets: SupportTicket[] }) {
  const [tickets, setTickets] = useState(initialTickets);
  const [activeTicketId, setActiveTicketId] = useState(initialTickets[0]?.id ?? "");
  const [status, setStatus] = useState<SupportTicket["status"]>("open");
  const [assignedTo, setAssignedTo] = useState("");
  const [message, setMessage] = useState("");
  const [attachments, setAttachments] = useState<SupportChatAttachment[]>([]);
  const [saving, setSaving] = useState(false);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const seenMessageCount = useRef<Record<string, number>>({});

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId) ?? null,
    [activeTicketId, tickets],
  );

  useEffect(() => {
    if (!activeTicket) return;
    setStatus(activeTicket.status);
    setAssignedTo(activeTicket.assignedTo ?? "");
  }, [activeTicket?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeTicket?.id) {
      return;
    }

    const currentCount = activeTicket.messages.length;
    const previousCount = seenMessageCount.current[activeTicket.id] ?? 0;
    if (previousCount && currentCount > previousCount) {
      const latest = activeTicket.messages[activeTicket.messages.length - 1];
      if (latest?.byRole === "customer") {
        toast.info("New customer message");
      }
    }
    seenMessageCount.current[activeTicket.id] = currentCount;
  }, [activeTicket?.id, activeTicket?.messages]);

  const loadTickets = async () => {
    const response = await fetch("/api/admin/support", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as { tickets?: SupportTicket[] };
    if (!response.ok) {
      return;
    }
    setTickets(data.tickets ?? []);
    if (!activeTicketId && data.tickets?.[0]?.id) {
      setActiveTicketId(data.tickets[0].id);
    }
  };

  useEffect(() => {
    loadTickets().catch(() => undefined);
    const timer = setInterval(loadTickets, 3000);
    return () => clearInterval(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const updateTicket = async (payload: Record<string, unknown>) => {
    if (!activeTicket?.id) return;
    setSaving(true);
    const response = await fetch(`/api/admin/support/${activeTicket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);

    if (!response.ok) {
      toast.error("Could not update ticket");
      return;
    }

    const data = (await response.json().catch(() => ({}))) as { ticket?: SupportTicket };
    if (data.ticket) {
      setTickets((prev) => prev.map((item) => (item.id === data.ticket!.id ? data.ticket! : item)));
    }
  };

  const sendMessage = async () => {
    if (!activeTicket?.id || (!message.trim() && !attachments.length)) {
      return;
    }

    await updateTicket({
      message: message.trim() || "Shared files from support staff",
      attachments: attachments.length ? attachments : undefined,
      status,
      assignedTo: assignedTo || undefined,
      agentConnected: true,
    });
    setMessage("");
    setAttachments([]);
    await loadTickets();
  };

  const acceptTicket = async () => {
    await updateTicket({
      assignedTo: "__me__",
      status: "in_progress",
      agentConnected: true,
    });
    toast.success("Ticket accepted");
  };

  const setTyping = async (typing: boolean) => {
    if (!activeTicket?.id) return;
    await fetch(`/api/admin/support/${activeTicket.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ typing }),
    });
  };

  const onMessageChange = (value: string) => {
    setMessage(value);
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }
    setTyping(Boolean(value.trim())).catch(() => undefined);
    typingTimer.current = setTimeout(() => {
      setTyping(false).catch(() => undefined);
    }, 1800);
  };

  const uploadAttachment = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "support-chat");
    formData.append("record", "false");
    const response = await fetch("/api/uploads", { method: "POST", body: formData });
    const payload = (await response.json()) as { path?: string; imageUrl?: string; error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? "Upload failed");
    }
    const reference = normalizeMediaReference(payload.path ?? payload.imageUrl);
    if (!reference) {
      throw new Error("Invalid attachment reference");
    }
    return {
      url: reference,
      type: attachmentTypeForFile(file),
      name: file.name,
      sizeBytes: file.size,
    } as SupportChatAttachment;
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <div className="rounded-xl border border-slate-200 bg-white p-3">
        <div className="mb-2 flex items-center justify-between">
          <h3 className="text-sm font-semibold">Conversations</h3>
          <button type="button" className="text-xs text-slate-500" onClick={() => loadTickets()}>Refresh</button>
        </div>
        <div className="space-y-2">
          {tickets.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setActiveTicketId(ticket.id)}
              className={`w-full rounded border p-2 text-left ${activeTicketId === ticket.id ? "border-emerald-500 bg-emerald-50" : "border-slate-200"}`}
            >
              <p className="text-xs font-semibold">{ticket.subject}</p>
              <p className="text-[11px] text-slate-500">{ticket.userId}</p>
              <p className="text-[11px] text-slate-500">Status: {ticket.status}</p>
              <p className={`text-[11px] ${isOnline(ticket.lastCustomerSeenAt) ? "text-emerald-600" : "text-slate-500"}`}>
                Customer {isOnline(ticket.lastCustomerSeenAt) ? "online" : `last seen ${minutesAgo(ticket.lastCustomerSeenAt)}`}
              </p>
            </button>
          ))}
          {!tickets.length ? <p className="text-xs text-slate-500">No support tickets yet.</p> : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-3">
        {!activeTicket ? (
          <p className="text-sm text-slate-500">Select a conversation to begin.</p>
        ) : (
          <>
            <div className="mb-3 flex flex-wrap items-end gap-2 border-b border-slate-200 pb-3">
              <div className="min-w-[200px] flex-1">
                <p className="text-sm font-semibold">{activeTicket.subject}</p>
                <p className="text-xs text-slate-500">Ticket ID: {activeTicket.id}</p>
              </div>
              <select className="h-9 rounded border border-slate-200 px-2 text-sm" value={status} onChange={(event) => setStatus(event.target.value as SupportTicket["status"])}>
                <option value="open">open</option>
                <option value="in_progress">in progress</option>
                <option value="resolved">resolved</option>
              </select>
              <input className="h-9 rounded border border-slate-200 px-2 text-sm" value={assignedTo} placeholder="assigned user id" onChange={(event) => setAssignedTo(event.target.value)} />
              <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={acceptTicket}>Accept</button>
              <button type="button" className="rounded border border-slate-300 px-2 py-1 text-xs" onClick={() => updateTicket({ status, assignedTo: assignedTo || undefined })} disabled={saving}>Save</button>
            </div>

            <div className="max-h-[380px] space-y-2 overflow-y-auto">
              {activeTicket.messages.map((msg) => {
                const byCustomer = msg.byRole === "customer";
                return (
                  <div key={msg.id} className={`max-w-[88%] rounded-lg px-2 py-1.5 text-xs ${byCustomer ? "mr-auto bg-slate-100 text-slate-700" : "ml-auto bg-emerald-600 text-white"}`}>
                    <p>{msg.message}</p>
                    {msg.attachments?.length ? (
                      <div className="mt-1 space-y-1">
                        {msg.attachments.map((attachment, index) => {
                          const href = resolveMediaUrl(attachment.url) || attachment.url;
                          return (
                            <a key={`${attachment.url}-${index}`} href={href} target="_blank" rel="noreferrer" className="block underline">
                              {attachment.name || attachment.type}
                            </a>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
              {activeTicket.customerTyping ? <p className="text-[11px] text-slate-500">Customer is typing...</p> : null}
            </div>

            <div className="mt-3 border-t border-slate-200 pt-3">
              <div className="mb-2 flex items-center gap-2">
                <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-slate-300 px-2 py-1 text-[11px]">
                  <Paperclip className="h-3 w-3" />
                  Attach
                  <input
                    type="file"
                    accept="image/*,video/*,application/pdf,text/plain"
                    className="hidden"
                    onChange={async (event) => {
                      const file = event.target.files?.[0];
                      if (!file) return;
                      try {
                        const attachment = await uploadAttachment(file);
                        setAttachments((prev) => [...prev, attachment]);
                      } catch (error) {
                        console.error(error);
                        toast.error("Could not upload attachment");
                      }
                    }}
                  />
                </label>
                {attachments.length ? <p className="text-[11px] text-slate-500">{attachments.length} attachment(s) ready</p> : null}
              </div>
              <div className="flex items-center gap-2">
                <input
                  className="h-10 flex-1 rounded border border-slate-300 px-2 text-sm"
                  placeholder="Write a reply..."
                  value={message}
                  onChange={(event) => onMessageChange(event.target.value)}
                />
                <button type="button" className="inline-flex h-10 w-10 items-center justify-center rounded bg-emerald-600 text-white" onClick={sendMessage} disabled={saving}>
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
