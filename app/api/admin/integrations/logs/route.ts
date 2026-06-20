import { NextRequest, NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getIntegrationLogs, getWebhookLogs } from "@/lib/firebase/firestore";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "settings:manage");
  const [integrationLogs, webhookLogs] = await Promise.all([getIntegrationLogs(100), getWebhookLogs(100)]);
  return NextResponse.json({ integrationLogs, webhookLogs });
}

