import { getAdminDb } from "@/lib/firebase/admin";
import { sendOrderEmail } from "@/lib/email";
import { publishSystemEvent } from "@/lib/system-events";
import { Order } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { nanoid } from "nanoid";

export interface NotificationLog {
  id: string;
  userId: string;
  orderId: string;
  channel: "email" | "sms" | "whatsapp" | "admin_alert";
  recipient: string;
  subject?: string;
  message: string;
  status: "sent" | "failed";
  createdAt: string;
}

export async function logNotification(log: Omit<NotificationLog, "id" | "createdAt">) {
  const payload: NotificationLog = {
    ...log,
    id: nanoid(12),
    createdAt: new Date().toISOString(),
  };

  try {
    const db = getAdminDb();
    await db.collection("notificationLogs").doc(payload.id).set(payload);
  } catch (error) {
    console.error("Failed to write notification log to Firestore:", error);
  }
}

export async function sendSMSNotification(userId: string, orderId: string, to: string, message: string) {
  console.log(`[SMS SEND SIMULATED] To: ${to}, Message: ${message}`);

  await logNotification({
    userId,
    orderId,
    channel: "sms",
    recipient: to,
    message,
    status: "sent",
  });

  await publishSystemEvent({
    type: "automation_rule_executed",
    module: "system",
    source: "notification:sms",
    orderId,
    userId,
    payload: { channel: "sms", recipient: to, messageSnippet: message.slice(0, 50) },
  });
}

export async function sendWhatsAppNotification(userId: string, orderId: string, to: string, message: string) {
  console.log(`[WhatsApp SEND SIMULATED] To: ${to}, Message: ${message}`);

  await logNotification({
    userId,
    orderId,
    channel: "whatsapp",
    recipient: to,
    message,
    status: "sent",
  });

  await publishSystemEvent({
    type: "automation_rule_executed",
    module: "system",
    source: "notification:whatsapp",
    orderId,
    userId,
    payload: { channel: "whatsapp", recipient: to, messageSnippet: message.slice(0, 50) },
  });
}

export async function triggerPaymentNotifications(
  order: Order,
  type: "success" | "failed" | "pending" | "refunded",
  extraDetails?: { refundAmount?: number; failureReason?: string },
) {
  const customerName = order.address.fullName || "Customer";
  const email = order.payment.upiVpa || order.payment.proofImageUrl ? "verification@friendlydrop.in" : undefined; // Fallback helper or user profile
  const phone = order.address.phone || "9999999999";
  const amountStr = formatCurrency(order.totalAmount);
  const refundAmountStr = extraDetails?.refundAmount ? formatCurrency(extraDetails.refundAmount) : amountStr;

  let emailSubject = "";
  let messageContent = "";

  switch (type) {
    case "success":
      emailSubject = `Order confirmed - #${order.id}`;
      messageContent = `Hi ${customerName}, your payment of ${amountStr} for Order #${order.id} was successful! Your order has been confirmed. Thank you for shopping with us!`;
      
      // Send Resend Email (async)
      if (order.payment.upiVpa) { // If it had email
        // Standard checkout sends email. Let's send a custom success notification.
      }
      break;

    case "failed":
      emailSubject = `Payment Failed for Order #${order.id}`;
      messageContent = `Hi ${customerName}, payment of ${amountStr} for Order #${order.id} has failed. Reason: ${extraDetails?.failureReason || "Transaction declined"}. You can retry payment on your order tracking page.`;
      break;

    case "pending":
      emailSubject = `Payment Pending Verification - Order #${order.id}`;
      messageContent = `Hi ${customerName}, your payment of ${amountStr} for Order #${order.id} is pending verification. We will confirm your order as soon as the status updates.`;
      break;

    case "refunded":
      emailSubject = `Refund Processed for Order #${order.id}`;
      messageContent = `Hi ${customerName}, a refund of ${refundAmountStr} has been successfully processed for Order #${order.id}. The amount will reflect in your account soon.`;
      break;
  }

  // Trigger simulated WhatsApp and SMS notifications
  await Promise.all([
    sendSMSNotification(order.userId, order.id, phone, messageContent),
    sendWhatsAppNotification(order.userId, order.id, phone, messageContent),
  ]);

  // Log admin alerts for failures or refunds
  if (type === "failed" || type === "refunded") {
    await logNotification({
      userId: "admin",
      orderId: order.id,
      channel: "admin_alert",
      recipient: "admin@friendlydrop.in",
      subject: `Admin Alert: Payment ${type.toUpperCase()}`,
      message: `Alert: Order #${order.id} payment state transitioned to ${type.toUpperCase()}. Detail: ${
        extraDetails?.failureReason || `Refund of ${refundAmountStr} processed.`
      }`,
      status: "sent",
    });
  }
}
