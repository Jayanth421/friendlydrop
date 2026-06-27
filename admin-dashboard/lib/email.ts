import { formatCurrency } from "@/lib/utils";
import { getOrderEmailTemplate, getResendClient } from "@/lib/resend";

export async function sendOrderEmail({
  to,
  customerName,
  orderId,
  amount,
  status,
}: {
  to: string;
  customerName: string;
  orderId: string;
  amount: number;
  status: string;
}) {
  try {
    const from = process.env.EMAIL_FROM ?? "noreply@friendlydrop.in";

    await getResendClient().emails.send({
      from,
      to,
      subject: `FriendlyDrop Order Update: ${status.toUpperCase()}`,
      html: getOrderEmailTemplate({
        heading: "Your order status changed",
        customerName,
        orderId,
        amount: formatCurrency(amount),
        status,
      }),
    });
  } catch (error) {
    console.error("sendOrderEmail error", error);
  }
}
