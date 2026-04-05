import { requireAdminPermission } from "@/lib/auth/session";
import { getCoupons } from "@/lib/firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CouponForm } from "@/components/admin/coupon-form";

export default async function AdminCouponsPage() {
  await requireAdminPermission("coupons:manage");
  const coupons = await getCoupons();

  return (
    <div className="space-y-4">
      <CouponForm />
      <Card>
        <CardHeader>
          <CardTitle>Coupon Engine</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Expiry</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>{coupon.code}</TableCell>
                  <TableCell>{coupon.type}</TableCell>
                  <TableCell>{coupon.value}</TableCell>
                  <TableCell>{coupon.usedCount ?? 0}/{coupon.usageLimit ?? "8"}</TableCell>
                  <TableCell>{coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString("en-IN") : "-"}</TableCell>
                  <TableCell>{coupon.active ? "active" : "inactive"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
