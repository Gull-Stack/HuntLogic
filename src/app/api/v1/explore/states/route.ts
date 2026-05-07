import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { states } from "@/lib/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({
        code: states.code,
        name: states.name,
        region: states.region,
        hasDrawSystem: states.hasDrawSystem,
        hasPointSystem: states.hasPointSystem,
        agencyName: states.agencyName,
        agencyUrl: states.agencyUrl,
        speciesCount: sql<number>`(
          SELECT count(*)::int FROM state_species
          WHERE state_species.state_id = ${states.id}
        )`,
      })
      .from(states)
      .where(eq(states.enabled, true))
      .orderBy(states.name);

    return NextResponse.json({ states: result });
  } catch (error) {
    console.error("[explore/states] Error:", error);
    return NextResponse.json({ error: "Failed to load states" }, { status: 500 });
  }
}
