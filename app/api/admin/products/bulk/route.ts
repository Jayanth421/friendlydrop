import { NextRequest, NextResponse } from "next/server";
import { createSlug } from "@/lib/utils";
import { requireApiPermission } from "@/lib/auth/api";
import { createProductsBulk } from "@/lib/firebase/firestore";
import { logAdminActivity, logAdminAudit } from "@/lib/admin/logs";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireApiPermission(request, "products:manage");
    const { rows } = (await request.json()) as { rows?: Array<Record<string, string>> };

    if (!Array.isArray(rows) || !rows.length) {
      return NextResponse.json({ error: "rows required" }, { status: 400 });
    }

    const normalized = rows.map((row) => ({
      name: String(row.name ?? "").trim(),
      description: String(row.description ?? "").trim(),
      price: Number(row.price ?? 0),
      images: String(row.images ?? "")
        .split("|")
        .map((img) => img.trim())
        .filter(Boolean),
      category: (row.category as "photo-prints" | "stickers" | "personalized-gifts") ?? "photo-prints",
      subcategory: String(row.subcategory ?? "").trim() || undefined,
      stock: Number(row.stock ?? 0),
      sku: String(row.sku ?? "").trim() || undefined,
      tags: String(row.tags ?? "")
        .split("|")
        .map((tag) => tag.trim())
        .filter(Boolean),
      featured: String(row.featured ?? "").toLowerCase() === "true",
      popularity: Number(row.popularity ?? 50),
      status: (row.status as "draft" | "published" | "archived") ?? "published",
      visibility: (row.visibility as "public" | "private") ?? "public",
      seo: {
        metaTitle: String(row.metaTitle ?? "").trim() || undefined,
        metaDescription: String(row.metaDescription ?? "").trim() || undefined,
      },
      slug: createSlug(String(row.name ?? "")),
      rating: 0,
      reviewCount: 0,
    }));

    const created = await createProductsBulk(normalized);

    await Promise.all([
      logAdminActivity({
        actorId: admin.uid,
        actorName: admin.name,
        actorRole: admin.role,
        action: "products_bulk_created",
        targetType: "products",
        targetId: `bulk_${created.length}`,
      }),
      logAdminAudit({
        actorId: admin.uid,
        actorRole: admin.role,
        module: "products",
        action: "create",
        after: { count: created.length },
      }),
    ]);

    return NextResponse.json({ ok: true, createdCount: created.length });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Bulk upload failed" }, { status: 400 });
  }
}
