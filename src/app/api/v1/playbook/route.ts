import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Get user's active playbook
  return NextResponse.json({
    playbook: null,
    message: "Playbook endpoint — returns user's multi-year hunting strategy",
  });
}

export async function POST(request: NextRequest) {
  const _body = await request.json();

  // TODO: Generate or update playbook via AI
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
