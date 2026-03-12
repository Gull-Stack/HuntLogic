import { NextRequest, NextResponse } from "next/server";
import { eq, and, gte, asc, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { deadlines } from "@/lib/db/schema/intelligence";
import { states, species } from "@/lib/db/schema/hunting";

// =============================================================================
// GET /api/v1/deadlines — Query deadlines (public, no auth required)
// Query params: state (code), species (slug), year, upcoming ("true"/"false")
// =============================================================================

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const stateCode = url.searchParams.get("state");
    const speciesSlug = url.searchParams.get("species");
    const yearParam = url.searchParams.get("year");
    const upcomingParam = url.searchParams.get("upcoming");

    const year = yearParam ? parseInt(yearParam, 10) : new Date().getFullYear();
    const upcoming = upcomingParam === "true";

    if (yearParam && isNaN(year)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid year parameter" },
        { status: 400 }
      );
    }

    // Resolve state code to stateId
    let stateId: string | undefined;
    if (stateCode) {
      const stateRow = await db
        .select({ id: states.id })
        .from(states)
        .where(eq(states.code, stateCode.toUpperCase()))
        .limit(1);

      if (stateRow.length === 0) {
        return NextResponse.json(
          { error: "Not Found", message: `State not found: ${stateCode}` },
          { status: 404 }
        );
      }
      stateId = stateRow[0].id;
    }

    // Resolve species slug to speciesId
    let speciesId: string | undefined;
    if (speciesSlug) {
      const speciesRow = await db
        .select({ id: species.id })
        .from(species)
        .where(eq(species.slug, speciesSlug))
        .limit(1);

      if (speciesRow.length === 0) {
        return NextResponse.json(
          { error: "Not Found", message: `Species not found: ${speciesSlug}` },
          { status: 404 }
        );
      }
      speciesId = speciesRow[0].id;
    }

    // Build dynamic where conditions
    const conditions: SQL[] = [];

    conditions.push(eq(deadlines.year, year));

    if (stateId) {
      conditions.push(eq(deadlines.stateId, stateId));
    }

    if (speciesId) {
      conditions.push(eq(deadlines.speciesId, speciesId));
    }

    if (upcoming) {
      const today = new Date().toISOString().split("T")[0];
      conditions.push(gte(deadlines.deadlineDate, today));
    }

    // Query with joins
    const rows = await db
      .select({
        id: deadlines.id,
        stateId: deadlines.stateId,
        stateName: states.name,
        stateCode: states.code,
        speciesId: deadlines.speciesId,
        speciesName: species.commonName,
        year: deadlines.year,
        deadlineType: deadlines.deadlineType,
        title: deadlines.title,
        description: deadlines.description,
        deadlineDate: deadlines.deadlineDate,
        url: deadlines.url,
      })
      .from(deadlines)
      .leftJoin(states, eq(deadlines.stateId, states.id))
      .leftJoin(species, eq(deadlines.speciesId, species.id))
      .where(and(...conditions))
      .orderBy(asc(deadlines.deadlineDate))
      .limit(100);

    return NextResponse.json({ deadlines: rows });
  } catch (error) {
    console.error("[deadlines] GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch deadlines" },
      { status: 500 }
    );
  }
}

// =============================================================================
// POST /api/v1/deadlines — Not implemented
// =============================================================================

export async function POST(request: NextRequest) {
  await request.json();

  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
