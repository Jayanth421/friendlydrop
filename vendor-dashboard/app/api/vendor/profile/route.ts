import { NextRequest, NextResponse } from "next/server";
import { requireApiVendorOrAdmin } from "@/lib/auth/api";
import { getAdminDb } from "@/lib/firebase/admin";

export async function PATCH(request: NextRequest) {
  try {
    const user = await requireApiVendorOrAdmin(request);
    const body = await request.json();

    const updates: Record<string, string> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      updates.name = body.name.trim();
    }

    if (typeof body.phone === "string" && body.phone.trim()) {
      // Validate 10-digit Indian mobile
      if (!/^[6-9]\d{9}$/.test(body.phone.trim())) {
        return NextResponse.json(
          { error: "Invalid mobile number. Must be a 10-digit Indian mobile number." },
          { status: 400 }
        );
      }
      updates.phone = body.phone.trim();
    }

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: "No valid fields to update." }, { status: 400 });
    }

    updates.updatedAt = new Date().toISOString();

    await getAdminDb()
      .collection("users")
      .doc(user.uid)
      .set(updates, { merge: true });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Vendor profile PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update profile." },
      { status: 500 }
    );
  }
}
