import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { stateCredentials } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { encryptCredentials } from "@/services/vault";

// In-memory rate limiter: userId -> { count, windowStart }
const rateLimiter = new Map<string, { count: number; windowStart: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60 * 60 * 1000; // 1 hour

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimiter.get(userId);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    rateLimiter.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) return false;

  entry.count++;
  return true;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const creds = await db
      .select({
        id: stateCredentials.id,
        stateCode: stateCredentials.stateCode,
        status: stateCredentials.status,
        lastVerified: stateCredentials.lastVerified,
        createdAt: stateCredentials.createdAt,
      })
      .from(stateCredentials)
      .where(eq(stateCredentials.userId, session.user.id));

    // NEVER return encrypted credentials in responses
    return NextResponse.json({ credentials: creds });
  } catch (error) {
    console.error("[api/credentials] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch credentials" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!checkRateLimit(session.user.id)) {
    return NextResponse.json(
      { error: "Too many attempts. Try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { stateCode, username, password } = body;

    if (!stateCode || !username || !password) {
      return NextResponse.json(
        { error: "stateCode, username, and password are required" },
        { status: 400 }
      );
    }

    // Encrypt credentials — NEVER log plaintext
    const { encryptedUsername, encryptedBlob } = encryptCredentials(
      username,
      password
    );

    // Upsert
    const existing = await db
      .select()
      .from(stateCredentials)
      .where(
        and(
          eq(stateCredentials.userId, session.user.id),
          eq(stateCredentials.stateCode, stateCode)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(stateCredentials)
        .set({
          username: encryptedUsername,
          credentialBlob: encryptedBlob,
          status: "active",
          updatedAt: new Date(),
        })
        .where(eq(stateCredentials.id, existing[0].id));
    } else {
      await db.insert(stateCredentials).values({
        userId: session.user.id,
        stateCode,
        username: encryptedUsername,
        credentialBlob: encryptedBlob,
        status: "active",
      });
    }

    return NextResponse.json(
      { stateCode, status: "active" },
      { status: 201 }
    );
  } catch (error) {
    console.error("[api/credentials] POST error:", error);
    return NextResponse.json(
      { error: "Failed to save credentials" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const stateCode = searchParams.get("stateCode");

    if (!stateCode) {
      return NextResponse.json(
        { error: "stateCode is required" },
        { status: 400 }
      );
    }

    await db
      .delete(stateCredentials)
      .where(
        and(
          eq(stateCredentials.userId, session.user.id),
          eq(stateCredentials.stateCode, stateCode)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[api/credentials] DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete credentials" },
      { status: 500 }
    );
  }
}
