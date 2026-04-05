import { requireAdminPermission } from "@/lib/auth/session";
import { getBanners, getMarketingInsights } from "@/lib/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BannerForm } from "@/components/admin/banner-form";

export default async function AdminBannersPage() {
  await requireAdminPermission("banners:manage");
  const [banners, marketing] = await Promise.all([getBanners(), getMarketingInsights()]);

  return (
    <div className="space-y-4">
      <BannerForm />

      <Card>
        <CardHeader>
          <CardTitle>Banner & Homepage Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Link</TableHead>
                <TableHead>Position</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Campaign</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {banners.map((banner) => (
                <TableRow key={banner.id}>
                  <TableCell className="font-medium">{banner.title}</TableCell>
                  <TableCell>{banner.type}</TableCell>
                  <TableCell>{banner.linkType}: {banner.linkTarget}</TableCell>
                  <TableCell>{banner.position}</TableCell>
                  <TableCell>{banner.active ? "active" : "inactive"}</TableCell>
                  <TableCell>{banner.linkedCampaignId ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign-to-Banner Sync</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>Active campaigns: {marketing.activeCampaigns.length}</p>
          <p>Active banners: {marketing.activeBanners.length}</p>
          <p>Rule: Campaign status changes can automatically toggle linked offer banners.</p>
        </CardContent>
      </Card>
    </div>
  );
}
