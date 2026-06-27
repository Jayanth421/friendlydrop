import { nanoid } from "nanoid";
import { LOW_STOCK_THRESHOLD } from "@/lib/constants";
import { getProductById, getStoreSettings, reserveInventoryForOrder, updateOrderShipping } from "@/lib/firebase/firestore";
import { publishSystemEvent } from "@/lib/system-events";
import { AutomationRule, Order, ShippingDetails } from "@/types";

export const AUTOMATION_RULES: AutomationRule[] = [
  {
    id: "payment-success-to-fulfillment",
    name: "Payment Success Pipeline",
    description: "When payment succeeds, automatically confirm the order and trigger fulfillment.",
    enabled: true,
    triggerEvent: "payment_succeeded",
    actions: ["Confirm order", "Reserve inventory", "Assign delivery"],
  },
  {
    id: "inventory-low-stock-alert",
    name: "Low Stock Alert",
    description: "When stock after reservation drops below threshold, create a critical inventory alert.",
    enabled: true,
    triggerEvent: "inventory_reserved",
    actions: ["Create low stock event", "Notify inventory team"],
  },
  {
    id: "delivery-failed-reassignment",
    name: "Delivery Reassignment",
    description: "When delivery fails, trigger reassignment workflow and alert support.",
    enabled: true,
    triggerEvent: "delivery_failed",
    actions: ["Reassign courier", "Notify support", "Notify customer"],
  },
];

function buildAutoShipping(order: Order): ShippingDetails {
  const state = order.address.state.toLowerCase();
  const metroStates = new Set(["delhi", "maharashtra", "karnataka", "tamil nadu", "telangana", "west bengal"]);
  const isExpress = order.priority === "express";
  const useFastPartner = isExpress || metroStates.has(state);
  const courier = useFastPartner ? "Delhivery Express" : "Shiprocket Surface";
  const etaDays = isExpress ? 1 : useFastPartner ? 2 : 4;
  const etaDate = new Date(Date.now() + etaDays * 86400000);

  return {
    courier,
    trackingId: `FD-${nanoid(10).toUpperCase()}`,
    eta: etaDate.toISOString(),
  };
}

export async function runPostPaymentAutomation(order: Order, input: { provider: "razorpay" | "stripe" | "cashfree" | "upi_offline" }) {
  const settings = await getStoreSettings();

  await publishSystemEvent({
    type: "payment_succeeded",
    module: "payments",
    source: "automation:post-payment",
    orderId: order.id,
    userId: order.userId,
    payload: {
      provider: input.provider,
      amount: order.totalAmount,
      priority: order.priority ?? "normal",
    },
  });

  const ruleIdsExecuted: string[] = [];

  if (!settings.operations.autoOrderConfirm) {
    await publishSystemEvent({
      type: "automation_rule_executed",
      module: "automation",
      source: "automation:post-payment",
      orderId: order.id,
      userId: order.userId,
      payload: {
        ruleIds: [],
        skipped: ["order_confirmation", "inventory_reservation", "delivery_assignment"],
      },
    });
    return;
  }

  await publishSystemEvent({
    type: "order_confirmed",
    module: "orders",
    source: "automation:post-payment",
    orderId: order.id,
    userId: order.userId,
    payload: {
      status: order.status,
    },
  });
  ruleIdsExecuted.push("payment-success-to-fulfillment");

  const reservations = await reserveInventoryForOrder(order.id, order.items);

  await publishSystemEvent({
    type: "inventory_reserved",
    module: "inventory",
    source: "automation:post-payment",
    orderId: order.id,
    userId: order.userId,
    payload: {
      items: reservations,
    },
  });

  for (const item of reservations.filter((reservation) => reservation.nextStock <= LOW_STOCK_THRESHOLD)) {
    await publishSystemEvent({
      type: "low_stock_alert",
      module: "inventory",
      source: "automation:post-payment",
      severity: "warning",
      orderId: order.id,
      payload: { ...item },
    });
    ruleIdsExecuted.push("inventory-low-stock-alert");
  }

  const vendorIds = new Set<string>();
  for (const item of order.items) {
    const product = await getProductById(item.productId);
    if (product?.vendorId) {
      vendorIds.add(product.vendorId);
    }
  }

  for (const vendorId of vendorIds) {
    await publishSystemEvent({
      type: "vendor_notified",
      module: "vendors",
      source: "automation:post-payment",
      orderId: order.id,
      payload: {
        vendorId,
        reason: "new_order_assigned",
      },
    });
  }

  if (settings.operations.autoDeliveryAssignment && !order.shipping?.trackingId) {
    const autoShipping = buildAutoShipping(order);
    await updateOrderShipping(order.id, autoShipping);

    await publishSystemEvent({
      type: "delivery_assigned",
      module: "delivery",
      source: "automation:post-payment",
      orderId: order.id,
      userId: order.userId,
      payload: {
        courier: autoShipping.courier,
        trackingId: autoShipping.trackingId,
        eta: autoShipping.eta,
      },
    });
  }

  await publishSystemEvent({
    type: "automation_rule_executed",
    module: "automation",
    source: "automation:post-payment",
    orderId: order.id,
    userId: order.userId,
    payload: {
      ruleIds: ruleIdsExecuted.length ? ruleIdsExecuted : AUTOMATION_RULES.filter((rule) => rule.enabled).map((rule) => rule.id),
      autoDeliveryAssignment: settings.operations.autoDeliveryAssignment,
    },
  });
}

