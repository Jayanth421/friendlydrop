import { requireAdminPermission } from "@/lib/auth/session";
import { getAllReviews, getProducts } from "@/lib/firebase/firestore";
import { ReviewsManager } from "./reviews-manager";

export default async function AdminReviewsPage() {
  await requireAdminPermission("reviews:manage");

  // Fetch reviews and products in parallel to map names on the client
  const [reviews, products] = await Promise.all([
    getAllReviews(),
    getProducts(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-stone-900">Reviews Moderation</h1>
        <p className="mt-1 text-sm text-stone-500">Moderate customer comments, manage website visibility, and analyze store rating analytics.</p>
      </div>

      {/* Main Reviews moderation manager */}
      <ReviewsManager reviews={reviews} products={products} />
    </div>
  );
}
