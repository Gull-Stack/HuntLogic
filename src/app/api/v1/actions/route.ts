import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Get user's pending and completed actions
  return NextResponse.json({
    actions: [],
    message: "Actions endpoint — user action items and to-dos",
  });
}

export async function POST(request: NextRequest) {
  const _body = await request.json();

  // TODO: Create or complete a user action
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
