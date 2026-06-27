import { Review } from "@/types";

export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (!reviews.length) {
    return <p className="border border-[#dddbdc] bg-white p-4 text-sm text-[#737373]">No reviews yet. Be the first one.</p>;
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <article key={review.id} className="border border-[#dddbdc] bg-white p-4 md:p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm uppercase tracking-[0.08em] text-[#262626]">{review.userName}</p>
            <p className="text-xs uppercase tracking-[0.08em] text-[#737373]">{new Date(review.createdAt).toLocaleDateString("en-IN")}</p>
          </div>
          <div className="mt-2 inline-flex border border-[#dddbdc] px-2 py-1 text-xs uppercase tracking-[0.08em] text-[#262626]">
            Rating: {review.rating}/5
          </div>
          <p className="mt-3 text-sm leading-6 text-[#555]">{review.comment}</p>
        </article>
      ))}
    </div>
  );
}
