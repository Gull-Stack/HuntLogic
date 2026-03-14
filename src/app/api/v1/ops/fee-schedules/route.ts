// =============================================================================
// GET + PUT /api/v1/ops/fee-schedules — State fee schedule management
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { getOpsUser } from "@/lib/auth/ops-auth";
import { db } from "@/lib/db";
import {
  stateFeeSchedules,
  states,
  species,
} from "@/lib/db/schema";

const LOG_PREFIX = "[api:ops/fee-schedules]";

// =============================================================================
// GET — Query fee schedules with optional filters
// =============================================================================

export async function GET(request: NextRequest) {
  let opsUser;
  try {
    opsUser = await getOpsUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const url = new URL(request.url);
    const stateId = url.searchParams.get("stateId");
    const year = url.searchParams.get("year");
    const speciesId = url.searchParams.get("speciesId");

    // Build filter conditions
    const conditions: ReturnType<typeof eq>[] = [];

    if (stateId) {
      conditions.push(eq(stateFeeSchedules.stateId, stateId));
    }
    if (year) {
      conditions.push(eq(stateFeeSchedules.year, parseInt(year, 10)));
    }
    if (speciesId) {
      conditions.push(eq(stateFeeSchedules.speciesId, speciesId));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const baseQuery = db
      .select({
        id: stateFeeSchedules.id,
        stateId: stateFeeSchedules.stateId,
        speciesId: stateFeeSchedules.speciesId,
        year: stateFeeSchedules.year,
        residency: stateFeeSchedules.residency,
        feeType: stateFeeSchedules.feeType,
        feeName: stateFeeSchedules.feeName,
        amount: stateFeeSchedules.amount,
        required: stateFeeSchedules.required,
        notes: stateFeeSchedules.notes,
        sourceUrl: stateFeeSchedules.sourceUrl,
        metadata: stateFeeSchedules.metadata,
        createdAt: stateFeeSchedules.createdAt,
        updatedAt: stateFeeSchedules.updatedAt,
        stateCode: states.code,
        stateName: states.name,
        speciesSlug: species.slug,
        speciesName: species.commonName,
      })
      .from(stateFeeSchedules)
      .innerJoin(states, eq(stateFeeSchedules.stateId, states.id))
      .innerJoin(species, eq(stateFeeSchedules.speciesId, species.id));

    const feeSchedules = whereClause
      ? await baseQuery.where(whereClause)
      : await baseQuery;

    console.log(
      `${LOG_PREFIX} GET: Returned ${feeSchedules.length} fee schedules for ops user ${opsUser.email}`
    );

    return NextResponse.json({ data: { feeSchedules } });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch fee schedules" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT — Update a fee schedule row (admin only)
// =============================================================================

export async function PUT(request: NextRequest) {
  let opsUser;
  try {
    opsUser = await getOpsUser();
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Admin only
  if (opsUser.role !== "admin") {
    return NextResponse.json(
      { error: "Forbidden: admin role required" },
      { status: 403 }
    );
  }

  try {
    const body = await request.json();
    const { id, amount, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "id is required" },
        { status: 400 }
      );
    }

    if (amount === undefined || amount === null) {
      return NextResponse.json(
        { error: "amount is required" },
        { status: 400 }
      );
    }

    // Validate fee schedule exists
    const existing = await db.query.stateFeeSchedules.findFirst({
      where: eq(stateFeeSchedules.id, id),
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Fee schedule not found" },
        { status: 404 }
      );
    }

    const updates: Record<string, unknown> = {
      amount: parseFloat(amount).toFixed(2),
      updatedAt: new Date(),
    };

    if (notes !== undefined) {
      updates.notes = notes;
    }

    const [updated] = await db
      .update(stateFeeSchedules)
      .set(updates)
      .where(eq(stateFeeSchedules.id, id))
      .returning();

    console.log(
      `${LOG_PREFIX} PUT: Fee schedule ${id} updated (amount=${amount}) by ${opsUser.email}`
    );

    return NextResponse.json({ data: { feeSchedule: updated } });
  } catch (error) {
    console.error(`${LOG_PREFIX} PUT error:`, error);
    return NextResponse.json(
      { error: "Failed to update fee schedule" },
      { status: 500 }
    );
  }
}
