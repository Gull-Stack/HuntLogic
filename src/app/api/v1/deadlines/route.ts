import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const _state = searchParams.get("state");
  const _upcoming = searchParams.get("upcoming");

  // TODO: Get application deadlines, optionally filtered
  return NextResponse.json({
    deadlines: [],
    message: "Deadlines endpoint — application and season deadlines",
  });
}

export async function POST(request: NextRequest) {
  const _body = await request.json();

  // TODO: Create/update deadline reminders
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
