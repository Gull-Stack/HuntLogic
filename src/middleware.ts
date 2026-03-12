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
]);

// Path prefixes that are always public
const PUBLIC_PREFIXES = [
  "/api/auth",
  "/api/health",
  "/api/v1/deadlines",
  "/api/v1/regulations",
  "/api/v1/ingestion/trigger",
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
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|manifest.json|apple-touch-icon.png|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
