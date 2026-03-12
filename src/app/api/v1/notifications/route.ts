import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  // TODO: Get user's notifications
  return NextResponse.json({
    notifications: [],
    unreadCount: 0,
    message: "Notifications endpoint — push and in-app notifications",
  });
}

export async function POST(request: NextRequest) {
  await request.json();

  // TODO: Mark notification as read, subscribe to push, etc.
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
