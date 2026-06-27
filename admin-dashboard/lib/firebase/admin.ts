import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { Firestore, getFirestore, initializeFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";

function getProjectId() {
  return process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "";
}

function getClientEmail() {
  return process.env.FIREBASE_CLIENT_EMAIL || "";
}

function getPrivateKey() {
  return process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "";
}

export function isFirebaseReady() {
  return Boolean(getProjectId() && getClientEmail() && getPrivateKey());
}

function ensureFirebaseReady() {
  if (!isFirebaseReady()) {
    throw new Error(
      "FIREBASE_NOT_CONFIGURED: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
    );
  }
}

export function getAdminApp() {
  const existingApp = getApps()[0];
  if (existingApp) {
    return existingApp;
  }

  ensureFirebaseReady();

  return initializeApp({
    credential: cert({
      projectId: getProjectId(),
      clientEmail: getClientEmail(),
      privateKey: getPrivateKey(),
    }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${getProjectId()}.appspot.com`,
  });
}

declare global {
  var __friendlydropAdminDb: Firestore | undefined;
}

let _db: Firestore | null = globalThis.__friendlydropAdminDb ?? null;

function applyFirestoreSettings(db: Firestore) {
  try {
    db.settings({ ignoreUndefinedProperties: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("Firestore has already been initialized")) {
      throw error;
    }
  }
}

export function getAdminDb() {
  if (!_db) {
    const app = getAdminApp();

    try {
      _db = initializeFirestore(app);
    } catch {
      _db = getFirestore(app);
    }

    applyFirestoreSettings(_db);
    globalThis.__friendlydropAdminDb = _db;
  }
  return _db;
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminStorage() {
  return getStorage(getAdminApp());
}

export function getUserDisplayName(user: { name?: string; email?: string }) {
  return user.name ?? user.email?.split("@")[0] ?? "Customer";
}
