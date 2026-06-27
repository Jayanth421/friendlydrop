"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, Paperclip, Send } from "lucide-react";
import { toast } from "sonner";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { SupportChatAttachment, SupportTicket } from "@/types";
import { normalizeMediaReference, resolveMediaUrl } from "@/lib/media";

function attachmentTypeForFile(file: File): SupportChatAttachment["type"] {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  if (file.type === "application/pdf") return "pdf";
  return "file";
}

export function CustomerSupportWidget() {
  const pathname = usePathname();
  const { user, role } = useAuth();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [activeTicketId, setActiveTicketId] = useState<string>("");
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<SupportChatAttachment[]>([]);
  const typingTimer = useRef<NodeJS.Timeout | null>(null);
  const seenMessageCount = useRef<Record<string, number>>({});

  const hidden = !user || role !== "user" || pathname.startsWith("/admin") || pathname.startsWith("/vendor");

  const activeTicket = useMemo(
    () => tickets.find((ticket) => ticket.id === activeTicketId) ?? tickets[0] ?? null,
    [activeTicketId, tickets],
  );

  const loadTickets = async () => {
    if (hidden) return;
    const response = await fetch("/api/support/chat", { cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as { tickets?: SupportTicket[] };
    if (!response.ok) return;
    setTickets(data.tickets ?? []);
    if (!activeTicketId && data.tickets?.[0]?.id) {
      setActiveTicketId(data.tickets[0].id);
    }
  };

  useEffect(() => {
    if (!open || hidden) return;
    setLoading(true);
    loadTickets().finally(() => setLoading(false));
    const timer = setInterval(loadTickets, 3500);
    return () => clearInterval(timer);
  }, [open, hidden]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!activeTicket?.id) {
      return;
    }

    const currentCount = activeTicket.messages.length;
    const previousCount = seenMessageCount.current[activeTicket.id] ?? 0;
    if (previousCount && currentCount > previousCount) {
      const latest = activeTicket.messages[activeTicket.messages.length - 1];
      if (latest && latest.byRole !== "customer") {
        toast.info("New support reply received");
      }
    }
    seenMessageCount.current[activeTicket.id] = currentCount;
  }, [activeTicket?.id, activeTicket?.messages]);

  useEffect(() => {
    if (!open || !activeTicket?.id) return;
    if (typingTimer.current) {
      clearTimeout(typingTimer.current);
    }

    fetch(`/api/support/chat`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: activeTicket.id, typing: Boolean(input.trim()) }),
    }).catch(() => undefined);

    typingTimer.current = setTimeout(() => {
      fetch(`/api/support/chat`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: activeTicket.id, typing: false }),
      }).catch(() => undefined);
    }, 1800);

    return () => {
      if (typingTimer.current) {
        clearTimeout(typingTimer.current);
      }
    };
  }, [input, open, activeTicket?.id]);

  if (hidden) {
    return null;
  }

  const uploadAttachment = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "support-chat");
    formData.append("record", "true");
    const response = await fetch("/api/uploads", {
      method: "POST",
      headers: {
        "Idempotency-Key": `upload:support:${file.name}:${file.size}:${file.lastModified}`,
      },
      body: formData,
    });
    const payload = (await response.json()) as { path?: string; imageUrl?: string; error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? "Upload failed");
    }
    const reference = normalizeMediaReference(payload.path ?? payload.imageUrl);
    if (!reference) {
      throw new Error("Invalid upload response");
    }
    return {
      url: reference,
      type: attachmentTypeForFile(file),
      name: file.name,
      sizeBytes: file.size,
    } as SupportChatAttachment;
  };

  const sendMessage = async () => {
    const message = input.trim();
    if (!message && !attachments.length) {
      return;
    }

    setSending(true);
    try {
      if (!activeTicket?.id) {
        const response = await fetch("/api/support/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subject: "Customer support request",
            message: message || "Shared files for support review",
            attachments: attachments.length ? attachments : undefined,
          }),
        });

        const payload = (await response.json()) as { ticket?: SupportTicket; error?: string };
        if (!response.ok || !payload.ticket) {
          throw new Error(payload.error ?? "Could not create support chat");
        }

        setTickets((prev) => [payload.ticket!, ...prev]);
        setActiveTicketId(payload.ticket.id);
      } else {
        const response = await fetch("/api/support/chat", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ticketId: activeTicket.id,
            message: message || "Shared files for support review",
            attachments: attachments.length ? attachments : undefined,
          }),
        });
        if (!response.ok) {
          throw new Error("Could not send message");
        }
      }

      setInput("");
      setAttachments([]);
      await loadTickets();
    } catch (error) {
      console.error(error);
      toast.error("Could not send support message");
    } finally {
      setSending(false);
    }
  };

  const requestAgent = async () => {
    if (!activeTicket?.id) return;
    const response = await fetch("/api/support/chat", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId: activeTicket.id, connectAgent: true }),
    });

    if (!response.ok) {
      toast.error("Could not connect to support agent");
      return;
    }

    toast.success("Support agent requested");
    await loadTickets();
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open ? (
        <div className="w-[340px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
            <p className="text-sm font-semibold">Support Chat</p>
            <button type="button" className="text-xs text-slate-500" onClick={() => setOpen(false)}>Close</button>
          </div>

          <div className="max-h-[340px] space-y-2 overflow-y-auto px-3 py-3">
            {loading ? <p className="text-xs text-slate-500">Loading conversation...</p> : null}
            {!loading && !activeTicket ? (
              <p className="text-xs text-slate-500">
                Start with the assistant bot. You can request a human support agent anytime.
              </p>
            ) : null}

            {activeTicket?.messages.map((msg) => {
              const mine = msg.byRole === "customer";
              return (
                <div key={msg.id} className={`max-w-[85%] rounded-lg px-2 py-1.5 text-xs ${mine ? "ml-auto bg-emerald-600 text-white" : "bg-slate-100 text-slate-700"}`}>
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
            {activeTicket?.staffTyping ? <p className="text-[11px] text-slate-500">Support team is typing...</p> : null}
          </div>

          <div className="space-y-2 border-t border-slate-200 p-2">
            <div className="flex items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-1 rounded border border-slate-300 px-2 py-1 text-[11px]">
                <Paperclip className="h-3 w-3" />
                File
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
              <button type="button" className="rounded border border-slate-300 px-2 py-1 text-[11px]" onClick={requestAgent}>
                Connect Agent
              </button>
            </div>
            {attachments.length ? <p className="text-[11px] text-slate-500">{attachments.length} attachment(s) ready</p> : null}
            <div className="flex items-center gap-2">
              <input
                className="h-9 flex-1 rounded border border-slate-300 px-2 text-sm outline-none"
                placeholder="Type your message..."
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <button type="button" className="inline-flex h-9 w-9 items-center justify-center rounded bg-emerald-600 text-white" onClick={sendMessage} disabled={sending}>
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button type="button" className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-sm text-white shadow-xl" onClick={() => setOpen(true)}>
          <MessageCircle className="h-4 w-4" />
          Support
        </button>
      )}
    </div>
  );
}
