import { requireAdminPermission } from "@/lib/auth/session";
import { getTransactions } from "@/lib/firebase/firestore";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusPill } from "@/components/admin/status-pill";

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
                <TableCell>{formatDate(txn.createdAt)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
