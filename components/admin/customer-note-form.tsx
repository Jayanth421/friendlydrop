"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";

export function CustomerNoteForm({ userId }: { userId: string }) {
  const [note, setNote] = useState("");

  const save = async (event: FormEvent) => {
    event.preventDefault();

    if (!note.trim()) {
      return;
    }

    const response = await fetch(`/api/admin/customers/${userId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note }),
    });

    if (!response.ok) {
      toast.error("Could not save note");
      return;
    }

    setNote("");
    toast.success("Note saved");
  };

  return (
    <form onSubmit={save} className="flex items-center gap-1">
      <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Internal note" className="h-8 w-36 rounded border border-slate-200 px-2 text-xs" />
      <button className="rounded bg-slate-100 px-2 py-1 text-xs">Add</button>
    </form>
  );
}
