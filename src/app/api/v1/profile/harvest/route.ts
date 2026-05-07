import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { harvestHistory, states, species } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { submitHarvestFeedback } from "@/services/feedback/post-season";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const harvests = await db
      .select({
        id: harvestHistory.id,
        year: harvestHistory.year,
        success: harvestHistory.success,
        weaponType: harvestHistory.weaponType,
        trophyScore: harvestHistory.trophyScore,
        notes: harvestHistory.notes,
        createdAt: harvestHistory.createdAt,
        stateCode: states.code,
        stateName: states.name,
        speciesSlug: species.slug,
        speciesName: species.commonName,
      })
      .from(harvestHistory)
      .innerJoin(states, eq(harvestHistory.stateId, states.id))
      .innerJoin(species, eq(harvestHistory.speciesId, species.id))
      .where(eq(harvestHistory.userId, session.user.id))
      .orderBy(desc(harvestHistory.year), desc(harvestHistory.createdAt));

    return NextResponse.json({ harvests });
  } catch (error) {
    console.error("[api/harvest] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch harvest history" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    const result = await submitHarvestFeedback({
      userId: session.user.id,
      stateCode: body.stateCode,
      speciesSlug: body.speciesSlug,
      unitCode: body.unitCode,
      year: body.year,
      success: body.success,
      weaponType: body.weaponType,
      trophyScore: body.trophyScore,
      daysHunted: body.daysHunted,
      satisfaction: body.satisfaction,
      wouldHuntAgain: body.wouldHuntAgain,
      notes: body.notes,
      recommendationId: body.recommendationId,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[api/harvest] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save harvest record" },
      { status: 500 }
    );
  }
}
