import { requireAdminPermission } from "@/lib/auth/session";
import { getTransactions } from "@/lib/firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/admin/status-pill";
import { UpiProofActions } from "@/components/admin/upi-proof-actions";

export default async function AdminPaymentsPage() {
  await requireAdminPermission("payments:view");
  const transactions = await getTransactions();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Order</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>UPI Proof</TableHead>
              <TableHead>Review</TableHead>
              <TableHead>Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((txn) => (
              <TableRow key={txn.id}>
                <TableCell>{txn.id}</TableCell>
                <TableCell>{txn.orderId}</TableCell>
                <TableCell>{txn.provider}</TableCell>
                <TableCell>{formatCurrency(txn.amount)}</TableCell>
                <TableCell>
                  <StatusPill status={txn.status} />
                </TableCell>
                <TableCell>
                  {txn.proofImageUrl ? (
                    <a href={txn.proofImageUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">
                      View screenshot
                    </a>
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </TableCell>
                <TableCell>
                  {txn.provider === "upi_offline" ? (
                    <UpiProofActions transactionId={txn.id} proofStatus={txn.proofStatus} />
                  ) : (
                    <span className="text-xs text-slate-500">-</span>
                  )}
                </TableCell>
                <TableCell>{formatDate(txn.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
