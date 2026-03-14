// =============================================================================
// GET /api/v1/concierge/service-fees — Look up service fees for user's tier
// =============================================================================

import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, serviceFeeConfig } from "@/lib/db/schema";

const LOG_PREFIX = "[api:concierge/service-fees]";

// Map user subscription tiers to service fee tiers
const TIER_MAP: Record<string, string> = {
  scout: "default",
  pro: "hunter",
  elite: "outfitter",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      columns: { tier: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const feeTier = TIER_MAP[user.tier] ?? "default";

    const serviceFees = await db
      .select()
      .from(serviceFeeConfig)
      .where(
        and(
          eq(serviceFeeConfig.tier, feeTier),
          eq(serviceFeeConfig.active, true)
        )
      );

    return NextResponse.json({
      data: {
        serviceFees,
        tier: user.tier,
      },
    });
  } catch (error) {
    console.error(`${LOG_PREFIX} GET error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch service fees" },
      { status: 500 }
    );
  }
}
