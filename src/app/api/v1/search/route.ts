import { NextRequest, NextResponse } from "next/server";

export async function GET(_request: NextRequest) {
  // TODO: Query Meilisearch for hunt units, species, regulations
  // Supported query params: q, type (units|species|states), limit
  return NextResponse.json({
    results: [],
    total: 0,
    message: "Search endpoint — full-text search via Meilisearch",
  });
}

export async function POST(request: NextRequest) {
  await request.json();

  // TODO: Advanced search with filters
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
