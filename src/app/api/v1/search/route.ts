import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { states, species, huntUnits, outfitters, deadlines } from "@/lib/db/schema";
import { sql, ilike, or } from "drizzle-orm";

const MAX_PER_CATEGORY = 50;

interface SearchResults {
  results: {
    states: typeof states.$inferSelect[];
    species: typeof species.$inferSelect[];
    units: typeof huntUnits.$inferSelect[];
    outfitters: typeof outfitters.$inferSelect[];
    deadlines: typeof deadlines.$inferSelect[];
  };
  total: number;
  query: string;
}

async function performSearch(query: string): Promise<SearchResults> {
  const pattern = `%${query}%`;

  const [stateRows, speciesRows, unitRows, outfitterRows, deadlineRows] =
    await Promise.all([
      db
        .select()
        .from(states)
        .where(
          or(
            ilike(states.name, pattern),
            ilike(states.code, pattern)
          )
        )
        .limit(MAX_PER_CATEGORY),

      db
        .select()
        .from(species)
        .where(
          or(
            ilike(species.commonName, pattern),
            ilike(species.slug, pattern)
          )
        )
        .limit(MAX_PER_CATEGORY),

      db
        .select()
        .from(huntUnits)
        .where(
          or(
            ilike(huntUnits.unitCode, pattern),
            ilike(huntUnits.unitName, pattern)
          )
        )
        .limit(MAX_PER_CATEGORY),

      db
        .select()
        .from(outfitters)
        .where(
          or(
            ilike(outfitters.name, pattern),
            ilike(outfitters.stateCode, pattern)
          )
        )
        .limit(MAX_PER_CATEGORY),

      db
        .select()
        .from(deadlines)
        .where(ilike(deadlines.title, pattern))
        .limit(MAX_PER_CATEGORY),
    ]);

  const total =
    stateRows.length +
    speciesRows.length +
    unitRows.length +
    outfitterRows.length +
    deadlineRows.length;

  return {
    results: {
      states: stateRows,
      species: speciesRows,
      units: unitRows,
      outfitters: outfitterRows,
      deadlines: deadlineRows,
    },
    total,
    query,
  };
}

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const q = request.nextUrl.searchParams.get("q")?.trim();
  if (!q || q.length === 0) {
    return NextResponse.json(
      { error: "Missing required query parameter: q" },
      { status: 400 }
    );
  }

  try {
    const data = await performSearch(q);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/v1/search] GET error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { query?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const q = body.query?.trim();
  if (!q || q.length === 0) {
    return NextResponse.json(
      { error: "Missing required field: query" },
      { status: 400 }
    );
  }

  try {
    const data = await performSearch(q);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[api/v1/search] POST error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
