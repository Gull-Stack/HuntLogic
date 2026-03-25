/**
 * fix-wy-deadlines.ts
 *
 * Two fixes for Wyoming deadlines:
 * 1. Normalize deadline_type values:
 *      "application"  → "application_deadline"
 *      "draw_result"  → "draw_results"
 * 2. Insert missing application_open dates for each WY draw window
 *
 * Open dates sourced from WGFD:
 *   https://wgfd.wyo.gov/licenses-applications/application-dates-deadlines
 *
 * Run: DATABASE_URL=... npx tsx scripts/fix-wy-deadlines.ts
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function main() {
  console.log("=== Fix Wyoming Deadlines ===\n");

  // -- Get WY state ID --------------------------------------------------------
  const stateResult = await sql`SELECT id FROM states WHERE code = 'WY' LIMIT 1`;
  const stateId = stateResult[0]?.id as string | undefined;
  if (!stateId) {
    console.error("WY state not found in DB");
    await sql.end();
    process.exit(1);
  }

  // -- Get species IDs --------------------------------------------------------
  const speciesRows = await sql`SELECT id, slug FROM species`;
  const sp: Record<string, string> = {};
  for (const r of speciesRows) sp[r.slug as string] = r.id as string;

  // ==========================================================================
  // STEP 1: Normalize deadline_type values
  // ==========================================================================
  console.log("Step 1: Normalizing deadline_type values...");

  const fixApplication = await sql`
    UPDATE deadlines
    SET deadline_type = 'application_deadline'
    WHERE state_id = ${stateId}
      AND deadline_type = 'application'
    RETURNING title
  `;
  console.log(`  "application" → "application_deadline": ${fixApplication.length} rows`);

  const fixDrawResult = await sql`
    UPDATE deadlines
    SET deadline_type = 'draw_results'
    WHERE state_id = ${stateId}
      AND deadline_type = 'draw_result'
    RETURNING title
  `;
  console.log(`  "draw_result"  → "draw_results":        ${fixDrawResult.length} rows`);

  // ==========================================================================
  // STEP 2: Insert missing application_open entries
  //
  // WY draw windows (from WGFD application-dates-deadlines page):
  //
  // Nonresident elk + spring turkey:   Opens Nov 1, 2025 → closes Feb 1, 2026
  // Moose / bison / sheep / goat:      Opens Nov 1, 2025 → closes Apr 30, 2026
  // Resident elk / deer / antelope:    Opens Jan 1, 2026  → closes Jun 1, 2026
  // Fall turkey:                       Opens Mar 1, 2026  → closes Jun 1, 2026
  // Preference points (all species):   Opens Nov 1, 2026  (annual fall window)
  // ==========================================================================
  console.log("\nStep 2: Inserting application_open entries...");

  type OpenEntry = {
    title: string;
    species: string | null;
    deadline_date: string;
    description: string;
  };

  const opens: OpenEntry[] = [
    // Nonresident elk window (Nov 2025 open)
    {
      title: "WY Elk - Nonresident Application Opens",
      species: "elk",
      deadline_date: "2025-11-01",
      description: "Wyoming WGFD nonresident elk license application period opens. Closes February 1, 2026. Apply at wgfd.wyo.gov.",
    },
    // Spring turkey (Nov 2025 open, same window as NR elk)
    {
      title: "WY Spring Turkey Application Opens",
      species: "turkey",
      deadline_date: "2025-11-01",
      description: "Wyoming spring turkey license application period opens. Closes February 1, 2026. Apply at wgfd.wyo.gov.",
    },
    // Moose / bison / sheep / goat (Nov 2025 open)
    {
      title: "WY Moose Application Opens",
      species: "moose",
      deadline_date: "2025-11-01",
      description: "Wyoming moose license application period opens. Closes April 30, 2026. Apply at wgfd.wyo.gov.",
    },
    {
      title: "WY Bison Application Opens",
      species: "bison",
      deadline_date: "2025-11-01",
      description: "Wyoming bison license application period opens. Closes April 30, 2026. Apply at wgfd.wyo.gov.",
    },
    {
      title: "WY Bighorn Sheep Application Opens",
      species: "bighorn_sheep",
      deadline_date: "2025-11-01",
      description: "Wyoming bighorn sheep license application period opens. Closes April 30, 2026. Apply at wgfd.wyo.gov.",
    },
    {
      title: "WY Mountain Goat Application Opens",
      species: "mountain_goat",
      deadline_date: "2025-11-01",
      description: "Wyoming mountain goat license application period opens. Closes April 30, 2026. Apply at wgfd.wyo.gov.",
    },
    // Resident elk / deer / antelope (Jan 1 open)
    {
      title: "WY Elk - Resident Application Opens",
      species: "elk",
      deadline_date: "2026-01-01",
      description: "Wyoming resident elk license application period opens. Closes June 1, 2026. Apply at wgfd.wyo.gov.",
    },
    {
      title: "WY Deer Application Opens",
      species: "mule_deer",
      deadline_date: "2026-01-01",
      description: "Wyoming deer (mule deer and whitetail) license application period opens. Closes June 1, 2026. Apply at wgfd.wyo.gov.",
    },
    {
      title: "WY Antelope Application Opens",
      species: "pronghorn",
      deadline_date: "2026-01-01",
      description: "Wyoming pronghorn antelope license application period opens. Closes June 1, 2026. Apply at wgfd.wyo.gov.",
    },
    // Fall turkey (Mar 1 open)
    {
      title: "WY Fall Turkey Application Opens",
      species: "turkey",
      deadline_date: "2026-03-01",
      description: "Wyoming fall turkey license application period opens. Closes June 1, 2026. Apply at wgfd.wyo.gov.",
    },
  ];

  let inserted = 0;
  for (const o of opens) {
    const speciesId = o.species ? (sp[o.species] ?? null) : null;
    const year = parseInt(o.deadline_date.slice(0, 4), 10);

    const result = await sql`
      INSERT INTO deadlines (
        state_id, species_id, title, deadline_date,
        deadline_type, description, year, url, created_at
      )
      VALUES (
        ${stateId},
        ${speciesId},
        ${o.title},
        ${o.deadline_date},
        'application_open',
        ${o.description},
        ${year},
        'https://wgfd.wyo.gov/licenses-applications/application-dates-deadlines',
        NOW()
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `;

    if (result.length > 0) {
      console.log(`  ✓ ${o.title} (${o.deadline_date})`);
      inserted++;
    } else {
      console.log(`  · already exists: ${o.title}`);
    }
  }

  console.log(`\nInserted ${inserted} new open-date entries`);

  // -- Final state -----------------------------------------------------------
  const final = await sql`
    SELECT deadline_type, COUNT(*) as cnt
    FROM deadlines
    WHERE state_id = ${stateId}
    GROUP BY deadline_type
    ORDER BY deadline_type
  `;
  console.log("\nWY deadline_type breakdown:");
  for (const r of final) {
    console.log(`  ${String(r.deadline_type).padEnd(22)} ${r.cnt}`);
  }

  const total = await sql`SELECT COUNT(*) as cnt FROM deadlines WHERE state_id = ${stateId}`;
  console.log(`\nTotal WY deadlines: ${total[0]!.cnt}`);

  await sql.end();
  console.log("\n✅ Done");
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  process.exit(1);
});
