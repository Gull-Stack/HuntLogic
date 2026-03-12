// =============================================================================
// Auth API — Simplified signup/login (full Auth.js comes later)
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

// =============================================================================
// GET /api/v1/auth — Auth status / info
// =============================================================================

export async function GET() {
  return NextResponse.json({
    message: "HuntLogic Auth API",
    endpoints: {
      signup: "POST /api/v1/auth with { email, displayName, password }",
      session: "Coming soon — Auth.js integration",
    },
  });
}

// =============================================================================
// POST /api/v1/auth — Simple signup (creates user in DB)
// =============================================================================

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.email) {
      return NextResponse.json(
        { error: "Bad Request", message: "Email is required" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: "Bad Request", message: "Invalid email address" },
        { status: 400 }
      );
    }

    // Password placeholder — stored nowhere, just validated for presence
    // Real hashing comes with Auth.js integration
    if (!body.password || body.password.length < 8) {
      return NextResponse.json(
        {
          error: "Bad Request",
          message: "Password must be at least 8 characters",
        },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await db.query.users.findFirst({
      where: eq(users.email, body.email.toLowerCase()),
    });

    if (existing) {
      return NextResponse.json(
        { error: "Conflict", message: "A user with this email already exists" },
        { status: 409 }
      );
    }

    // Create user
    const insertedRows = await db
      .insert(users)
      .values({
        email: body.email.toLowerCase(),
        displayName: body.displayName || null,
        phone: body.phone || null,
        onboardingStep: "welcome",
        onboardingComplete: false,
        timezone: body.timezone || "America/Denver",
      })
      .returning();

    const newUser = insertedRows[0];
    if (!newUser) {
      throw new Error("Failed to create user — no row returned");
    }

    console.log(`[auth] New user created: ${newUser.id} (${newUser.email})`);

    // JWT placeholder — real tokens come with Auth.js
    const placeholderToken = `huntlogic_${newUser.id}_${Date.now()}`;

    return NextResponse.json(
      {
        data: {
          id: newUser.id,
          email: newUser.email,
          displayName: newUser.displayName,
          onboardingStep: newUser.onboardingStep,
          onboardingComplete: newUser.onboardingComplete,
          createdAt: newUser.createdAt.toISOString(),
        },
        token: placeholderToken,
        meta: {
          note: "This is a placeholder token. Full Auth.js integration coming soon.",
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[auth] POST error:", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: "Failed to create user" },
      { status: 500 }
    );
  }
}
