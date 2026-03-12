import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const _query = searchParams.get("q");
  const _type = searchParams.get("type"); // units, species, states
  const _limit = searchParams.get("limit");

  // TODO: Query Meilisearch for hunt units, species, regulations
  return NextResponse.json({
    results: [],
    total: 0,
    message: "Search endpoint — full-text search via Meilisearch",
  });
}

export async function POST(request: NextRequest) {
  const _body = await request.json();

  // TODO: Advanced search with filters
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
