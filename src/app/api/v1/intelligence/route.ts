import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const _state = searchParams.get("state");
  const _species = searchParams.get("species");
  const _unit = searchParams.get("unit");

  // TODO: Query draw odds, harvest stats, season data
  return NextResponse.json({
    drawOdds: [],
    harvestStats: [],
    seasons: [],
    message: "Intelligence endpoint — draw odds, harvest stats, season data",
  });
}

export async function POST(request: NextRequest) {
  const _body = await request.json();

  // TODO: Advanced intelligence query with AI analysis
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
