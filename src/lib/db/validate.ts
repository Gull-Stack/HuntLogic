// =============================================================================
// HuntLogic — Database Validation Script
// =============================================================================
// Usage: npx tsx src/lib/db/validate.ts
// Validates that all 20 tables exist, seed data is present, joins work,
// and pgvector extension is available.
// Exit 0 on success, exit 1 on failure.
// =============================================================================

import postgres from "postgres";

// ---------------------------------------------------------------------------
// Connect to database
// ---------------------------------------------------------------------------
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  process.exit(1);
}

const sql = postgres(connectionString, { max: 1 });

// ---------------------------------------------------------------------------
// Expected tables (all 20)
// ---------------------------------------------------------------------------
const EXPECTED_TABLES = [
  "states",
  "species",
  "state_species",
  "hunt_units",
  "users",
  "hunter_preferences",
  "point_holdings",
  "application_history",
  "harvest_history",
  "data_sources",
  "documents",
  "draw_odds",
  "harvest_stats",
  "seasons",
  "deadlines",
  "playbooks",
  "recommendations",
  "user_actions",
  "ai_prompts",
  "app_config",
];

// Expected seed counts
const EXPECTED_COUNTS: Record<string, number> = {
  states: 50,
  species: 13,
  state_species: 100,
  ai_prompts: 8,
  app_config: 6,
};

// ---------------------------------------------------------------------------
// Validation logic
// ---------------------------------------------------------------------------
let failures = 0;
let passes = 0;

function pass(msg: string) {
  passes++;
  console.log(`  PASS  ${msg}`);
}

function fail(msg: string) {
  failures++;
  console.error(`  FAIL  ${msg}`);
}

async function validate() {
  console.log("=== HuntLogic Database Validation ===\n");

  // --------------------------------------------------------------------------
  // 1. Check all 20 tables exist
  // --------------------------------------------------------------------------
  console.log("[1/4] Checking tables exist...");

  const existingTables = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `;

  const existingTableNames = new Set(existingTables.map((r) => r.table_name));

  for (const table of EXPECTED_TABLES) {
    if (existingTableNames.has(table)) {
      pass(`Table "${table}" exists`);
    } else {
      fail(`Table "${table}" is MISSING`);
    }
  }

  // --------------------------------------------------------------------------
  // 2. Check seed data row counts
  // --------------------------------------------------------------------------
  console.log("\n[2/4] Checking seed data counts...");

  for (const [table, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
    if (!existingTableNames.has(table)) {
      fail(`Cannot count "${table}" — table missing`);
      continue;
    }

    const result = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    const actualCount = result[0]!.count;

    if (actualCount >= expectedCount) {
      pass(`${table}: ${actualCount} rows (expected >= ${expectedCount})`);
    } else {
      fail(`${table}: ${actualCount} rows (expected >= ${expectedCount})`);
    }
  }

  // Also show counts for non-seeded tables (should be 0, that's fine)
  const nonSeededTables = EXPECTED_TABLES.filter((t) => !(t in EXPECTED_COUNTS));
  for (const table of nonSeededTables) {
    if (!existingTableNames.has(table)) continue;
    const result = await sql.unsafe(`SELECT COUNT(*)::int AS count FROM "${table}"`);
    pass(`${table}: ${result[0]!.count} rows (no seed expected)`);
  }

  // --------------------------------------------------------------------------
  // 3. Test a sample join query
  // --------------------------------------------------------------------------
  console.log("\n[3/4] Testing join queries...");

  try {
    const joinResult = await sql`
      SELECT
        ss.id,
        s.code AS state_code,
        s.name AS state_name,
        sp.slug AS species_slug,
        sp.common_name,
        ss.has_draw,
        ss.has_points,
        ss.point_type
      FROM state_species ss
      JOIN states s ON ss.state_id = s.id
      JOIN species sp ON ss.species_id = sp.id
      WHERE s.code = 'CO' AND sp.slug = 'elk'
      LIMIT 1
    `;

    if (joinResult.length === 1) {
      const row = joinResult[0]!;
      pass(`JOIN query: CO Elk — draw=${row.has_draw}, points=${row.has_points}, type=${row.point_type}`);
    } else {
      fail(`JOIN query: Expected 1 row for CO Elk, got ${joinResult.length}`);
    }
  } catch (err) {
    fail(`JOIN query failed: ${err}`);
  }

  // Test a multi-state join
  try {
    const multiResult = await sql`
      SELECT
        s.code AS state_code,
        COUNT(*)::int AS species_count
      FROM state_species ss
      JOIN states s ON ss.state_id = s.id
      GROUP BY s.code
      ORDER BY species_count DESC
      LIMIT 5
    `;

    if (multiResult.length > 0) {
      const top = multiResult[0]!;
      pass(`Aggregation query: Top state = ${top.state_code} with ${top.species_count} species`);
    } else {
      fail("Aggregation query returned 0 rows");
    }
  } catch (err) {
    fail(`Aggregation query failed: ${err}`);
  }

  // --------------------------------------------------------------------------
  // 4. Test pgvector extension
  // --------------------------------------------------------------------------
  console.log("\n[4/4] Checking pgvector extension...");

  try {
    const extResult = await sql`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname = 'vector'
    `;

    if (extResult.length === 1) {
      pass(`pgvector extension v${extResult[0]!.extversion} is installed`);
    } else {
      fail("pgvector extension is NOT installed");
    }
  } catch (err) {
    fail(`pgvector check failed: ${err}`);
  }

  // Test that the vector column on documents works
  try {
    const colResult = await sql`
      SELECT column_name, data_type, udt_name
      FROM information_schema.columns
      WHERE table_name = 'documents' AND column_name = 'embedding'
    `;

    if (colResult.length === 1) {
      pass(`documents.embedding column exists (type: ${colResult[0]!.udt_name})`);
    } else {
      fail("documents.embedding column is MISSING");
    }
  } catch (err) {
    fail(`documents.embedding check failed: ${err}`);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log("\n=== Validation Summary ===");
  console.log(`  Passed: ${passes}`);
  console.log(`  Failed: ${failures}`);

  if (failures > 0) {
    console.error(`\nValidation FAILED with ${failures} error(s).`);
  } else {
    console.log("\nAll validations PASSED.");
  }

  return failures;
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------
validate()
  .then(async (failCount) => {
    await sql.end();
    process.exit(failCount > 0 ? 1 : 0);
  })
  .catch(async (err) => {
    console.error("Validation script error:", err);
    await sql.end();
    process.exit(1);
  });
