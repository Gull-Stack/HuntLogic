import postgres from "postgres";
const sql = postgres(process.env.DATABASE_URL || "");

async function main() {
  const seasons = await sql`
    SELECT s.year, s.season_name, sp.common_name as species, st.code as state
    FROM seasons s 
    LEFT JOIN species sp ON s.species_id = sp.id
    LEFT JOIN states st ON s.state_id = st.id
    ORDER BY s.season_name
  `;
  console.log("=== Seasons (" + seasons.length + ") ===");
  for (const s of seasons) {
    console.log("  " + s.state + " | " + s.season_name + " | " + s.species + " | " + s.year);
  }

  const draw = await sql`SELECT COUNT(*) as cnt FROM draw_odds`;
  const harvest = await sql`SELECT COUNT(*) as cnt FROM harvest_stats`;
  const docs = await sql`SELECT COUNT(*) as cnt FROM documents`;
  const deadlines = await sql`SELECT COUNT(*) as cnt FROM deadlines`;
  console.log("\ndraw_odds: " + draw[0].cnt);
  console.log("harvest_stats: " + harvest[0].cnt);
  console.log("documents: " + docs[0].cnt);
  console.log("deadlines: " + deadlines[0].cnt);

  const speciesList = await sql`SELECT slug, common_name FROM species ORDER BY slug`;
  console.log("\n=== Species (" + speciesList.length + ") ===");
  for (const s of speciesList) console.log("  " + s.slug + " = " + s.common_name);

  await sql.end();
}

main().catch(console.error);
