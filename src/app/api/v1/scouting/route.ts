import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generatePrepPlan } from "@/services/scouting";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recommendationId = request.nextUrl.searchParams.get("recommendationId");
  if (!recommendationId) {
    return NextResponse.json(
      { error: "Missing recommendationId parameter" },
      { status: 400 }
    );
  }

  try {
    const plan = await generatePrepPlan(recommendationId, session.user.id);
    if (!plan) {
      return NextResponse.json(
        { error: "Recommendation not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(plan);
  } catch (error) {
    console.error("[api/scouting] Error:", error);
    return NextResponse.json(
      { error: "Failed to generate prep plan" },
      { status: 500 }
    );
  }
}
