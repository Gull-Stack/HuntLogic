// =============================================================================
// Next.js Middleware — Auth protection + onboarding redirects
// =============================================================================

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = new Set([
  "/",
  "/login",
  "/signup",
  "/verify",
  "/pricing",
  "/features",
  "/about",
  "/ops/login",
]);

// Path prefixes that are always public
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/health",
  "/api/webhooks",
  "/api/v1/deadlines",
  "/api/v1/regulations",
  "/api/v1/ingestion/trigger",
  "/api/v1/ops/auth",
  "/_next",
  "/favicon",
];

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // -------------------------------------------------------------------------
  // 1. Always allow public prefixes
  // -------------------------------------------------------------------------
  if (PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // 1b. Ops API routes (non-auth) — require ops_session cookie
  // -------------------------------------------------------------------------
  if (
    pathname.startsWith("/api/v1/ops") &&
    !pathname.startsWith("/api/v1/ops/auth")
  ) {
    const opsToken = req.cookies.get("ops_session")?.value;
    if (!opsToken) {
      return NextResponse.json(
        { error: "Ops authentication required" },
        { status: 401 }
      );
    }
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // 1c. Ops pages (non-login) — require ops_session cookie
  // -------------------------------------------------------------------------
  if (pathname.startsWith("/ops") && pathname !== "/ops/login") {
    const opsToken = req.cookies.get("ops_session")?.value;
    if (!opsToken) {
      return NextResponse.redirect(new URL("/ops/login", req.url));
    }
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // 2. Always allow static assets
  // -------------------------------------------------------------------------
  if (
    pathname.includes(".") &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // 3. Public routes — no auth required
  // -------------------------------------------------------------------------
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const isAuthenticated = !!req.auth?.user?.id;

  // -------------------------------------------------------------------------
  // 3a. Root "/" → redirect to landing site (unauthenticated) or dashboard
  // -------------------------------------------------------------------------
  const LANDING_SITE = process.env.LANDING_SITE_URL || "https://huntlogic-site.vercel.app";
  if (pathname === "/") {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.redirect(LANDING_SITE);
  }

  // -------------------------------------------------------------------------
  // 4. Not authenticated + protected route → redirect to login
  // -------------------------------------------------------------------------
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // -------------------------------------------------------------------------
  // 5. Authenticated but NOT onboarded → redirect to /onboarding
  //    (unless already on /onboarding)
  // -------------------------------------------------------------------------
  if (isAuthenticated && !req.auth?.user?.onboardingComplete) {
    if (
      !pathname.startsWith("/onboarding") &&
      !pathname.startsWith("/api/") &&
      !isPublicRoute
    ) {
      return NextResponse.redirect(new URL("/onboarding", req.url));
    }
  }

  // -------------------------------------------------------------------------
  // 6. Authenticated + onboarded + on /onboarding → redirect to /dashboard
  // -------------------------------------------------------------------------
  if (isAuthenticated && req.auth?.user?.onboardingComplete) {
    if (pathname.startsWith("/onboarding")) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  return NextResponse.next();
});

// =============================================================================
// Matcher — run middleware on these routes
// =============================================================================

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, robots.txt, manifest.json, icons
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json|sw\\.js|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
