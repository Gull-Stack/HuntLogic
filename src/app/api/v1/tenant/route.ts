import { NextRequest, NextResponse } from "next/server";
import { detectTenant, getTenantConfig } from "@/lib/tenant";

export async function GET(request: NextRequest) {
  try {
    const hostname = request.headers.get("host") ?? undefined;
    const tenantId = detectTenant(request.headers, hostname);
    const config = await getTenantConfig(tenantId);

    return NextResponse.json({ config });
  } catch (error) {
    console.error("[api/tenant] GET error:", error);
    return NextResponse.json(
      {
        config: {
          id: "huntlogic",
          brandName: "HuntLogic",
          logoUrl: "/logo.svg",
          primaryColor: "#1A3C2A",
          ctaGradient: "linear-gradient(135deg, #C4651A, #D4A03C)",
          supportEmail: "support@huntlogic.com",
          featuresEnabled: ["all"],
        },
      },
      { status: 200 }
    );
  }
}
