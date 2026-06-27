import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getOrder, updateOrderStatus, updateTransaction } from "@/lib/firebase/firestore";
import { getAdminDb } from "@/lib/firebase/admin";
import { upiProofReviewSchema } from "@/lib/validators";
import { publishSystemEvent } from "@/lib/system-events";
import { Transaction } from "@/types";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, { params }: { params: { transactionId: string } }) {
  try {
    const admin = await requireApiPermission(request, "orders:manage");
    const payload = upiProofReviewSchema.parse(await request.json());

    const transactionRef = getAdminDb().collection("transactions").doc(params.transactionId);
    const transactionSnapshot = await transactionRef.get();

    if (!transactionSnapshot.exists) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
    }

    const transaction = transactionSnapshot.data() as Transaction;

    if (transaction.provider !== "upi_offline") {
      return NextResponse.json({ error: "Only offline UPI proofs can be reviewed from this endpoint" }, { status: 400 });
    }

    const order = await getOrder(transaction.orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const verifiedAt = new Date().toISOString();
    const isApproved = payload.status === "approved";

    await updateTransaction(params.transactionId, {
      status: isApproved ? "success" : "failed",
      proofStatus: payload.status,
      notes: payload.note,
      verifiedBy: admin.uid,
      verifiedAt,
    });

    await getAdminDb()
      .collection("orders")
      .doc(transaction.orderId)
      .set(
        {
          payment: {
            ...order.payment,
            status: isApproved ? "success" : "rejected",
            proofStatus: payload.status,
            notes: payload.note,
            verifiedBy: admin.uid,
            verifiedAt,
          },
          updatedAt: verifiedAt,
        },
        { merge: true },
      );

    await updateOrderStatus(
      transaction.orderId,
      isApproved ? "confirmed" : "cancelled",
      payload.note ?? (isApproved ? "UPI payment approved by admin." : "UPI payment rejected by admin."),
      admin.uid,
    );

    await publishSystemEvent({
      type: isApproved ? "payment_succeeded" : "payment_failed",
      module: "payments",
      source: "api:admin-upi-proof-review",
      actorId: admin.uid,
      orderId: transaction.orderId,
      payload: {
        transactionId: params.transactionId,
        status: payload.status,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not review UPI proof" }, { status: 400 });
  }
}
