// =============================================================================
// Ops Authentication — JWT-based auth for internal operations staff
// =============================================================================
// Completely separate from the customer Auth.js flow.
// Uses jose (Edge-compatible) for JWT signing/verification.
// =============================================================================

import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

// =============================================================================
// Types
// =============================================================================

export interface OpsSession {
  opsUserId: string;
  email: string;
  displayName: string;
  role: "admin" | "supervisor" | "agent";
  assignedStates: string[];
}

// =============================================================================
// Constants
// =============================================================================

const OPS_COOKIE_NAME = "ops_session";
const BCRYPT_ROUNDS = 12;
const JWT_EXPIRY = "8h";

// =============================================================================
// Helpers
// =============================================================================

function getJwtSecret(): Uint8Array {
  const secret =
    process.env.OPS_JWT_SECRET ||
    (process.env.NEXTAUTH_SECRET || "") + "_ops";

  if (!secret || secret === "_ops") {
    throw new Error(
      "OPS_JWT_SECRET or NEXTAUTH_SECRET must be set for ops authentication"
    );
  }

  return new TextEncoder().encode(secret);
}

// =============================================================================
// Password utilities
// =============================================================================

/**
 * Hash a plaintext password using bcrypt (12 rounds).
 */
export async function hashOpsPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Compare a plaintext password against a bcrypt hash.
 */
export async function verifyOpsPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// =============================================================================
// JWT utilities
// =============================================================================

/**
 * Sign an OpsSession payload into a JWT token (8h expiry).
 */
export async function signOpsToken(payload: OpsSession): Promise<string> {
  const secret = getJwtSecret();

  const token = await new SignJWT({ ...payload } as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRY)
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT token, returning the OpsSession or null.
 */
export async function verifyOpsToken(
  token: string
): Promise<OpsSession | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);

    // Validate required fields
    if (
      !payload.opsUserId ||
      !payload.email ||
      !payload.displayName ||
      !payload.role
    ) {
      return null;
    }

    return {
      opsUserId: payload.opsUserId as string,
      email: payload.email as string,
      displayName: payload.displayName as string,
      role: payload.role as OpsSession["role"],
      assignedStates: (payload.assignedStates as string[]) || [],
    };
  } catch {
    return null;
  }
}

// =============================================================================
// Session helpers (server-side)
// =============================================================================

/**
 * Get the authenticated ops user from the ops_session cookie.
 * Use in Server Components, Server Actions, and API Route Handlers.
 *
 * @throws OpsAuthError with status 401 if not authenticated or token invalid
 */
export async function getOpsUser(): Promise<OpsSession> {
  const cookieStore = await cookies();
  const token = cookieStore.get(OPS_COOKIE_NAME)?.value;

  if (!token) {
    throw new OpsAuthError("Not authenticated", 401);
  }

  const session = await verifyOpsToken(token);

  if (!session) {
    throw new OpsAuthError("Invalid or expired session", 401);
  }

  return session;
}

/**
 * Get authenticated ops user or null (non-throwing variant).
 * Useful for pages that show different content for auth'd vs anon users.
 */
export async function getOptionalOpsUser(): Promise<OpsSession | null> {
  try {
    return await getOpsUser();
  } catch {
    return null;
  }
}

// =============================================================================
// Error class
// =============================================================================

/**
 * Custom ops auth error with HTTP status code.
 */
export class OpsAuthError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = "OpsAuthError";
  }
}
