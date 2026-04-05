import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

export function DashboardStats({
  stats,
}: {
  stats: { totalSales: number; totalOrders: number; totalUsers: number; totalProducts: number };
}) {
  const cards = [
    { label: "Total Sales", value: formatCurrency(stats.totalSales) },
    { label: "Orders", value: String(stats.totalOrders) },
    { label: "Users", value: String(stats.totalUsers) },
    { label: "Products", value: String(stats.totalProducts) },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <p className="text-sm text-slate-500">{card.label}</p>
          <p className="mt-2 font-display text-3xl font-bold text-ink">{card.value}</p>
        </Card>
      ))}
    </div>
  );
}
