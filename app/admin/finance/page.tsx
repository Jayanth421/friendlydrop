import { requireAdminPermission } from "@/lib/auth/session";
import { getEnterpriseDashboardStats, getExpenses } from "@/lib/firebase/firestore";
import { formatCurrency } from "@/lib/utils";
import { ExpenseForm } from "@/components/admin/expense-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminFinancePage() {
  await requireAdminPermission("payments:view");
  const [stats, expenses] = await Promise.all([getEnterpriseDashboardStats(), getExpenses()]);

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const profit = stats.totalSales - totalExpenses;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Revenue</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Expenses</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(totalExpenses)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Profit / Loss</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(profit)}</CardContent>
        </Card>
      </div>
      <ExpenseForm />
    </div>
  );
}
