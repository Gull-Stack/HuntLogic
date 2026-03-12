import { NextRequest, NextResponse } from "next/server";
import {
  getRegulationsByState,
  getAllStatesRegulations,
} from "@/services/regulations";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const stateParam = searchParams.get("state");
    const docType = searchParams.get("docType") ?? undefined;
    const yearParam = searchParams.get("year");

    // If no state param, return all states with regulation counts
    if (!stateParam) {
      const allStates = await getAllStatesRegulations();
      return NextResponse.json({ states: allStates });
    }

    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    if (yearParam && (isNaN(year!) || year! < 1900 || year! > 2100)) {
      return NextResponse.json(
        { error: `Invalid year: ${yearParam}` },
        { status: 400 }
      );
    }

    const result = await getRegulationsByState(stateParam, { docType, year });
    if (!result) {
      return NextResponse.json(
        { error: `State not found: ${stateParam}` },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[regulations] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
