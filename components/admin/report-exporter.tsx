"use client";

import { Order } from "@/types";
import { downloadCsv } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ReportExporter({ orders }: { orders: Order[] }) {
  const exportCsv = () => {
    downloadCsv(
      `friendlydrop-orders-${new Date().toISOString().slice(0, 10)}.csv`,
      orders.map((order) => ({
        orderId: order.id,
        userId: order.userId,
        status: order.status,
        total: order.totalAmount,
        paymentId: order.paymentId,
        createdAt: order.createdAt,
      })),
    );
  };

  return (
    <Card>
      <CardHeader><CardTitle>Reports & Export</CardTitle></CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>Generate sales reports and export orders to CSV for finance/accounting workflows.</p>
        <button onClick={exportCsv} className="rounded-md bg-ink px-3 py-2 text-sm font-semibold text-white">Export Orders CSV</button>
      </CardContent>
    </Card>
  );
}
