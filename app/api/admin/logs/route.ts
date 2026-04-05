import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getActivityLogs, getAuditLogs } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "logs:view");
  const [activityLogs, auditLogs] = await Promise.all([getActivityLogs(), getAuditLogs()]);
  return NextResponse.json({ activityLogs, auditLogs });
}
