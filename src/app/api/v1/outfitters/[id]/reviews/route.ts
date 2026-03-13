import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { outfitterReviews, outfitters } from "@/lib/db/schema";
import { eq, and, desc, sql } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const reviews = await db
      .select()
      .from(outfitterReviews)
      .where(eq(outfitterReviews.outfitterId, id))
      .orderBy(desc(outfitterReviews.createdAt));

    return NextResponse.json({ reviews });
  } catch (error) {
    console.error("[api/outfitters/reviews] GET error:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { year, rating, review, huntSuccess } = body;

    if (!year || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Year and rating (1-5) are required" },
        { status: 400 }
      );
    }

    // Check for existing review
    const existing = await db
      .select()
      .from(outfitterReviews)
      .where(
        and(
          eq(outfitterReviews.outfitterId, id),
          eq(outfitterReviews.userId, session.user.id),
          eq(outfitterReviews.year, year)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { error: "You already reviewed this outfitter for this year" },
        { status: 409 }
      );
    }

    const [newReview] = await db
      .insert(outfitterReviews)
      .values({
        outfitterId: id,
        userId: session.user.id,
        year,
        rating,
        review,
        huntSuccess,
      })
      .returning();

    // Update outfitter average rating
    const allReviews = await db
      .select({ rating: outfitterReviews.rating })
      .from(outfitterReviews)
      .where(eq(outfitterReviews.outfitterId, id));

    const avgRating =
      allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;

    await db
      .update(outfitters)
      .set({
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
        updatedAt: new Date(),
      })
      .where(eq(outfitters.id, id));

    return NextResponse.json(newReview, { status: 201 });
  } catch (error) {
    console.error("[api/outfitters/reviews] POST error:", error);
    return NextResponse.json({ error: "Failed to add review" }, { status: 500 });
  }
}
