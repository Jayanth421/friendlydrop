import { requireAdminPermission } from "@/lib/auth/session";
import { getAllReviews } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ReviewModerationActions } from "@/components/admin/review-moderation-actions";

export default async function AdminReviewsPage() {
  await requireAdminPermission("reviews:manage");
  const reviews = await getAllReviews();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reviews Moderation</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Comment</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {reviews.map((review) => (
              <TableRow key={review.id}>
                <TableCell>{review.productId}</TableCell>
                <TableCell>{review.userName}</TableCell>
                <TableCell>{review.rating}/5</TableCell>
                <TableCell className="max-w-md truncate">{review.comment}</TableCell>
                <TableCell>{review.status ?? "pending"}</TableCell>
                <TableCell>
                  <ReviewModerationActions reviewId={review.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
