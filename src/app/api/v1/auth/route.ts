import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Auth endpoint — use NextAuth.js session endpoints",
    endpoints: {
      signIn: "/api/auth/signin",
      signOut: "/api/auth/signout",
      session: "/api/auth/session",
    },
  });
}

export async function POST(request: NextRequest) {
  const _body = await request.json();

  // TODO: Implement custom auth logic if needed beyond NextAuth
  return NextResponse.json(
    { error: "Not implemented" },
    { status: 501 }
  );
}
