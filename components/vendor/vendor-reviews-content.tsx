"use client";

import { useState } from "react";
import { Star, Search, Reply, CheckCircle, Clock, MessageSquare, ThumbsUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Review {
  id: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  status: "published" | "pending" | "flagged";
  replied: boolean;
  helpful: number;
}



function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-stone-200"}`} />
      ))}
    </div>
  );
}

export function VendorReviewsContent({ initialReviews }: { initialReviews: any[] }) {
  const mappedReviews: Review[] = initialReviews.map(r => ({
    id: r.id,
    productName: r.productName || "Unknown Product",
    customerName: r.customerName || "Customer",
    rating: r.rating || 5,
    comment: r.content || r.comment || "No comment",
    date: r.createdAt || new Date().toISOString(),
    status: r.status || "published",
    replied: !!r.reply,
    helpful: r.helpful || 0
  }));

  const [reviews, setReviews] = useState<Review[]>(mappedReviews);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "pending" | "published" | "flagged">("all");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const filtered = reviews.filter((r) => {
    const matchSearch =
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.productName.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || r.status === filter;
    return matchSearch && matchFilter;
  });

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const pendingCount = reviews.filter((r) => r.status === "pending").length;

  function handleReply(id: string) {
    if (!replyText.trim()) return;
    setReviews((prev) => prev.map((r) => r.id === id ? { ...r, replied: true } : r));
    toast.success("Reply posted successfully");
    setReplyingId(null);
    setReplyText("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-stone-900">Reviews</h1>
        <p className="mt-0.5 text-sm text-stone-500">Monitor and respond to customer reviews</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 border border-amber-200">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Avg Rating</p>
              <p className="text-2xl font-bold text-stone-900">{avgRating} / 5</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-stone-50 border border-stone-200">
              <MessageSquare className="h-5 w-5 text-stone-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">Total Reviews</p>
              <p className="text-2xl font-bold text-stone-900">{reviews.length}</p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white border border-amber-200">
              <Clock className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">Awaiting Approval</p>
              <p className="text-2xl font-bold text-amber-900">{pendingCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-stone-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-xl border-stone-200" placeholder="Search reviews..." />
        </div>
        <div className="flex gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1">
          {(["all", "published", "pending", "flagged"] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition ${filter === f ? "bg-stone-900 text-white" : "text-stone-600 hover:text-stone-900"}`}
            >
              {f === "all" ? "All" : f}
            </button>
          ))}
        </div>
      </div>

      {/* Review Cards */}
      <div className="space-y-3">
        {filtered.map((review) => (
          <div key={review.id} className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-stone-900 text-sm font-bold text-white">
                  {review.customerName.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-stone-900">{review.customerName}</p>
                  <p className="text-xs text-stone-500 truncate">{review.productName}</p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StarRow rating={review.rating} />
                <Badge className={`text-xs ${review.status === "published" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : review.status === "pending" ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-red-50 text-red-700 border-red-200"} border`}>
                  {review.status}
                </Badge>
              </div>
            </div>

            <p className="mt-3 text-sm text-stone-700 leading-relaxed">{review.comment}</p>

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-stone-400">
                <span>{new Date(review.date).toLocaleDateString("en-IN")}</span>
                <span className="flex items-center gap-1">
                  <ThumbsUp className="h-3 w-3" /> {review.helpful} helpful
                </span>
                {review.replied && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <CheckCircle className="h-3 w-3" /> Replied
                  </span>
                )}
              </div>
              {!review.replied && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 rounded-lg gap-1.5 text-xs"
                  onClick={() => setReplyingId(replyingId === review.id ? null : review.id)}
                >
                  <Reply className="h-3.5 w-3.5" />
                  Reply
                </Button>
              )}
            </div>

            {replyingId === review.id && (
              <div className="mt-3 space-y-2 rounded-xl border border-stone-100 bg-stone-50 p-3">
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-stone-200 bg-white px-3 py-2 text-sm text-stone-900 outline-none focus:border-stone-400 transition resize-none"
                  placeholder="Write a helpful reply to this review..."
                />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="outline" className="h-7 rounded-lg text-xs" onClick={() => { setReplyingId(null); setReplyText(""); }}>
                    Cancel
                  </Button>
                  <Button size="sm" className="h-7 rounded-lg text-xs bg-stone-900 text-white hover:bg-stone-800" onClick={() => handleReply(review.id)}>
                    Post Reply
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-stone-300 p-10 text-center text-stone-400">
            <Star className="mx-auto mb-2 h-8 w-8 text-stone-300" />
            No reviews found
          </div>
        )}
      </div>
    </div>
  );
}
