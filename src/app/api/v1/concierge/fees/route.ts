// =============================================================================
// GET /api/v1/concierge/fees — Look up state fee schedules
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stateFeeSchedules } from "@/lib/db/schema";

const LOG_PREFIX = "[api:concierge/fees]";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const stateId = searchParams.get("stateId");
    const speciesId = searchParams.get("speciesId");
    const yearParam = searchParams.get("year");
    const residency = searchParams.get("residency");

    if (!stateId || !speciesId || !yearParam || !residency) {
      return NextResponse.json(
        { error: "stateId, speciesId, year, and residency are required" },
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

    const fees = await db
      .select()
      .from(stateFeeSchedules)
      .where(
        and(
          eq(stateFeeSchedules.stateId, stateId),
          eq(stateFeeSchedules.speciesId, speciesId),
          eq(stateFeeSchedules.year, year),
          eq(stateFeeSchedules.residency, residency)
        )
      );

    const total = fees.reduce(
      (sum, fee) => sum + parseFloat(fee.amount),
      0
    );

    return NextResponse.json({
      data: {
        fees,
        total: Math.round(total * 100) / 100,
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch fee schedules" },
      { status: 500 }
    );
  }
}
