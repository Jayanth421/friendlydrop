"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Star,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Copy,
  AlertCircle,
  MessageSquare,
  TrendingUp,
  Award,
  Loader2,
  Calendar,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Review, Product } from "@/types";
import { formatDate } from "@/lib/utils";

interface ReviewsManagerProps {
  reviews: Review[];
  products: Product[];
}

export function ReviewsManager({ reviews, products }: ReviewsManagerProps) {
  const router = useRouter();

  // Search & Filters state
  const [searchQuery, setSearchQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [ratingFilter, setRatingFilter] = React.useState<string>("all");

  // Local loading states per review for instant feedback
  const [updatingReviewId, setUpdatingReviewId] = React.useState<string | null>(null);

  // Map product info for quick lookup
  const productMap = React.useMemo(() => {
    const map = new Map<string, { name: string; image?: string }>();
    products.forEach((p) => {
      map.set(p.id, { name: p.name, image: p.primaryImage });
    });
    return map;
  }, [products]);

  // Moderation handler
  const handleModerate = async (reviewId: string, status: "approved" | "rejected") => {
    setUpdatingReviewId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        toast.success(`Review ${status} successfully`);
        router.refresh();
      } else {
        toast.error("Failed to moderate review");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setUpdatingReviewId(null);
    }
  };

  // Toggle Featured Review handler
  const handleToggleFeatured = async (reviewId: string, currentFeatured: boolean) => {
    setUpdatingReviewId(reviewId);
    try {
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ featured: !currentFeatured }),
      });

      if (res.ok) {
        toast.success(`Review ${!currentFeatured ? "marked as featured" : "removed from featured"}`);
        router.refresh();
      } else {
        toast.error("Failed to update review featured status");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred");
    } finally {
      setUpdatingReviewId(null);
    }
  };

  // Filter reviews locally for instantaneous results
  const filteredReviews = React.useMemo(() => {
    return reviews.filter((review) => {
      // Search text
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesUser = review.userName?.toLowerCase().includes(query);
        const matchesComment = review.comment?.toLowerCase().includes(query);
        const pInfo = productMap.get(review.productId);
        const matchesProduct = pInfo?.name?.toLowerCase().includes(query) || review.productId.toLowerCase().includes(query);
        if (!matchesUser && !matchesComment && !matchesProduct) return false;
      }

      // Status filter
      if (statusFilter !== "all") {
        if ((review.status ?? "pending") !== statusFilter) return false;
      }

      // Rating filter
      if (ratingFilter !== "all") {
        if (review.rating !== Number(ratingFilter)) return false;
      }

      return true;
    });
  }, [reviews, searchQuery, statusFilter, ratingFilter, productMap]);

  // Review Analytics
  const analytics = React.useMemo(() => {
    const total = reviews.length;
    const pending = reviews.filter((r) => (r.status ?? "pending") === "pending").length;
    const approved = reviews.filter((r) => r.status === "approved").length;
    const featuredCount = reviews.filter((r) => r.featured).length;

    const sumRating = reviews.reduce((sum, r) => sum + r.rating, 0);
    const avgRating = total > 0 ? Math.round((sumRating / total) * 10) / 10 : 0;

    // Distribution
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      const ratingKey = r.rating as 5 | 4 | 3 | 2 | 1;
      if (distribution[ratingKey] !== undefined) {
        distribution[ratingKey] += 1;
      }
    });

    return {
      total,
      pending,
      approved,
      featuredCount,
      avgRating,
      distribution,
    };
  }, [reviews]);

  return (
    <div className="space-y-6">
      {/* Analytics Panel */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* KPI: Overview */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          <Card className="border-stone-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center shrink-0">
                <MessageSquare className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{analytics.total}</p>
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Total Reviews</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                <AlertCircle className="h-5 w-5 animate-pulse" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{analytics.pending}</p>
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Pending Moderation</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{analytics.approved}</p>
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Approved Reviews</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-stone-200">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Award className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-stone-900">{analytics.featuredCount}</p>
                <p className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider">Featured on Site</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI: Average Rating */}
        <Card className="border-stone-200 flex flex-col justify-center">
          <CardContent className="p-5 text-center space-y-2">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white shadow-md">
              <Star className="h-7 w-7 fill-current" />
            </div>
            <div>
              <p className="text-3xl font-extrabold text-stone-900">{analytics.avgRating} <span className="text-sm font-medium text-stone-400">/ 5</span></p>
              <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider mt-0.5">Average Rating Score</p>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Card */}
        <Card className="border-stone-200">
          <CardContent className="p-4 space-y-2">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider">Rating Distribution</h4>
            <div className="space-y-1.5 pt-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = analytics.distribution[rating as 5|4|3|2|1] || 0;
                const percentage = analytics.total > 0 ? (count / analytics.total) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-xs">
                    <span className="w-3 font-semibold text-stone-600">{rating}★</span>
                    <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div className="bg-amber-400 h-full rounded-full" style={{ width: `${percentage}%` }} />
                    </div>
                    <span className="w-6 text-right font-medium text-stone-500">{count}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <Input
            placeholder="Search by user, comment, product title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-stone-200 focus:border-stone-400"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:inline">Status:</span>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-10 w-[130px] rounded-xl border-stone-200">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Rating filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider hidden md:inline">Rating:</span>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="h-10 w-[120px] rounded-xl border-stone-200">
                <SelectValue placeholder="All Ratings" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Main Reviews Moderation Table */}
      <Card className="border-stone-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-stone-50/70 border-b border-stone-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">Product</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">User Details</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">Rating</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">Review Comments</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-stone-600 font-semibold h-11 text-xs uppercase tracking-wider text-right pr-6">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-stone-500 font-medium">
                    No reviews matching your search criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredReviews.map((review) => {
                  const pInfo = productMap.get(review.productId);
                  const isFeatured = review.featured ?? false;
                  const status = review.status ?? "pending";
                  const isLoading = updatingReviewId === review.id;

                  return (
                    <TableRow key={review.id} className="hover:bg-stone-50/50 transition border-b border-stone-150">
                      {/* Product Thumbnail & Name */}
                      <TableCell className="py-3">
                        <div className="flex items-center gap-2.5 max-w-[200px]">
                          {pInfo?.image ? (
                            <img src={pInfo.image} alt="" className="h-8 w-8 rounded object-cover border border-stone-150 shrink-0" />
                          ) : (
                            <div className="h-8 w-8 rounded bg-stone-100 flex items-center justify-center shrink-0 text-stone-400">
                              ★
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-stone-900 text-xs block truncate" title={pInfo?.name || "Deleted Product"}>
                              {pInfo?.name || "Deleted Product"}
                            </span>
                            <span className="text-[10px] font-mono text-stone-500 block truncate">
                              ID: {review.productId}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* User details */}
                      <TableCell className="font-medium text-xs text-stone-850">
                        {review.userName}
                      </TableCell>

                      {/* Stars */}
                      <TableCell>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`h-3.5 w-3.5 ${
                                star <= review.rating ? "text-amber-450 fill-amber-400" : "text-stone-200"
                              }`}
                            />
                          ))}
                        </div>
                      </TableCell>

                      {/* Comment text */}
                      <TableCell className="max-w-xs md:max-w-md">
                        <p className="text-xs text-stone-700 leading-relaxed font-medium break-words">
                          {review.comment}
                        </p>
                      </TableCell>

                      {/* Created date */}
                      <TableCell className="text-[11px] text-stone-500 whitespace-nowrap">
                        {formatDate(review.createdAt)}
                      </TableCell>

                      {/* Moderation Status badge */}
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`capitalize font-semibold text-[10px] ${
                            status === "approved"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : status === "rejected"
                                ? "border-rose-200 bg-rose-50 text-rose-700"
                                : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {status}
                        </Badge>
                      </TableCell>

                      {/* Control actions */}
                      <TableCell className="text-right py-3 pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-stone-500" />
                          ) : (
                            <>
                              {/* Toggle Featured */}
                              <button
                                onClick={() => handleToggleFeatured(review.id, isFeatured)}
                                className={`rounded-lg p-1.5 transition ${
                                  isFeatured
                                    ? "text-amber-500 hover:text-amber-600 bg-amber-50"
                                    : "text-stone-300 hover:text-stone-400 hover:bg-stone-50"
                                }`}
                                title={isFeatured ? "Unfeature review" : "Feature review"}
                              >
                                <Star className="h-4 w-4 fill-current" />
                              </button>

                              {/* Action: Approve */}
                              {status !== "approved" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleModerate(review.id, "approved")}
                                  className="h-8 rounded-lg text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5"
                                >
                                  Approve
                                </Button>
                              )}

                              {/* Action: Reject */}
                              {status !== "rejected" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleModerate(review.id, "rejected")}
                                  className="h-8 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5"
                                >
                                  Reject
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
