import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Get authenticated user's profile from DB
  return NextResponse.json({
    id: null,
    message: "Profile endpoint — returns authenticated user profile",
  });
}

export async function POST(request: NextRequest) {
  const _body = await request.json();

  // TODO: Update user profile
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
