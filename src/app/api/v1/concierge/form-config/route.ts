// =============================================================================
// GET /api/v1/concierge/form-config — Look up state form configuration
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stateFormConfigs, states } from "@/lib/db/schema";

const LOG_PREFIX = "[api:concierge/form-config]";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    let stateId = searchParams.get("stateId");
    const stateCode = searchParams.get("stateCode");
    const yearParam = searchParams.get("year");

    // Resolve stateCode → stateId if stateCode is provided
    if (!stateId && stateCode) {
      const stateRow = await db
        .select({ id: states.id })
        .from(states)
        .where(eq(states.code, stateCode.toUpperCase()))
        .limit(1);

      if (stateRow.length === 0) {
        return NextResponse.json(
          { error: `State not found for code: ${stateCode}` },
          { status: 404 }
        );
      }

      stateId = stateRow[0]!.id;
    }

    if (!stateId || !yearParam) {
      return NextResponse.json(
        { error: "stateId (or stateCode) and year are required" },
        { status: 400 }
      );
    }

    const year = parseInt(yearParam, 10);
    if (isNaN(year)) {
      return NextResponse.json(
        { error: "year must be a valid integer" },
        { status: 400 }
      );
    }

    const formConfig = await db
      .select()
      .from(stateFormConfigs)
      .where(
        and(
          eq(stateFormConfigs.stateId, stateId),
          eq(stateFormConfigs.year, year),
          eq(stateFormConfigs.active, true)
        )
      );

    return NextResponse.json({
      data: {
        formConfig,
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch form configuration" },
      { status: 500 }
    );
  }
}
