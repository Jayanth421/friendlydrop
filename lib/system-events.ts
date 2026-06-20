import { nanoid } from "nanoid";
import { getAdminDb, isFirebaseReady } from "@/lib/firebase/admin";
import { EventSeverity, SystemEvent, SystemEventType } from "@/types";

function isFirestoreReady() {
  return isFirebaseReady();
}

function isMissingIndexError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  const code = (error as { code?: unknown }).code;
  const codeText = typeof code === "string" ? code.toLowerCase() : "";
  const message = error.message.toLowerCase();

  return (
    code === 9 ||
    codeText.includes("failed-precondition") ||
    message.includes("failed_precondition") ||
    (message.includes("query requires an index") && message.includes("firestore/indexes"))
  );
}

function mapDoc(doc: FirebaseFirestore.DocumentSnapshot): SystemEvent {
  return {
    id: doc.id,
    ...(doc.data() as Omit<SystemEvent, "id">),
  };
}

export async function publishSystemEvent(input: {
  type: SystemEventType;
  module: SystemEvent["module"];
  source: string;
  severity?: EventSeverity;
  orderId?: string;
  userId?: string;
  actorId?: string;
  payload?: Record<string, unknown>;
}) {
  const event: SystemEvent = {
    id: nanoid(14),
    type: input.type,
    module: input.module,
    source: input.source,
    severity: input.severity ?? "info",
    orderId: input.orderId,
    userId: input.userId,
    actorId: input.actorId,
    payload: input.payload,
    createdAt: new Date().toISOString(),
  };

  if (!isFirestoreReady()) {
    return event;
  }

  await getAdminDb().collection("systemEvents").doc(event.id).set(event);
  return event;
}

export async function getSystemEvents(limit = 50): Promise<SystemEvent[]> {
  if (!isFirestoreReady()) {
    return [];
  }

  try {
    const snapshot = await getAdminDb().collection("systemEvents").orderBy("createdAt", "desc").limit(limit).get();
    return snapshot.docs.map((doc) => mapDoc(doc));
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    const snapshot = await getAdminDb().collection("systemEvents").limit(1000).get();

    return snapshot.docs
      .map((doc) => mapDoc(doc))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }
}

export async function getSystemEventsSince(sinceIso: string, limit = 50): Promise<SystemEvent[]> {
  if (!isFirestoreReady()) {
    return [];
  }

  try {
    const snapshot = await getAdminDb()
      .collection("systemEvents")
      .where("createdAt", ">", sinceIso)
      .orderBy("createdAt", "asc")
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => mapDoc(doc));
  } catch (error) {
    if (!isMissingIndexError(error)) {
      throw error;
    }

    const snapshot = await getAdminDb().collection("systemEvents").limit(1000).get();

    return snapshot.docs
      .map((doc) => mapDoc(doc))
      .filter((event) => new Date(event.createdAt).getTime() > new Date(sinceIso).getTime())
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(0, limit);
  }
}

