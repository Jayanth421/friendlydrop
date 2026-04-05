import { Review } from "@/types";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) {
    return <p className="text-sm text-slate-500">No reviews yet. Be the first one.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article key={review.id} className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="font-semibold text-ink">{review.userName}</p>
            <p className="text-sm text-slate-500">{new Date(review.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
          <p className="mt-1 text-amber-500">{"?".repeat(review.rating)}{"?".repeat(5 - review.rating)}</p>
          <p className="mt-2 text-sm text-slate-700">{review.comment}</p>
        </article>
      ))}
    </div>
  );
}
