import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { species } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({
        slug: species.slug,
        name: species.commonName,
        category: species.category,
        stateCount: sql<number>`(
          SELECT count(DISTINCT state_species.state_id)::int FROM state_species
          WHERE state_species.species_id = ${species.id}
        )`,
      })
      .from(species)
      .where(eq(species.enabled, true))
      .orderBy(species.commonName);

    return NextResponse.json({ species: result });
  } catch (error) {
    console.error("[explore/species] Error:", error);
    return NextResponse.json({ error: "Failed to load species" }, { status: 500 });
  }
}
