import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "");

async function main() {
  // Check column names
  const cols = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'data_sources' ORDER BY ordinal_position`;
  console.log("data_sources columns:", cols.map(c => c.column_name).join(", "));

  const sources = await sql`SELECT id, name, scraper_config FROM data_sources`;
  for (const s of sources) {
    const cfg = s.scraper_config as any;
    console.log("\n" + s.name + " | adapter=" + cfg?.adapter);
    if (cfg?.endpoints) {
      for (const ep of cfg.endpoints) {
        console.log("  path=" + ep.path);
        console.log("  parser=" + ep.parser + " | doc_type=" + (ep.doc_type || "inferred"));
      }
    }
    console.log("  state_code=" + cfg?.state_code + " base_url=" + cfg?.base_url);
  }

  // Check structured data tables
  const drawCount = await sql`SELECT COUNT(*) as cnt FROM draw_odds`;
  const harvestCount = await sql`SELECT COUNT(*) as cnt FROM harvest_stats`;
  const seasonCount = await sql`SELECT COUNT(*) as cnt FROM seasons`;
  const docCount = await sql`SELECT COUNT(*) as cnt FROM documents`;
  console.log("\n=== Structured Data Tables ===");
  console.log("draw_odds:     " + drawCount[0].cnt);
  console.log("harvest_stats: " + harvestCount[0].cnt);
  console.log("seasons:       " + seasonCount[0].cnt);
  console.log("documents:     " + docCount[0].cnt);

  await sql.end();
}

main().catch(console.error);
