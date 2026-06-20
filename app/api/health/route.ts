import { NextResponse } from "next/server";
import { isFirebaseReady } from "@/lib/firebase/admin";
import { getStoreSettings } from "@/lib/firebase/firestore";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const isFirebaseConfigured = isFirebaseReady();
    
    let isDbResponding = false;
    let settingsError: string | null = null;
    
    if (isFirebaseConfigured) {
      try {
        // Try reading store settings to verify Firestore responsiveness
        const settings = await getStoreSettings();
        isDbResponding = Boolean(settings && settings.id === "default");
      } catch (err) {
        settingsError = err instanceof Error ? err.message : String(err);
      }
    }

    const healthStatus = {
      status: isFirebaseConfigured && isDbResponding ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      services: {
        firebaseConfigured: isFirebaseConfigured,
        databaseResponding: isDbResponding,
      },
    };

    if (healthStatus.status === "healthy") {
      return NextResponse.json(healthStatus, { status: 200 });
    } else {
      return NextResponse.json(
        { 
          ...healthStatus, 
          error: settingsError || "Database connection failing or not configured." 
        }, 
        { status: 503 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
