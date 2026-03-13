import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { outfitters, outfitterReviews, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

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
    const outfitter = await db.query.outfitters.findFirst({
      where: eq(outfitters.id, id),
    });

    if (!outfitter) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const reviews = await db
      .select({
        id: outfitterReviews.id,
        year: outfitterReviews.year,
        rating: outfitterReviews.rating,
        review: outfitterReviews.review,
        huntSuccess: outfitterReviews.huntSuccess,
        verifiedClient: outfitterReviews.verifiedClient,
        createdAt: outfitterReviews.createdAt,
        userName: users.displayName,
      })
      .from(outfitterReviews)
      .leftJoin(users, eq(outfitterReviews.userId, users.id))
      .where(eq(outfitterReviews.outfitterId, id))
      .orderBy(desc(outfitterReviews.createdAt))
      .limit(50);

    return NextResponse.json({ outfitter, reviews });
  } catch (error) {
    console.error("[api/outfitters/id] Error:", error);
    return NextResponse.json({ error: "Failed to fetch outfitter" }, { status: 500 });
  }
}
