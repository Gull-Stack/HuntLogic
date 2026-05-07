/**
 * Quick coverage report for the draw_odds table — how much historical data
 * do we have per (state, year)? Drives the forecast point-creep regression.
 *
 * Run: DATABASE_URL="..." npx tsx scripts/check-draw-odds-coverage.ts
 */

import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL || "");

  const totals = await sql`SELECT count(*)::int AS rows FROM draw_odds`;
  const total = totals[0]?.rows ?? 0;
  console.log(`\nTotal draw_odds rows: ${total}\n`);

  if (total === 0) {
    console.log("No data — run a seed script first.");
    await sql.end();
    return;
  }

  const byStateYear = await sql`
    SELECT s.code AS state, d.year, count(*)::int AS rows,
           count(DISTINCT d.hunt_unit_id)::int AS units,
           count(DISTINCT d.species_id)::int AS species
    FROM draw_odds d
    JOIN states s ON s.id = d.state_id
    GROUP BY s.code, d.year
    ORDER BY s.code, d.year
  `;
  console.log("By state × year:");
  console.log("state | year | rows | units | species");
  console.log("------|------|------|-------|--------");
  for (const r of byStateYear) {
    console.log(`${r.state.padEnd(5)} | ${r.year} | ${String(r.rows).padStart(4)} | ${String(r.units).padStart(5)} | ${r.species}`);
  }

  // Forecast viability: how many units have 3+ years AND 5+ years?
  const depth = await sql`
    WITH unit_years AS (
      SELECT hunt_unit_id, count(DISTINCT year)::int AS year_count
      FROM draw_odds
      WHERE hunt_unit_id IS NOT NULL
      GROUP BY hunt_unit_id
    )
    SELECT
      count(*)::int AS units_total,
      count(*) FILTER (WHERE year_count >= 3)::int AS units_3yr,
      count(*) FILTER (WHERE year_count >= 5)::int AS units_5yr,
      count(*) FILTER (WHERE year_count >= 10)::int AS units_10yr
    FROM unit_years
  `;
  console.log("\nForecast regression viability (units with N+ years):");
  console.log(depth[0]);

  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
