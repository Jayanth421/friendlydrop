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
    <form onSubmit={submit} className="space-y-4 border border-[#dddbdc] bg-white p-4 md:p-5">
      <h3 className="text-[12px] uppercase tracking-[0.08em] text-[#262626]">Write a review</h3>
      <select value={rating} onChange={(event) => setRating(Number(event.target.value))} className="h-11 border border-[#dddbdc] px-3 text-sm text-[#262626] outline-none focus:border-[#262626]">
        {[5, 4, 3, 2, 1].map((value) => (
          <option key={value} value={value}>{value} Star</option>
        ))}
      </select>
      <Textarea className="rounded-none border-[#dddbdc] text-sm focus-visible:ring-0 focus-visible:ring-offset-0" value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Share your experience" required />
      <Button className="h-11 rounded-none bg-[#262626] text-xs font-medium uppercase tracking-[0.12em] text-white hover:bg-black" disabled={submitting}>{submitting ? "Submitting..." : "Submit Review"}</Button>
    </form>
  );
}
