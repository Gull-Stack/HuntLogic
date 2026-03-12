// =============================================================================
// Custom Drizzle Adapter for Auth.js
// Maps Auth.js operations to our existing users + auth tables
// =============================================================================

import { eq, and } from "drizzle-orm";
import type { Adapter, AdapterAccount } from "next-auth/adapters";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema/users";
import { authAccounts, verificationTokens } from "@/lib/db/schema/auth";

/**
 * Custom adapter that maps Auth.js to our Drizzle schema.
 * Since we use JWT strategy, session methods are stubs.
 */
export function HuntLogicDrizzleAdapter(): Adapter {
  return {
    // =========================================================================
    // User operations
    // =========================================================================

    async createUser(data) {
      const inserted = await db
        .insert(users)
        .values({
          email: data.email.toLowerCase(),
          displayName: data.name ?? null,
          avatarUrl: data.image ?? null,
          onboardingStep: "welcome",
          onboardingComplete: false,
          timezone: "America/Denver",
        })
        .returning();

      const user = inserted[0];
      if (!user) throw new Error("Failed to create user");

      console.log(`[auth-adapter] Created user: ${user.id} (${user.email})`);

      return {
        id: user.id,
        email: user.email,
        emailVerified: null,
        name: user.displayName,
        image: user.avatarUrl,
      };
    },

    async getUser(id) {
      const user = await db.query.users.findFirst({
        where: eq(users.id, id),
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: null,
        name: user.displayName,
        image: user.avatarUrl,
      };
    },

    async getUserByEmail(email) {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email.toLowerCase()),
      });

      if (!user) return null;

      return {
        id: user.id,
        email: user.email,
        emailVerified: null,
        name: user.displayName,
        image: user.avatarUrl,
      };
    },

    async getUserByAccount({ provider, providerAccountId }) {
      const account = await db.query.authAccounts.findFirst({
        where: and(
          eq(authAccounts.provider, provider),
          eq(authAccounts.providerAccountId, providerAccountId)
        ),
        with: {
          user: true,
        },
      });

      if (!account?.user) return null;

      return {
        id: account.user.id,
        email: account.user.email,
        emailVerified: null,
        name: account.user.displayName,
        image: account.user.avatarUrl,
      };
    },

    async updateUser(data) {
      if (!data.id) throw new Error("User ID required for update");

      const updateData: Record<string, unknown> = {
        updatedAt: new Date(),
      };

      if (data.name !== undefined) updateData.displayName = data.name;
      if (data.image !== undefined) updateData.avatarUrl = data.image;
      if (data.email !== undefined)
        updateData.email = data.email.toLowerCase();

      await db.update(users).set(updateData).where(eq(users.id, data.id));

      const updated = await db.query.users.findFirst({
        where: eq(users.id, data.id),
      });

      if (!updated) throw new Error("User not found after update");

      return {
        id: updated.id,
        email: updated.email,
        emailVerified: null,
        name: updated.displayName,
        image: updated.avatarUrl,
      };
    },

    async deleteUser(userId) {
      await db.delete(users).where(eq(users.id, userId));
    },

    // =========================================================================
    // Account operations (OAuth provider links)
    // =========================================================================

    async linkAccount(data) {
      await db.insert(authAccounts).values({
        userId: data.userId,
        provider: data.provider,
        providerAccountId: data.providerAccountId,
        type: data.type,
        access_token: data.access_token ?? null,
        refresh_token: data.refresh_token ?? null,
        expires_at: data.expires_at ?? null,
        token_type: data.token_type ?? null,
        scope: data.scope ?? null,
        id_token: data.id_token ?? null,
        session_state: (data as Record<string, unknown>).session_state as string ?? null,
      });

      console.log(
        `[auth-adapter] Linked account: ${data.provider} for user ${data.userId}`
      );

      return data as AdapterAccount;
    },

    async unlinkAccount({ provider, providerAccountId }) {
      await db
        .delete(authAccounts)
        .where(
          and(
            eq(authAccounts.provider, provider),
            eq(authAccounts.providerAccountId, providerAccountId)
          )
        );
    },

    // =========================================================================
    // Session operations — stubs since we use JWT strategy
    // =========================================================================

    async createSession(data) {
      return {
        sessionToken: data.sessionToken,
        userId: data.userId,
        expires: data.expires,
      };
    },

    async getSessionAndUser(_sessionToken) {
      return null;
    },

    async updateSession(data) {
      return {
        sessionToken: data.sessionToken,
        userId: data.userId ?? "",
        expires: data.expires ?? new Date(),
      };
    },

    async deleteSession(_sessionToken) {
      // No-op for JWT strategy
    },

    // =========================================================================
    // Verification token operations (magic link)
    // =========================================================================

    async createVerificationToken(data) {
      const inserted = await db
        .insert(verificationTokens)
        .values({
          identifier: data.identifier,
          token: data.token,
          expires: data.expires,
        })
        .returning();

      const token = inserted[0];
      if (!token) throw new Error("Failed to create verification token");

      return {
        identifier: token.identifier,
        token: token.token,
        expires: token.expires,
      };
    },

    async useVerificationToken({ identifier, token }) {
      const found = await db
        .select()
        .from(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token)
          )
        )
        .limit(1);

      const vToken = found[0];
      if (!vToken) return null;

      // Delete after use
      await db
        .delete(verificationTokens)
        .where(
          and(
            eq(verificationTokens.identifier, identifier),
            eq(verificationTokens.token, token)
          )
        );

      return {
        identifier: vToken.identifier,
        token: vToken.token,
        expires: vToken.expires,
      };
    },
  };
}
