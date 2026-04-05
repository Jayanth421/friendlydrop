import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { createExpense, getExpenses } from "@/lib/firebase/firestore";
import { financeExpenseSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "payments:view");
  const expenses = await getExpenses();
  return NextResponse.json({ expenses });
}

export async function POST(request: NextRequest) {
  try {
    await requireApiPermission(request, "payments:view");
    const payload = financeExpenseSchema.parse(await request.json());
    const expense = await createExpense(payload);
    return NextResponse.json({ ok: true, expense });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not add expense" }, { status: 400 });
  }
}
