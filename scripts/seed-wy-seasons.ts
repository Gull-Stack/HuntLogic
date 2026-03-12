import postgres from "postgres";
import { SeasonParser } from "../src/services/ingestion/parsers/season-parser";
import { StateNormalizer } from "../src/services/ingestion/normalizers/state-normalizer";

const sql = postgres(process.env.DATABASE_URL || "");
const normalizer = new StateNormalizer();

async function main() {
  // Get WY state ID
  const stateResult = await sql`SELECT id FROM states WHERE code = 'WY' LIMIT 1`;
  const stateId = stateResult[0]?.id;
  if (!stateId) { console.log("WY not found"); await sql.end(); return; }
  
  // Parse live WGFD page
  const res = await fetch("https://wgfd.wyo.gov/licenses-applications/application-dates-deadlines");
  const html = await res.text();
  const parser = new SeasonParser();
  const result = await parser.parse(html, {
    state_code: "WY",
    year: 2026,
    column_mappings: { season_name: "license type", start_date: "open date", end_date: "close date" },
  });
  
  console.log("Parsed " + result.records.length + " records");
  
  // Normalize
  const normalized = normalizer.normalizeSeasons(result.records as any[], "WY", "wgfd-direct-seed");
  
  // Clear existing WY seasons
  await sql`DELETE FROM seasons WHERE state_id = ${stateId}`;
  
  let inserted = 0;
  for (const rec of normalized.records) {
    const r = rec as any;
    
    // Look up species
    const speciesResult = await sql`SELECT id FROM species WHERE slug = ${r.speciesSlug} LIMIT 1`;
    if (speciesResult.length === 0) {
      console.log("  SKIP " + r.seasonName + " (species '" + r.speciesSlug + "' not in DB)");
      continue;
    }
    
    await sql`
      INSERT INTO seasons (state_id, species_id, year, season_name, weapon_type, start_date, end_date, tag_type, config, created_at)
      VALUES (${stateId}, ${speciesResult[0].id}, ${r.year}, ${r.seasonName}, ${r.weaponType || null}, ${r.startDate || null}, ${r.endDate || null}, ${r.tagType || null}, '{}', NOW())
      ON CONFLICT DO NOTHING
    `;
    inserted++;
    console.log("  + " + r.seasonName + " (" + r.speciesSlug + ") " + (r.startDate || "?") + " → " + (r.endDate || "?"));
  }
  
  const total = await sql`SELECT COUNT(*) as cnt FROM seasons WHERE state_id = ${stateId}`;
  console.log("\nWY seasons in DB: " + total[0].cnt);
  console.log("Inserted: " + inserted);
  
  await sql.end();
}

main().catch(console.error);
