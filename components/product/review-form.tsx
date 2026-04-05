"use client";

import { FormEvent, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function ReviewForm({ productId }: { productId: string }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);

    const response = await fetch(`/api/products/${productId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rating, comment }),
    });

    setSubmitting(false);

    if (!response.ok) {
      toast.error("Could not submit review");
      return;
    }

    setComment("");
    setRating(5);
    toast.success("Review posted");
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border border-slate-200 bg-white p-4">
      <h3 className="text-sm font-semibold text-ink">Write a review</h3>
      <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="rounded-lg border border-slate-200 px-3 py-2 text-sm">
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>{value} Star</option>
        ))}
      </select>
      <Textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share your experience" required />
      <Button disabled={submitting}>{submitting ? "Submitting..." : "Submit Review"}</Button>
    </form>
  );
}
