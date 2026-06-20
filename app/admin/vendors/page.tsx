import { requireAdminPermission } from "@/lib/auth/session";
import { getVendorPayouts, getVendors } from "@/lib/enterprise";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { VendorOnboardForm } from "@/components/admin/vendor-onboard-form";
import { VendorStatusUpdater } from "@/components/admin/vendor-status-updater";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { BarChart3, ClipboardList, Store, Wallet } from "lucide-react";

export default async function AdminVendorsPage() {
  await requireAdminPermission("vendors:manage");
  const [vendors, payouts] = await Promise.all([getVendors(), getVendorPayouts()]);
  const approvedVendors = vendors.filter((vendor) => vendor.status === "approved").length;
  const pendingVendors = vendors.filter((vendor) => vendor.status === "pending").length;
  const totalVendorSales = vendors.reduce((sum, vendor) => sum + (vendor.totalSales ?? 0), 0);
  const pendingPayouts = payouts.filter((payout) => payout.status === "pending");
  const pendingPayoutAmount = pendingPayouts.reduce((sum, payout) => sum + payout.amount, 0);

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-slate-950 via-sky-900 to-indigo-900 p-5 text-white shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-sky-100">Vendor marketplace operations</p>
            <h1 className="mt-1 text-2xl font-semibold">Vendors, payouts, approval, and seller performance</h1>
          </div>
          <Button asChild className="bg-white text-slate-950 hover:bg-slate-100">
            <Link href="/vendor/dashboard">Open Vendor Dashboard</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {[
          { label: "Total Vendors", value: vendors.length.toLocaleString("en-IN"), icon: Store },
          { label: "Approved", value: approvedVendors.toLocaleString("en-IN"), icon: ClipboardList },
          { label: "Vendor Sales", value: formatCurrency(totalVendorSales), icon: BarChart3 },
          { label: "Pending Payouts", value: formatCurrency(pendingPayoutAmount), icon: Wallet },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.label}>
              <CardContent className="flex items-center justify-between gap-3 p-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.14em] text-slate-500">{item.label}</p>
                  <p className="mt-2 text-xl font-semibold text-ink">{item.value}</p>
                </div>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-sky-100 text-sky-700">
                  <Icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <VendorOnboardForm />

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Vendor & Seller Management</CardTitle>
            <Badge variant="outline">{pendingVendors} pending review</Badge>
          </div>
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
