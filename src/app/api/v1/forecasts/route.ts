// =============================================================================
// GET /api/v1/forecasts — Forecast endpoints
//
// Supports three forecast types via query params:
//   ?type=point-creep&state=CO&species=elk
//   ?type=draw-odds&state=CO&species=elk&unit=61&points=3
//   ?type=roi&state=CO&species=elk&points=3&budget=3000
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  forecastPointCreep,
  forecastDrawOdds,
  assessPointValue,
} from "@/services/intelligence/forecast-engine";

const LOG_PREFIX = "[api:forecasts]";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const forecastType = searchParams.get("type") ?? "point-creep";
    const stateCode = searchParams.get("state");
    const speciesSlug = searchParams.get("species");

    if (!stateCode || !speciesSlug) {
      return NextResponse.json(
        { error: "state and species query parameters are required" },
        { status: 400 }
      );
    }

    console.log(
      `${LOG_PREFIX} GET: type=${forecastType} state=${stateCode} species=${speciesSlug}`
    );

    switch (forecastType) {
      // ===========================================================================
      // Point Creep Forecast
      // ===========================================================================
      case "point-creep": {
        const unit = searchParams.get("unit") ?? undefined;
        const forecast = await forecastPointCreep(stateCode, speciesSlug, unit);

        return NextResponse.json({
          type: "point-creep",
          forecast,
        });
      }

      // ===========================================================================
      // Draw Odds Forecast
      // ===========================================================================
      case "draw-odds": {
        const unit = searchParams.get("unit");
        const pointsStr = searchParams.get("points");

        if (!unit) {
          return NextResponse.json(
            { error: "unit query parameter is required for draw-odds forecast" },
            { status: 400 }
          );
        }

        const points = pointsStr ? parseInt(pointsStr, 10) : 0;
        if (isNaN(points)) {
          return NextResponse.json(
            { error: "points must be a number" },
            { status: 400 }
          );
        }

        const forecast = await forecastDrawOdds(stateCode, speciesSlug, unit, points);

        return NextResponse.json({
          type: "draw-odds",
          forecast,
        });
      }

      // ===========================================================================
      // ROI / Point Value Assessment
      // ===========================================================================
      case "roi": {
        const pointsStr = searchParams.get("points");
        const points = pointsStr ? parseInt(pointsStr, 10) : 0;

        if (isNaN(points)) {
          return NextResponse.json(
            { error: "points must be a number" },
            { status: 400 }
          );
        }

        const assessment = await assessPointValue(stateCode, speciesSlug, points);

        return NextResponse.json({
          type: "roi",
          assessment,
        });
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown forecast type: ${forecastType}. Valid types: point-creep, draw-odds, roi`,
          },
          { status: 400 }
        );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`${LOG_PREFIX} GET error:`, message);
    return NextResponse.json(
      { error: "Failed to generate forecast" },
      { status: 500 }
    );
  }
}
