// =============================================================================
// Point Holdings API — GET (list) and PUT (bulk upsert)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getPointHoldings, setPointHoldings } from "@/services/profile";
import type { PointHoldingInput } from "@/services/profile";

// =============================================================================
// GET /api/v1/profile/points — List all point holdings with state/species names
// =============================================================================

export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User ID is required" },
        { status: 401 }
      );
    }

    const holdings = await getPointHoldings(userId);

    // Group by state
    const groupedByState = new Map<
      string,
      {
        stateCode: string;
        stateName: string;
        holdings: typeof holdings;
      }
    >();

    for (const h of holdings) {
      if (!groupedByState.has(h.stateCode)) {
        groupedByState.set(h.stateCode, {
          stateCode: h.stateCode,
          stateName: h.stateName,
          holdings: [],
        });
      }
      groupedByState.get(h.stateCode)!.holdings.push(h);
    }

    return NextResponse.json({
      data: holdings,
      meta: {
        totalHoldings: holdings.length,
        byState: Object.fromEntries(
          [...groupedByState.entries()].map(([code, group]) => [
            code,
            {
              stateName: group.stateName,
              count: group.holdings.length,
              totalPoints: group.holdings.reduce((sum, h) => sum + h.points, 0),
            },
          ])
        ),
      },
    });
  } catch (error) {
    console.error("[points] GET error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to fetch point holdings" },
      { status: 500 }
    );
  }
}

// =============================================================================
// PUT /api/v1/profile/points — Bulk upsert point holdings
// =============================================================================

export async function PUT(request: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized", message: "User ID is required" },
        { status: 401 }
      );
    }

    const body = await request.json();

    if (!body.holdings || !Array.isArray(body.holdings)) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Request body must include a 'holdings' array",
        },
        { status: 400 }
      );
    }

    const validPointTypes = new Set(["preference", "bonus", "loyalty"]);

    const holdings: PointHoldingInput[] = [];
    for (const h of body.holdings) {
      if (!h.stateId || !h.speciesId || !h.pointType || h.points === undefined) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message:
              "Each holding must have stateId, speciesId, pointType, and points. Got: " +
              JSON.stringify(h),
          },
          { status: 400 }
        );
      }

      if (!validPointTypes.has(h.pointType)) {
        return NextResponse.json(
          {
            error: "Bad Request",
            message: `Invalid pointType: ${h.pointType}. Valid: preference, bonus, loyalty`,
          },
          { status: 400 }
        );
      }

      holdings.push({
        stateId: h.stateId,
        speciesId: h.speciesId,
        pointType: h.pointType,
        points: Number(h.points),
        yearStarted: h.yearStarted ? Number(h.yearStarted) : undefined,
      });
    }

    await setPointHoldings(userId, holdings);

    // Return updated holdings
    const updatedHoldings = await getPointHoldings(userId);

    // Group by state
    const groupedByState = new Map<
      string,
      {
        stateCode: string;
        stateName: string;
        holdings: typeof updatedHoldings;
      }
    >();

    for (const h of updatedHoldings) {
      if (!groupedByState.has(h.stateCode)) {
        groupedByState.set(h.stateCode, {
          stateCode: h.stateCode,
          stateName: h.stateName,
          holdings: [],
        });
      }
      groupedByState.get(h.stateCode)!.holdings.push(h);
    }

    return NextResponse.json({
      data: updatedHoldings,
      meta: {
        upserted: holdings.length,
        totalHoldings: updatedHoldings.length,
        byState: Object.fromEntries(
          [...groupedByState.entries()].map(([code, group]) => [
            code,
            {
              stateName: group.stateName,
              count: group.holdings.length,
              totalPoints: group.holdings.reduce((sum, h) => sum + h.points, 0),
            },
          ])
        ),
      },
    });
  } catch (error) {
    console.error("[points] PUT error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to update point holdings" },
      { status: 500 }
    );
  }
}
