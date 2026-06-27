import { NextRequest } from "next/server";

type RateLimitBucket = {
  count: number;
  resetAt: number;
};

declare global {
  var __friendlydropRateLimitStore: Map<string, RateLimitBucket> | undefined;
}

const rateLimitStore = globalThis.__friendlydropRateLimitStore ?? new Map<string, RateLimitBucket>();

if (!globalThis.__friendlydropRateLimitStore) {
  globalThis.__friendlydropRateLimitStore = rateLimitStore;
}

export class RateLimitError extends Error {
  status: number;
  retryAfterSeconds: number;

  constructor(retryAfterSeconds: number) {
    super("RATE_LIMITED");
    this.name = "RateLimitError";
    this.status = 429;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

export function getClientIp(request: NextRequest) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

export function buildRateLimitKey(input: {
  request: NextRequest;
  scope: string;
  actorId?: string;
}) {
  return [input.scope, input.actorId ?? "anon", getClientIp(input.request)].join(":");
}

export function assertRateLimit(input: {
  key: string;
  max: number;
  windowMs: number;
  now?: number;
}) {
  const now = input.now ?? Date.now();
  const existing = rateLimitStore.get(input.key);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(input.key, {
      count: 1,
      resetAt: now + input.windowMs,
    });
    return;
  }

  if (existing.count >= input.max) {
    throw new RateLimitError(Math.max(1, Math.ceil((existing.resetAt - now) / 1000)));
  }

  existing.count += 1;
  rateLimitStore.set(input.key, existing);
}
