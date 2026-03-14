// =============================================================================
// Auth.js (NextAuth v5) Configuration
// =============================================================================
// Providers: Google OAuth, Apple OAuth, Email Magic Link (Resend)
// Strategy: JWT (30-day expiry)
// Adapter: Custom Drizzle adapter mapping to our users table
// =============================================================================

import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Apple from "next-auth/providers/apple";
import Resend from "next-auth/providers/resend";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { HuntLogicDrizzleAdapter } from "./adapter";
import { config } from "@/lib/config";

// =============================================================================
// Type augmentation for Auth.js
// =============================================================================

declare module "next-auth" {
  interface Session {
    user: {
      id: string; // Our DB user UUID
      email: string;
      name?: string;
      image?: string;
      onboardingComplete: boolean;
      onboardingStep: string;
    };
  }
}

// JWT extension: userId, onboardingComplete, onboardingStep
// are added via the jwt callback below and typed via `as` casts

// =============================================================================
// Auth configuration
// =============================================================================

export const authConfig: NextAuthConfig = {
  adapter: HuntLogicDrizzleAdapter(),

  // Trust the host header — required for Vercel deployments where the
  // canonical URL may differ from the request host (e.g. preview URLs)
  trustHost: true,

  // ---------------------------------------------------------------------------
  // Providers
  // ---------------------------------------------------------------------------
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // Apple — only register if credentials are configured
    ...(process.env.APPLE_ID && process.env.APPLE_PRIVATE_KEY
      ? [
          Apple({
            clientId: process.env.APPLE_ID,
            clientSecret: {
              teamId: process.env.APPLE_TEAM_ID!,
              privateKey: process.env.APPLE_PRIVATE_KEY,
              keyId: process.env.APPLE_KEY_ID!,
            } as unknown as string,
          }),
        ]
      : []),

    // Resend email — only register if API key is configured
    ...(process.env.RESEND_API_KEY
      ? [
          Resend({
            apiKey: process.env.RESEND_API_KEY,
            from: config.auth.emailFrom,
          }),
        ]
      : []),
  ],

  // ---------------------------------------------------------------------------
  // Session strategy
  // ---------------------------------------------------------------------------
  session: {
    strategy: "jwt",
    maxAge: config.cache.sessionMaxAge,
  },

  // ---------------------------------------------------------------------------
  // Custom pages
  // ---------------------------------------------------------------------------
  pages: {
    signIn: "/login",
    newUser: "/onboarding",
    error: "/login",
  },

  // ---------------------------------------------------------------------------
  // Callbacks
  // ---------------------------------------------------------------------------
  callbacks: {
    /**
     * signIn: On first sign-in, create user record if not exists.
     * Sets onboarding_step = 'welcome', onboarding_complete = false.
     */
    async signIn({ user, account }) {
      if (!user.email) return false;

      try {
        // Check if user exists in our DB
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email.toLowerCase()),
        });

        if (!existingUser) {
          // User will be created by the adapter's createUser method
          // which is called automatically by Auth.js for new users
          console.log(
            `[auth] New sign-in detected for ${user.email} via ${account?.provider}`
          );
        } else {
          console.log(
            `[auth] Returning user sign-in: ${existingUser.id} via ${account?.provider}`
          );
        }

        return true;
      } catch (error) {
        console.error("[auth] signIn callback error:", error);
        return false;
      }
    },

    /**
     * jwt: Add userId, onboardingComplete, and onboardingStep to JWT token.
     */
    async jwt({ token, user, trigger }) {
      const t = token as Record<string, unknown>;
      // Re-read from DB on sign-in, explicit update, or while onboarding is incomplete
      // (once onboardingComplete=true, we stop re-checking on every request)
      const needsRefresh =
        user?.email ||
        trigger === "signIn" ||
        trigger === "update" ||
        t.onboardingComplete === false;

      if (needsRefresh) {
        const email = user?.email ?? (t.email as string | undefined);
        if (email) {
          const dbUser = await db.query.users.findFirst({
            where: eq(users.email, email.toLowerCase()),
          });

          if (dbUser) {
            t.userId = dbUser.id;
            t.onboardingComplete = dbUser.onboardingComplete;
            t.onboardingStep = dbUser.onboardingStep;
          }
        }
      }

      return token;
    },

    /**
     * session: Expose userId, onboardingComplete, onboardingStep in session.
     */
    async session({ session, token }) {
      const t = token as Record<string, unknown>;
      if (t.userId) {
        session.user.id = t.userId as string;
        session.user.onboardingComplete = (t.onboardingComplete as boolean) ?? false;
        session.user.onboardingStep = (t.onboardingStep as string) ?? "welcome";
      }

      return session;
    },
  },

  // ---------------------------------------------------------------------------
  // Events
  // ---------------------------------------------------------------------------
  events: {
    async createUser({ user }) {
      console.log(
        `[auth] New user created: ${user.id} (${user.email}). Sending welcome notification.`
      );

      // Send welcome notification (in-app + email via notification service)
      if (user.id) {
        try {
          const { createNotification } = await import(
            "@/services/notifications/index"
          );

          await createNotification({
            userId: user.id,
            type: "welcome",
            title: `Welcome to ${config.app.brandName}!`,
            body: "Your AI-powered hunting concierge is ready. Complete your profile to get personalized draw recommendations, point tracking, and multi-year strategy playbooks tailored to your goals.",
            actionUrl: "/onboarding",
          });

          console.log(`[auth] Welcome notification sent to user ${user.id}`);
        } catch (err) {
          // Non-blocking — don't fail signup if notification fails
          console.warn("[auth] Failed to send welcome notification:", err);
        }
      }
    },
  },

  // ---------------------------------------------------------------------------
  // Debug mode in development
  // ---------------------------------------------------------------------------
  debug: process.env.NODE_ENV === "development",
};
