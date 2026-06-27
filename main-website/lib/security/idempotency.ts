import crypto from "node:crypto";
import { getAdminDb, isFirebaseReady } from "@/lib/firebase/admin";

type IdempotencyRecord = {
  id: string;
  scope: string;
  actorId: string;
  key: string;
  status: "pending" | "completed" | "failed";
  responseStatus?: number;
  responseBody?: unknown;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
};

declare global {
  var __friendlydropIdempotencyStore: Map<string, IdempotencyRecord> | undefined;
}

const fallbackStore = globalThis.__friendlydropIdempotencyStore ?? new Map<string, IdempotencyRecord>();

if (!globalThis.__friendlydropIdempotencyStore) {
  globalThis.__friendlydropIdempotencyStore = fallbackStore;
}

function isFirestoreReady() {
  return isFirebaseReady();
}

function buildRecordId(scope: string, actorId: string, key: string) {
  return crypto.createHash("sha256").update(`${scope}:${actorId}:${key}`).digest("hex");
}

function buildPendingRecord(scope: string, actorId: string, key: string, ttlMs: number): IdempotencyRecord {
  const now = new Date();
  return {
    id: buildRecordId(scope, actorId, key),
    scope,
    actorId,
    key,
    status: "pending",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + ttlMs).toISOString(),
  };
}

function isExpired(record: IdempotencyRecord) {
  return new Date(record.expiresAt).getTime() <= Date.now();
}

export async function beginIdempotentRequest(input: {
  scope: string;
  actorId: string;
  key?: string | null;
  ttlMs?: number;
}) {
  if (!input.key?.trim()) {
    return { mode: "disabled" as const };
  }

  const key = input.key.trim();
  const ttlMs = input.ttlMs ?? 15 * 60 * 1000;
  const recordId = buildRecordId(input.scope, input.actorId, key);

  if (!isFirestoreReady()) {
    const existing = fallbackStore.get(recordId);
    if (!existing || existing.status === "failed" || isExpired(existing)) {
      fallbackStore.set(recordId, buildPendingRecord(input.scope, input.actorId, key, ttlMs));
      return { mode: "acquired" as const, key };
    }

    if (existing.status === "completed") {
      return {
        mode: "replay" as const,
        key,
        responseStatus: existing.responseStatus ?? 200,
        responseBody: existing.responseBody,
      };
    }

    return { mode: "in_progress" as const, key };
  }

  const ref = getAdminDb().collection("idempotencyKeys").doc(recordId);
  const outcome = await getAdminDb().runTransaction(async (transaction) => {
    const snapshot = await transaction.get(ref);

    if (!snapshot.exists) {
      const pending = buildPendingRecord(input.scope, input.actorId, key, ttlMs);
      transaction.create(ref, pending);
      return { mode: "acquired" as const };
    }

    const record = snapshot.data() as IdempotencyRecord;
    if (record.status === "completed" && !isExpired(record)) {
      return {
        mode: "replay" as const,
        responseStatus: record.responseStatus ?? 200,
        responseBody: record.responseBody,
      };
    }

    if (record.status === "pending" && !isExpired(record)) {
      return { mode: "in_progress" as const };
    }

    const pending = buildPendingRecord(input.scope, input.actorId, key, ttlMs);
    transaction.set(ref, pending, { merge: true });
    return { mode: "acquired" as const };
  });

  if (outcome.mode === "replay") {
    return {
      mode: "replay" as const,
      key,
      responseStatus: outcome.responseStatus,
      responseBody: outcome.responseBody,
    };
  }

  return { mode: outcome.mode, key } as const;
}

export async function completeIdempotentRequest(input: {
  scope: string;
  actorId: string;
  key?: string | null;
  responseStatus: number;
  responseBody: unknown;
}) {
  if (!input.key?.trim()) {
    return;
  }

  const key = input.key.trim();
  const recordId = buildRecordId(input.scope, input.actorId, key);
  const payload = {
    status: "completed" as const,
    responseStatus: input.responseStatus,
    responseBody: input.responseBody,
    updatedAt: new Date().toISOString(),
  };

  if (!isFirestoreReady()) {
    const existing = fallbackStore.get(recordId);
    if (existing) {
      fallbackStore.set(recordId, {
        ...existing,
        ...payload,
      });
    }
    return;
  }

  await getAdminDb().collection("idempotencyKeys").doc(recordId).set(payload, { merge: true });
}

export async function failIdempotentRequest(input: {
  scope: string;
  actorId: string;
  key?: string | null;
  errorMessage: string;
}) {
  if (!input.key?.trim()) {
    return;
  }

  const key = input.key.trim();
  const recordId = buildRecordId(input.scope, input.actorId, key);
  const payload = {
    status: "failed" as const,
    errorMessage: input.errorMessage,
    updatedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
  };

  if (!isFirestoreReady()) {
    const existing = fallbackStore.get(recordId);
    if (existing) {
      fallbackStore.set(recordId, {
        ...existing,
        ...payload,
      });
    }
    return;
  }

  await getAdminDb().collection("idempotencyKeys").doc(recordId).set(payload, { merge: true });
}

