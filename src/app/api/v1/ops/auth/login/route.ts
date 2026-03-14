// =============================================================================
// POST /api/v1/ops/auth/login — Authenticate ops user
// =============================================================================

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { opsUsers } from "@/lib/db/schema";
import {
  verifyOpsPassword,
  signOpsToken,
  type OpsSession,
} from "@/lib/auth/ops-auth";

const LOG_PREFIX = "[api:ops/auth/login]";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // -----------------------------------------------------------------------
    // 1. Validate input
    // -----------------------------------------------------------------------
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // -----------------------------------------------------------------------
    // 2. Look up ops user by email
    // -----------------------------------------------------------------------
    const opsUser = await db.query.opsUsers.findFirst({
      where: eq(opsUsers.email, email.toLowerCase().trim()),
    });

    if (!opsUser) {
      console.warn(`${LOG_PREFIX} Failed login attempt for: ${email}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // -----------------------------------------------------------------------
    // 3. Check account is active
    // -----------------------------------------------------------------------
    if (!opsUser.active) {
      console.warn(`${LOG_PREFIX} Login attempt for deactivated account: ${email}`);
      return NextResponse.json(
        { error: "Account is deactivated" },
        { status: 403 }
      );
    }

    // -----------------------------------------------------------------------
    // 4. Verify password
    // -----------------------------------------------------------------------
    if (!opsUser.passwordHash) {
      console.warn(`${LOG_PREFIX} No password set for: ${email}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordValid = await verifyOpsPassword(password, opsUser.passwordHash);

    if (!passwordValid) {
      console.warn(`${LOG_PREFIX} Invalid password for: ${email}`);
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // -----------------------------------------------------------------------
    // 5. Build session and sign JWT
    // -----------------------------------------------------------------------
    const session: OpsSession = {
      opsUserId: opsUser.id,
      email: opsUser.email,
      displayName: opsUser.displayName,
      role: opsUser.role as OpsSession["role"],
      assignedStates: (opsUser.assignedStates as string[]) || [],
    };

    const token = await signOpsToken(session);

    // -----------------------------------------------------------------------
    // 6. Set HttpOnly cookie
    // -----------------------------------------------------------------------
    const cookieStore = await cookies();
    cookieStore.set("ops_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60, // 8 hours (matches JWT expiry)
    });

    console.log(`${LOG_PREFIX} Successful login: ${email} (${opsUser.role})`);

    return NextResponse.json({ data: { user: session } });
  } catch (error) {
    console.error(`${LOG_PREFIX} Error:`, error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
