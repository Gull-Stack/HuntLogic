import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { outfitters } from "@/lib/db/schema";
import { eq, and, desc, gte, asc, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const stateCode = params.get("state");
  const species = params.get("species");
  const priceRange = params.get("priceRange");
  const minRating = params.get("minRating");
  const sort = params.get("sort") ?? "rating";
  const limit = parseInt(params.get("limit") ?? "20");
  const offset = parseInt(params.get("offset") ?? "0");

  try {
    const conditions = [eq(outfitters.enabled, true)];
    if (stateCode) conditions.push(eq(outfitters.stateCode, stateCode));
    if (priceRange) conditions.push(eq(outfitters.priceRange, priceRange));
    if (minRating) conditions.push(gte(outfitters.rating, parseFloat(minRating)));

    const orderBy =
      sort === "name" ? asc(outfitters.name) : desc(outfitters.rating);

    let rows = await db
      .select()
      .from(outfitters)
      .where(and(...conditions))
      .orderBy(orderBy, desc(outfitters.reviewCount))
      .limit(limit)
      .offset(offset);

    // Filter by species if specified
    if (species) {
      rows = rows.filter((r) => {
        const slugs = r.speciesSlugs as string[];
        return slugs.includes(species);
      });
    }

    return NextResponse.json({ outfitters: rows });
  } catch (error) {
    console.error("[api/outfitters] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch outfitters" },
      { status: 500 }
    );
  }
}
