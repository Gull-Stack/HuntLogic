import postgres from "postgres";
import { SeasonParser } from "../src/services/ingestion/parsers/season-parser";
import { StateNormalizer } from "../src/services/ingestion/normalizers/state-normalizer";

const sql = postgres(process.env.DATABASE_URL || "");
const normalizer = new StateNormalizer();

async function main() {
  // 1. Parse
  const res = await fetch("https://wgfd.wyo.gov/licenses-applications/application-dates-deadlines");
  const html = await res.text();
  const parser = new SeasonParser();
  const result = await parser.parse(html, {
    state_code: "WY",
    year: 2026,
    column_mappings: { season_name: "license type", start_date: "open date", end_date: "close date" },
  });
  
  console.log("Parsed " + result.records.length + " records");
  
  // 2. Normalize (like normalize worker does)
  const normalized = normalizer.normalizeSeasons(
    result.records as any[],
    "WY",
    "test-source"
  );
  
  console.log("Normalized " + normalized.records.length + " records");
  
  // 3. Check each species lookup
  for (const rec of normalized.records) {
    const r = rec as any;
    const speciesResult = await sql`SELECT id, slug FROM species WHERE slug = ${r.speciesSlug} LIMIT 1`;
    const found = speciesResult.length > 0;
    console.log(
      (found ? "OK" : "MISS") + " | " + r.seasonName + " | species=" + r.speciesSlug + 
      (found ? " (id=" + speciesResult[0].id.slice(0,8) + ")" : "")
    );
  }
  
  await sql.end();
}

main().catch(console.error);
