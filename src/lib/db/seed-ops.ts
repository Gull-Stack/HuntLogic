// =============================================================================
// HuntLogic — Ops Admin Seed Script
// =============================================================================
// Creates the first admin ops user for the operations panel.
//
// Usage:
//   DATABASE_URL=... npx tsx src/lib/db/seed-ops.ts
//
// Environment variables:
//   OPS_ADMIN_EMAIL    — Admin email (default: admin@huntlogic.ai)
//   OPS_ADMIN_PASSWORD — Admin password (default: changeme123)
// =============================================================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { opsUsers } from "./schema";

// ---------------------------------------------------------------------------
// Connect to database
// ---------------------------------------------------------------------------
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

async function seedOpsAdmin() {
  const email = (process.env.OPS_ADMIN_EMAIL || "admin@huntlogic.ai")
    .toLowerCase()
    .trim();
  const password = process.env.OPS_ADMIN_PASSWORD || "changeme123";

  console.log("=== HuntLogic Ops Admin Seed ===\n");
  console.log(`Email: ${email}`);

  // Check if user already exists
  const existing = await db
    .select({ id: opsUsers.id })
    .from(opsUsers)
    .where(eq(opsUsers.email, email))
    .limit(1);

  if (existing.length > 0) {
    console.log(`\nOps admin user already exists (id: ${existing[0].id}). Skipping.`);
    await client.end();
    process.exit(0);
  }

  // Hash password
  const passwordHash = await bcrypt.hash(password, 12);

  // Insert admin user
  const [admin] = await db
    .insert(opsUsers)
    .values({
      email,
      displayName: "Admin",
      passwordHash,
      role: "admin",
      active: true,
      assignedStates: [],
    })
    .returning();

  console.log(`\nCreated ops admin user:`);
  console.log(`  ID:    ${admin.id}`);
  console.log(`  Email: ${admin.email}`);
  console.log(`  Role:  ${admin.role}`);

  if (password === "changeme123") {
    console.log(
      "\n  WARNING: Using default password. Change it immediately in production!"
    );
  }

  await client.end();
  console.log("\nDone.");
}

seedOpsAdmin().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
