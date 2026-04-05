import PDFDocument from "pdfkit";
import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getOrder, getUserById } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    await requireApiPermission(request, "orders:manage");

    const order = await getOrder(params.orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const user = await getUserById(order.userId);

    const doc = new PDFDocument({ margin: 30 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

    const endPromise = new Promise<Buffer>((resolve) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
    });

    doc.fontSize(20).text("FriendlyDrop Invoice", { underline: true });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order.id}`);
    doc.text(`Customer: ${user?.name ?? order.userId}`);
    doc.text(`Email: ${user?.email ?? "-"}`);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString("en-IN")}`);
    doc.text(`Status: ${order.status}`);
    doc.moveDown();
    doc.text("Items:");

    for (const item of order.items) {
      doc.text(`- ${item.name} x ${item.quantity} = INR ${item.price * item.quantity}`);
    }

    const subtotalAmount = order.subtotalAmount ?? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = order.discountAmount ?? 0;
    const taxAmount = order.taxAmount ?? 0;
    const deliveryFee = order.deliveryFee ?? 0;

    doc.moveDown();
    doc.text(`Subtotal: INR ${subtotalAmount}`);
    doc.text(`Discount: -INR ${discountAmount}`);
    doc.text(`GST${typeof order.taxRate === "number" ? ` (${order.taxRate}%)` : ""}: INR ${taxAmount}`);
    doc.text(`Delivery: INR ${deliveryFee}`);
    doc.text(`Total Amount: INR ${order.totalAmount}`);
    doc.text(`Payment ID: ${order.paymentId}`);

    doc.end();

    const buffer = await endPromise;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${order.id}.pdf`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not generate invoice" }, { status: 400 });
  }
}
