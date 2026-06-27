"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ExpenseForm() {
  const [category, setCategory] = useState("operations");
  const [amount, setAmount] = useState(0);
  const [note, setNote] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();

    const response = await fetch("/api/admin/finance/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, amount: Number(amount), note }),
    });

    if (!response.ok) {
      toast.error("Could not add expense");
      return;
    }

    toast.success("Expense added");
    setAmount(0);
    setNote("");
  };

  return (
    <Card>
      <CardHeader><CardTitle>Add Expense</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-2 sm:grid-cols-3">
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 rounded border border-slate-200 px-2">
            <option value="shipping">shipping</option>
            <option value="marketing">marketing</option>
            <option value="operations">operations</option>
            <option value="other">other</option>
          </select>
          <input value={amount} onChange={(event) => setAmount(Number(event.target.value))} type="number" className="h-10 rounded border border-slate-200 px-2" />
          <input value={note} onChange={(event) => setNote(event.target.value)} placeholder="note" className="h-10 rounded border border-slate-200 px-2" />
          <button className="rounded bg-ink px-3 py-2 text-sm font-semibold text-white sm:col-span-3">Add expense</button>
        </form>
      </CardContent>
    </Card>
  );
}
