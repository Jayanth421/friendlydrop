import { requireAdminPermission } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MediaLibrary } from "@/components/admin/media-library";

export default async function AdminMediaPage() {
  await requireAdminPermission("products:manage");

  return (
    <Card>
      <CardHeader>
        <CardTitle>QOENS Media Library</CardTitle>
      </CardHeader>
      <CardContent>
        <MediaLibrary />
      </CardContent>
    </Card>
  );
}

