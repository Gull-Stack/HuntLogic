import { NextRequest, NextResponse } from "next/server";
import { eq, and, desc, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  drawOdds,
  harvestStats,
  seasons,
} from "@/lib/db/schema/intelligence";
import { states, species, huntUnits } from "@/lib/db/schema/hunting";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get("state");
    const speciesParam = searchParams.get("species");
    const unitParam = searchParams.get("unit");
    const yearParam = searchParams.get("year");

    // Resolve state code to stateId
    let stateId: string | undefined;
    if (stateParam) {
      const stateRow = await db.query.states.findFirst({
        where: eq(states.code, stateParam.toUpperCase()),
      });
      if (!stateRow) {
        return NextResponse.json(
          { error: `State not found: ${stateParam}` },
          { status: 404 }
        );
      }
      stateId = stateRow.id;
    }

    // Resolve species slug to speciesId
    let speciesId: string | undefined;
    if (speciesParam) {
      const speciesRow = await db.query.species.findFirst({
        where: eq(species.slug, speciesParam),
      });
      if (!speciesRow) {
        return NextResponse.json(
          { error: `Species not found: ${speciesParam}` },
          { status: 404 }
        );
      }
      speciesId = speciesRow.id;
    }

    // Resolve unit code to huntUnitId (requires stateId for uniqueness)
    let huntUnitId: string | undefined;
    if (unitParam) {
      const unitConditions: SQL[] = [eq(huntUnits.unitCode, unitParam)];
      if (stateId) {
        unitConditions.push(eq(huntUnits.stateId, stateId));
      }
      if (speciesId) {
        unitConditions.push(eq(huntUnits.speciesId, speciesId));
      }
      const unitRow = await db.query.huntUnits.findFirst({
        where: and(...unitConditions),
      });
      if (!unitRow) {
        return NextResponse.json(
          { error: `Hunt unit not found: ${unitParam}` },
          { status: 404 }
        );
      }
      huntUnitId = unitRow.id;
    }

    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    if (yearParam && (isNaN(year!) || year! < 1900 || year! > 2100)) {
      return NextResponse.json(
        { error: `Invalid year: ${yearParam}` },
        { status: 400 }
      );
    }

    // Build dynamic where conditions for each table
    const buildConditions = (table: {
      stateId: typeof drawOdds.stateId;
      speciesId: typeof drawOdds.speciesId;
      huntUnitId: typeof drawOdds.huntUnitId;
      year: typeof drawOdds.year;
    }): SQL | undefined => {
      const conditions: SQL[] = [];
      if (stateId) conditions.push(eq(table.stateId, stateId));
      if (speciesId) conditions.push(eq(table.speciesId, speciesId));
      if (huntUnitId) conditions.push(eq(table.huntUnitId, huntUnitId));
      if (year) conditions.push(eq(table.year, year));
      return conditions.length > 0 ? and(...conditions) : undefined;
    };

    // Query all three tables in parallel
    const [drawOddsData, harvestStatsData, seasonsData] = await Promise.all([
      db
        .select()
        .from(drawOdds)
        .where(buildConditions(drawOdds))
        .orderBy(desc(drawOdds.year))
        .limit(50),
      db
        .select()
        .from(harvestStats)
        .where(buildConditions(harvestStats))
        .orderBy(desc(harvestStats.year))
        .limit(50),
      db
        .select()
        .from(seasons)
        .where(buildConditions(seasons))
        .orderBy(desc(seasons.year))
        .limit(50),
    ]);

    return NextResponse.json({
      drawOdds: drawOddsData,
      harvestStats: harvestStatsData,
      seasons: seasonsData,
    });
  } catch (error) {
    console.error("Intelligence GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  await request.json();

  // TODO: Advanced intelligence query with AI analysis
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
