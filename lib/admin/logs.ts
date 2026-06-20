import { nanoid } from "nanoid";
import { headers } from "next/headers";
import { getAdminDb } from "@/lib/firebase/admin";
import { UserRole } from "@/types";

function getRequestContext() {
  const h = headers();

  return {
    ip: h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown",
    userAgent: h.get("user-agent") ?? "unknown",
  };
}

export async function logAdminActivity(input: {
  actorId: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  targetType: string;
  targetId: string;
  details?: Record<string, unknown>;
}) {
  const id = nanoid(14);
  const context = getRequestContext();

  await getAdminDb().collection("activityLogs").doc(id).set({
    id,
    ...input,
    ip: context.ip,
    userAgent: context.userAgent,
    createdAt: new Date().toISOString(),
  });
}

export async function logAdminAudit(input: {
  actorId: string;
  actorRole: UserRole;
  module: string;
  action: "create" | "update" | "delete";
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
}) {
  const id = nanoid(14);

  await getAdminDb().collection("auditLogs").doc(id).set({
    id,
    ...input,
    createdAt: new Date().toISOString(),
  });
}

export async function trackAdminSession(input: { userId: string; email: string }) {
  const id = nanoid(14);
  const context = getRequestContext();

  await getAdminDb().collection("adminSessions").doc(id).set({
    id,
    userId: input.userId,
    email: input.email,
    device: context.userAgent,
    ip: context.ip,
    createdAt: new Date().toISOString(),
    lastActiveAt: new Date().toISOString(),
  });
}

