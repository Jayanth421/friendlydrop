import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { formatCashfreeErrorMessage } from "@/lib/payments/cashfree";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(request, "settings:manage");
    const { appId, secretKey, isSandbox } = await request.json();

    if (!appId || !secretKey) {
      return NextResponse.json({ error: "App ID and Secret Key are required" }, { status: 400 });
    }

    const baseUrl = isSandbox
      ? "https://sandbox.cashfree.com/pg"
      : "https://api.cashfree.com/pg";
    const modeLabel = isSandbox ? "sandbox" : "production";

    const response = await fetch(`${baseUrl}/orders/conn_test_${Date.now()}`, {
      method: "GET",
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2023-08-01",
      },
    });

    const data = await response.json().catch(() => null);

    // If Cashfree returns 404 (order not found), authentication succeeded.
    if (response.status === 404) {
      return NextResponse.json({ ok: true, message: `Credentials are valid for ${modeLabel} mode. Connection established successfully.` });
    }

    if (response.ok) {
      return NextResponse.json({ ok: true, message: `Credentials are valid for ${modeLabel} mode. Connection established successfully.` });
    }

    const errMsg = formatCashfreeErrorMessage(data?.message, `Cashfree returned status code ${response.status}`);
    return NextResponse.json({ ok: false, error: errMsg }, { status: 400 });
  } catch (error) {
    console.error("Cashfree test connection error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
