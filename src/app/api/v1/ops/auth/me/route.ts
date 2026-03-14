// =============================================================================
// GET /api/v1/ops/auth/me — Get current ops user session
// =============================================================================

import { NextResponse } from "next/server";
import { getOptionalOpsUser } from "@/lib/auth/ops-auth";

const LOG_PREFIX = "[api:ops/auth/me]";

export async function GET() {
  try {
    const user = await getOptionalOpsUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    return NextResponse.json({ data: { user } });
  } catch (error) {
    console.error(`${LOG_PREFIX} Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
