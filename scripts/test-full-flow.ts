import postgres from "postgres";
import { SeasonParser } from "../src/services/ingestion/parsers/season-parser";

const sql = postgres(process.env.DATABASE_URL || "");

async function main() {
  // Simulate exactly what the pipeline does

  // 1. Load source config from DB (like fetch worker does)
  const sources = await sql`SELECT id, scraper_config FROM data_sources WHERE name = 'WGFD Season Dates & Regulations'`;
  const cfg = sources[0].scraper_config as any;
  const endpoint = cfg.endpoints.find((ep: any) => ep.path.includes("application-dates-deadlines"));
  
  console.log("Endpoint config:");
  console.log("  parser:", endpoint.parser);
  console.log("  column_mappings:", JSON.stringify(endpoint.column_mappings));

  // 2. Fetch the page (like web scraper adapter)
  const res = await fetch("https://wgfd.wyo.gov" + endpoint.path);
  const html = await res.text();
  console.log("  fetched:", html.length, "bytes");

  // 3. Build parser config (like parse worker does)
  const parserConfig = {
    state_code: cfg.state_code,
    year: 2026,
    column_mappings: endpoint.column_mappings,  // THIS IS THE KEY
    table_selector: endpoint.table_selector,
  };
  console.log("  parser config:", JSON.stringify(parserConfig));

  // 4. Parse (like parse worker does)
  const parser = new SeasonParser();
  const result = await parser.parse(html, parserConfig);
  console.log("\nParse result:");
  console.log("  records:", result.records.length);
  console.log("  quality:", result.qualityScore);

  for (const r of result.records) {
    const rec = r as Record<string, unknown>;
    console.log("  " + rec.seasonName + " | " + rec.species + " | open=" + rec.startDate + " close=" + rec.endDate);
  }

  await sql.end();
}

main().catch(console.error);
