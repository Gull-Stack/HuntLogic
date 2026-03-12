import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const _state = searchParams.get("state");
  const _species = searchParams.get("species");

  // TODO: Get draw odds forecasts from the Python forecasting service
  return NextResponse.json({
    forecasts: [],
    message: "Forecasts endpoint — ML draw odds predictions",
  });
}

export async function POST(request: NextRequest) {
  const _body = await request.json();

  // TODO: Request forecast generation for specific criteria
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
