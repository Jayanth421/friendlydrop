import { requireAdminPermission } from "@/lib/auth/session";
import { getVendorPayouts, getVendors } from "@/lib/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { VendorOnboardForm } from "@/components/admin/vendor-onboard-form";
import { VendorStatusUpdater } from "@/components/admin/vendor-status-updater";

export default async function AdminVendorsPage() {
  await requireAdminPermission("vendors:manage");
  const [vendors, payouts] = await Promise.all([getVendors(), getVendorPayouts()]);

  return (
    <div className="space-y-4">
      <VendorOnboardForm />

      <Card>
        <CardHeader>
          <CardTitle>Vendor & Seller Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Owner</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>KYC</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Sales</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.businessName}</TableCell>
                  <TableCell>{vendor.ownerName}</TableCell>
                  <TableCell>{vendor.email}</TableCell>
                  <TableCell>{vendor.kycVerified ? "Verified" : "Pending"}</TableCell>
                  <TableCell>{vendor.commissionPercent}%</TableCell>
                  <TableCell>{formatCurrency(vendor.totalSales ?? 0)}</TableCell>
                  <TableCell>
                    <VendorStatusUpdater vendorId={vendor.id} status={vendor.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Vendor Payout Settlements</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Payout ID</TableHead>
                <TableHead>Vendor</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((payout) => (
                <TableRow key={payout.id}>
                  <TableCell>{payout.id}</TableCell>
                  <TableCell>{payout.vendorId}</TableCell>
                  <TableCell>{payout.periodLabel}</TableCell>
                  <TableCell>{formatCurrency(payout.amount)}</TableCell>
                  <TableCell>{payout.status}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
