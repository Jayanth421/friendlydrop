import { NextRequest, NextResponse } from "next/server";
import { requireApiUser } from "@/lib/auth/api";
import { createReview, getReviews } from "@/lib/firebase/firestore";
import { reviewSchema } from "@/lib/validators";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, { params }: { params: { productId: string } }) {
  const reviews = await getReviews(params.productId);
  return NextResponse.json({ reviews });
}

export async function POST(request: NextRequest, { params }: { params: { productId: string } }) {
  try {
    const user = await requireApiUser(request);
    const payload = reviewSchema.parse(await request.json());

    const review = await createReview({
      productId: params.productId,
      userId: user.uid,
      userName: user.name,
      rating: payload.rating,
      comment: payload.comment,
    });

    return NextResponse.json({ ok: true, review });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Could not submit review" }, { status: 400 });
  }
}
