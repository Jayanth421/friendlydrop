import { Resend } from "resend";

let resend: Resend;

export function getResendClient() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is missing.");
    }

    resend = new Resend(process.env.RESEND_API_KEY);
  }

  return resend;
}

export function getOrderEmailTemplate({
  heading,
  customerName,
  orderId,
  amount,
  status,
}: {
  heading: string;
  customerName: string;
  orderId: string;
  amount: string;
  status: string;
}) {
  return `
  <div style="font-family:Arial,sans-serif;background:#f4f8f9;padding:24px;">
    <div style="max-width:600px;margin:0 auto;background:white;padding:28px;border-radius:16px;border:1px solid #e6ebef;">
      <h1 style="font-size:24px;margin-bottom:10px;color:#121922;">${heading}</h1>
      <p style="font-size:15px;color:#364152;line-height:1.6;">Hi ${customerName}, your FriendlyDrop order update is ready.</p>
      <div style="background:#f8fafb;border-radius:10px;padding:16px;margin:20px 0;">
        <p style="margin:0 0 8px;color:#121922;"><strong>Order ID:</strong> ${orderId}</p>
        <p style="margin:0 0 8px;color:#121922;"><strong>Status:</strong> ${status}</p>
        <p style="margin:0;color:#121922;"><strong>Total:</strong> ${amount}</p>
      </div>
      <p style="font-size:14px;color:#5b6878;">Thank you for choosing FriendlyDrop for personalized memories.</p>
    </div>
  </div>`;
}
