// =============================================================================
// POST /api/v1/explore/species-for-states
//
// Given an array of state codes, returns species that have state_species entries
// in those states.
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { species, states, stateSpecies } from "@/lib/db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { states?: string[] };
    const stateCodes = body.states;

    if (!Array.isArray(stateCodes) || stateCodes.length === 0) {
      return NextResponse.json(
        { error: "states[] is required" },
        { status: 400 }
      );
    }

    // Sanitize to uppercase, limit to 50
    const codes = stateCodes
      .filter((s): s is string => typeof s === "string" && s.length >= 2)
      .map((s) => s.toUpperCase())
      .slice(0, 50);

    if (codes.length === 0) {
      return NextResponse.json({ species: [] });
    }

    // Find state IDs for the given codes
    const stateRows = await db
      .select({ id: states.id, code: states.code })
      .from(states)
      .where(
        and(
          inArray(states.code, codes),
          eq(states.enabled, true),
        )
      );

    if (stateRows.length === 0) {
      return NextResponse.json({ species: [] });
    }

    const stateIds = stateRows.map((s) => s.id);

    // Find species that have state_species entries in ANY of these states
    const result = await db
      .select({
        slug: species.slug,
        name: species.commonName,
        category: species.category,
        stateCount: sql<number>`count(DISTINCT ${stateSpecies.stateId})::int`,
      })
      .from(species)
      .innerJoin(stateSpecies, eq(stateSpecies.speciesId, species.id))
      .where(
        and(
          eq(species.enabled, true),
          inArray(stateSpecies.stateId, stateIds),
        )
      )
      .groupBy(species.id, species.slug, species.commonName, species.category)
      .orderBy(species.commonName);

    return NextResponse.json({ species: result });
  } catch (error) {
    console.error("[explore/species-for-states] Error:", error);
    return NextResponse.json(
      { error: "Failed to load species for states" },
      { status: 500 }
    );
  }
}
