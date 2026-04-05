import { NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth/api";
import { getSystemEventsSince } from "@/lib/system-events";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toSseMessage(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export async function GET(request: NextRequest) {
  await requireApiPermission(request, "dashboard:view");

  const encoder = new TextEncoder();
  let cursor = request.nextUrl.searchParams.get("since") ?? new Date(Date.now() - 5 * 60 * 1000).toISOString();
  let interval: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const pushUpdates = async () => {
        try {
          const events = await getSystemEventsSince(cursor, 30);

          if (!events.length) {
            controller.enqueue(encoder.encode(toSseMessage("heartbeat", { at: new Date().toISOString() })));
            return;
          }

          for (const event of events) {
            controller.enqueue(encoder.encode(toSseMessage("event", event)));
          }

          cursor = events[events.length - 1].createdAt;
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              toSseMessage("error", {
                message: error instanceof Error ? error.message : "stream_error",
              }),
            ),
          );
        }
      };

      controller.enqueue(encoder.encode(toSseMessage("ready", { at: new Date().toISOString() })));
      void pushUpdates();
      interval = setInterval(() => {
        void pushUpdates();
      }, 4000);
    },
    cancel() {
      if (interval) {
        clearInterval(interval);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
