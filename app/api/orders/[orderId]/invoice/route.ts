import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { isAdminRole } from "@/lib/rbac";
import { getOrder } from "@/lib/firebase/firestore";
import PDFDocument from "pdfkit";
import { formatCurrency, formatDate } from "@/lib/utils";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const user = await requireApiUser(request);
    const order = await getOrder(params.orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Authorization check: User must own the order or be an Admin/Manager
    const isOwner = order.userId === user.uid;
    const isAuthorizedAdmin = isAdminRole(user.role);
    
    if (!isOwner && !isAuthorizedAdmin) {
      return NextResponse.json({ error: "Unauthorized access to invoice" }, { status: 403 });
    }

    const subtotalAmount = order.subtotalAmount ?? order.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const discountAmount = order.discountAmount ?? 0;
    const taxAmount = order.taxAmount ?? 0;
    const deliveryFee = order.deliveryFee ?? 0;

    // Generate PDF buffer using PDFKit
    const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const chunks: Buffer[] = [];

      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (err) => reject(err));

      // Brand Identity Header
      doc.fillColor("#1e293b").fontSize(26).font("Helvetica-Bold").text("FRIENDLYDROP", 50, 50);
      doc.fontSize(10).font("Helvetica").fillColor("#64748b").text("Premium Photo Prints & Custom Gifts", 50, 80);
      doc.text("help@friendlydrop.in  |  +91 98765 43210", 50, 95);

      // Invoice Details (Top Right)
      doc.fillColor("#1e293b").fontSize(14).font("Helvetica-Bold").text("INVOICE", 380, 50, { align: "right" });
      doc.fontSize(10).font("Helvetica").fillColor("#334155");
      doc.text(`Invoice ID: ${order.id}`, 380, 70, { align: "right" });
      doc.text(`Date: ${formatDate(order.createdAt)}`, 380, 85, { align: "right" });
      doc.text(`Payment: ${order.payment.provider.toUpperCase()} (${order.payment.status.toUpperCase()})`, 380, 100, { align: "right" });

      // Horizontal separator line
      doc.moveTo(50, 125).lineTo(545, 125).strokeColor("#cbd5e1").lineWidth(1).stroke();

      // Bill To & Ship To sections
      doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text("Billed To:", 50, 145);
      doc.font("Helvetica").fillColor("#334155").fontSize(10);
      doc.text(order.address.fullName, 50, 160);
      doc.text(order.address.phone, 50, 175);

      doc.fillColor("#1e293b").fontSize(11).font("Helvetica-Bold").text("Deliver To:", 300, 145);
      doc.font("Helvetica").fillColor("#334155").fontSize(10);
      doc.text(order.address.fullName, 300, 160);
      doc.text(`${order.address.line1}${order.address.line2 ? `, ${order.address.line2}` : ""}`, 300, 175);
      doc.text(`${order.address.city}, ${order.address.state} - ${order.address.postalCode}`, 300, 190);
      doc.text(order.address.country, 300, 205);

      // Items Table Header
      let y = 245;
      doc.rect(50, y, 495, 20).fill("#f1f5f9");
      doc.fillColor("#475569").fontSize(9).font("Helvetica-Bold");
      doc.text("Item Details", 60, y + 6, { width: 220 });
      doc.text("Qty", 300, y + 6, { width: 40, align: "center" });
      doc.text("Unit Price", 360, y + 6, { width: 80, align: "right" });
      doc.text("Total", 450, y + 6, { width: 85, align: "right" });

      y += 20;

      // Table Rows
      doc.font("Helvetica").fillColor("#334155").fontSize(9);
      order.items.forEach((item) => {
        // Draw bottom line for row
        doc.moveTo(50, y + 20).lineTo(545, y + 20).strokeColor("#e2e8f0").lineWidth(0.5).stroke();

        doc.text(item.name, 60, y + 6, { width: 220, ellipsis: true });
        doc.text(item.quantity.toString(), 300, y + 6, { width: 40, align: "center" });
        doc.text(formatCurrency(item.price), 360, y + 6, { width: 80, align: "right" });
        doc.text(formatCurrency(item.price * item.quantity), 450, y + 6, { width: 85, align: "right" });
        
        y += 20;
      });

      // Price Calculations (Summary Column)
      y += 15;
      doc.font("Helvetica").fontSize(9).fillColor("#64748b");
      
      doc.text("Subtotal:", 350, y, { width: 100, align: "right" });
      doc.fillColor("#334155").text(formatCurrency(subtotalAmount), 450, y, { width: 85, align: "right" });
      
      y += 15;
      doc.fillColor("#64748b").text("Discount:", 350, y, { width: 100, align: "right" });
      doc.fillColor("#16a34a").text(`-${formatCurrency(discountAmount)}`, 450, y, { width: 85, align: "right" });

      y += 15;
      doc.fillColor("#64748b").text(`GST (${order.taxRate || 0}%):`, 350, y, { width: 100, align: "right" });
      doc.fillColor("#334155").text(formatCurrency(taxAmount), 450, y, { width: 85, align: "right" });

      y += 15;
      doc.fillColor("#64748b").text("Delivery Fee:", 350, y, { width: 100, align: "right" });
      doc.fillColor("#334155").text(deliveryFee === 0 ? "FREE" : formatCurrency(deliveryFee), 450, y, { width: 85, align: "right" });

      // Grand Total Highlight
      y += 20;
      doc.rect(340, y, 205, 24).fill("#f8fafc");
      doc.fillColor("#1e293b").fontSize(10).font("Helvetica-Bold");
      doc.text("Total Paid Amount:", 350, y + 7, { width: 100, align: "right" });
      doc.text(formatCurrency(order.totalAmount), 450, y + 7, { width: 85, align: "right" });

      // Thank You & Footer Notes
      doc.font("Helvetica").fontSize(8).fillColor("#94a3b8");
      doc.text("Thank you for your business! This is a system-generated electronic invoice.", 50, 720, { align: "center" });
      doc.text("If you have any questions about this invoice, contact help@friendlydrop.in", 50, 735, { align: "center" });

      doc.end();
    });

    // Return PDF stream directly as response
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=invoice-${params.orderId}.pdf`,
        "Content-Length": pdfBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Invoice generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate invoice" }, { status: 500 });
  }
}
