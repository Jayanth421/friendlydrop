"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function CustomerNotifyForm({ userId }: { userId: string }) {
  const [channel, setChannel] = useState<"email" | "sms" | "whatsapp" | "push">("email");
  const [subject, setSubject] = useState("FriendlyDrop Update");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSending(true);

    try {
      const response = await fetch(`/api/admin/customers/${userId}/notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel,
          subject: channel === "email" ? subject : undefined,
          message,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error ?? "Could not send notification");
        return;
      }

      toast.success("Notification sent");
      setMessage("");
    } catch {
      toast.error("Could not send notification");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-2 rounded-md border border-slate-200 p-3">
      <select value={channel} onChange={(event) => setChannel(event.target.value as typeof channel)} className="h-9 w-full rounded border border-slate-200 px-2 text-xs">
        <option value="email">email</option>
        <option value="sms">sms</option>
        <option value="whatsapp">whatsapp</option>
        <option value="push">push</option>
      </select>
      {channel === "email" ? <Input value={subject} onChange={(event) => setSubject(event.target.value)} className="h-9 text-xs" placeholder="Subject" /> : null}
      <Input value={message} onChange={(event) => setMessage(event.target.value)} className="h-9 text-xs" placeholder="Message" required />
      <Button size="sm" disabled={sending}>
        {sending ? "Sending..." : "Notify"}
      </Button>
    </form>
  );
}
