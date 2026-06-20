import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { AUTOMATION_RULES } from "@/lib/automation-engine";
import { getAllOrders, getProducts, getSupportTickets, getTransactions } from "@/lib/firebase/firestore";
import { getSystemEvents } from "@/lib/system-events";
import { AutomationRule, SystemEvent } from "@/types";

export interface GatewayMetric {
  provider: string;
  successRate: number;
  totalAttempts: number;
  successful: number;
  failed: number;
}

export interface ModuleSyncHealth {
  module: "orders" | "payments" | "delivery" | "inventory" | "customers" | "vendors" | "marketing" | "catalog" | "automation";
  lastEventAt: string | null;
  status: "healthy" | "warning";
}

export interface ControlTowerSnapshot {
  kpis: {
    revenue24h: number;
    orders24h: number;
    paymentSuccessRate: number;
    onTimeDeliveryRate: number;
    delayedShipments: number;
    lowStockProducts: number;
    openSupportTickets: number;
    automationsTriggered24h: number;
  };
  gatewayMetrics: GatewayMetric[];
  moduleSync: ModuleSyncHealth[];
  events: SystemEvent[];
  rules: AutomationRule[];
}

function percentage(numerator: number, denominator: number) {
  if (!denominator) {
    return 0;
  }

  return Number(((numerator / denominator) * 100).toFixed(2));
}

function buildGatewayMetrics(transactions: Awaited<ReturnType<typeof getTransactions>>): GatewayMetric[] {
  const byProvider = new Map<string, { totalAttempts: number; successful: number; failed: number }>();

  for (const txn of transactions) {
    const current = byProvider.get(txn.provider) ?? { totalAttempts: 0, successful: 0, failed: 0 };
    current.totalAttempts += 1;

    if (txn.status === "success") {
      current.successful += 1;
    } else if (txn.status === "failed") {
      current.failed += 1;
    }

    byProvider.set(txn.provider, current);
  }

  return Array.from(byProvider.entries()).map(([provider, value]) => ({
    provider,
    totalAttempts: value.totalAttempts,
    successful: value.successful,
    failed: value.failed,
    successRate: percentage(value.successful, value.totalAttempts),
  }));
}

function buildModuleSync(events: SystemEvent[]): ModuleSyncHealth[] {
  const modules: ModuleSyncHealth["module"][] = ["orders", "payments", "delivery", "inventory", "customers", "vendors", "marketing", "catalog", "automation"];
  const now = Date.now();

  return modules.map((module) => {
    const latest = events.find((event) => event.module === module)?.createdAt ?? null;
    const minutesSinceLatest = latest ? (now - new Date(latest).getTime()) / 60000 : Number.POSITIVE_INFINITY;

    return {
      module,
      lastEventAt: latest,
      status: minutesSinceLatest <= 20 ? "healthy" : "warning",
    };
  });
}

export async function getControlTowerSnapshot(): Promise<ControlTowerSnapshot> {
  const [orders, transactions, products, supportTickets, events] = await Promise.all([
    getAllOrders(),
    getTransactions(),
    getProducts(),
    getSupportTickets(),
    getSystemEvents(60),
  ]);

  const now = Date.now();
  const last24h = now - 24 * 60 * 60 * 1000;
  const recentOrders = orders.filter((order) => new Date(order.createdAt).getTime() >= last24h);
  const revenue24h = recentOrders.reduce((sum, order) => sum + order.totalAmount, 0);
  const paymentSuccessRate = percentage(
    transactions.filter((txn) => txn.status === "success").length,
    Math.max(transactions.length, 1),
  );

  const deliveredOrders = orders.filter((order) => order.status === "delivered" && order.shipping?.eta);
  const onTimeDeliveries = deliveredOrders.filter((order) => {
    const eta = order.shipping?.eta;

    if (!eta) {
      return false;
    }

    return new Date(order.updatedAt).getTime() <= new Date(eta).getTime();
  });

  const delayedShipments = orders.filter((order) => {
    const eta = order.shipping?.eta;

    if (!eta) {
      return false;
    }

    return order.status !== "delivered" && new Date(eta).getTime() < now;
  }).length;

  const lowStockProducts = products.filter((product) => product.stock <= LOW_STOCK_THRESHOLD).length;
  const openSupportTickets = supportTickets.filter((ticket) => ticket.status !== "resolved").length;
  const automationsTriggered24h = events.filter(
    (event) => event.type === "automation_rule_executed" && new Date(event.createdAt).getTime() >= last24h,
  ).length;

  return {
    kpis: {
      revenue24h,
      orders24h: recentOrders.length,
      paymentSuccessRate,
      onTimeDeliveryRate: percentage(onTimeDeliveries.length, Math.max(deliveredOrders.length, 1)),
      delayedShipments,
      lowStockProducts,
      openSupportTickets,
      automationsTriggered24h,
    },
    gatewayMetrics: buildGatewayMetrics(transactions),
    moduleSync: buildModuleSync(events),
    events,
    rules: AUTOMATION_RULES,
  };
}

