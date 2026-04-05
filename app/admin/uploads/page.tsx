import { requireAdminPermission } from "@/lib/auth/session";
import { getUploadsForAdmin } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UploadModerationActions } from "@/components/admin/upload-moderation-actions";

export default async function AdminUploadsPage() {
  await requireAdminPermission("orders:manage");
  const uploads = await getUploadsForAdmin();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Custom Design Uploads</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Preview</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {uploads.map((upload) => (
              <TableRow key={upload.id}>
                <TableCell>
                  <a href={upload.imageUrl} target="_blank" className="text-accent" rel="noreferrer">
                    View image
                  </a>
                </TableCell>
                <TableCell>{upload.userId}</TableCell>
                <TableCell>{upload.orderId ?? "-"}</TableCell>
                <TableCell>{upload.status ?? "pending"}</TableCell>
                <TableCell>
                  <UploadModerationActions uploadId={upload.id} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
