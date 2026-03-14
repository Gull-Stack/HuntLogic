// =============================================================================
// POST /api/v1/ops/auth/logout — Clear ops session
// =============================================================================

import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const LOG_PREFIX = "[api:ops/auth/logout]";

export async function POST() {
  try {
    const cookieStore = await cookies();
    cookieStore.set("ops_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 0, // Expire immediately
    });

    console.log(`${LOG_PREFIX} Session cleared`);

    return NextResponse.json({ data: { success: true } });
  } catch (error) {
    console.error(`${LOG_PREFIX} Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
