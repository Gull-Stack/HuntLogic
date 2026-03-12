import { NextRequest, NextResponse } from "next/server";
import { getRegulationsByState } from "@/services/regulations";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ stateCode: string }> }
) {
  try {
    const { stateCode } = await params;
    const { searchParams } = new URL(request.url);
    const docType = searchParams.get("docType") ?? undefined;
    const yearParam = searchParams.get("year");

    const year = yearParam ? parseInt(yearParam, 10) : undefined;
    if (yearParam && (isNaN(year!) || year! < 1900 || year! > 2100)) {
      return NextResponse.json(
        { error: `Invalid year: ${yearParam}` },
        { status: 400 }
      );
    }

    const result = await getRegulationsByState(stateCode, { docType, year });
    if (!result) {
      return NextResponse.json(
        { error: `State not found: ${stateCode}` },
        { status: 404 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("[regulations/stateCode] GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
