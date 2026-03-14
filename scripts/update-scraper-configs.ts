import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "");

async function main() {
  // Update WGFD Season Dates source with column mappings for WGFD table structure
  // Headers: License Type | Open Date | Close Date | Modify/Withdraw | Draw Results | Preference Pt Application Period
  
  const wgfdSeasons = await sql`
    SELECT id, name, scraper_config FROM data_sources 
    WHERE name = 'WGFD Season Dates & Regulations'
  `;
  
  if (wgfdSeasons.length > 0) {
    const cfg = wgfdSeasons[0].scraper_config as any;
    
    // Update the deadline endpoint's parser config
    for (const ep of cfg.endpoints) {
      if (ep.path.includes("application-dates-deadlines")) {
        ep.column_mappings = {
          season_name: "license type",
          start_date: "open date",
          end_date: "close date",
        };
        ep.parser_config = {
          column_mappings: {
            season_name: "license type",
            start_date: "open date", 
            end_date: "close date",
          },
        };
      }
    }
    
    await sql`UPDATE data_sources SET scraper_config = ${sql.json(cfg)} WHERE id = ${wgfdSeasons[0].id}`;
    console.log("Updated WGFD Season Dates config with column mappings");
  }
  
  // Update WGFD Draw Results source
  const wgfdDraw = await sql`
    SELECT id, name, scraper_config FROM data_sources 
    WHERE name = 'WGFD Draw Results & Odds'
  `;
  
  if (wgfdDraw.length > 0) {
    const cfg = wgfdDraw[0].scraper_config as any;
    // The deadline endpoint should use season_dates parser not draw_odds_table
    for (const ep of cfg.endpoints) {
      if (ep.path.includes("application-dates-deadlines")) {
        ep.parser = "season_dates";
        ep.column_mappings = {
          season_name: "license type",
          start_date: "open date",
          end_date: "close date",
        };
      }
    }
    await sql`UPDATE data_sources SET scraper_config = ${sql.json(cfg)} WHERE id = ${wgfdDraw[0].id}`;
    console.log("Updated WGFD Draw Results config");
  }
  
  // Verify
  const all = await sql`SELECT name, scraper_config FROM data_sources WHERE name LIKE '%WGFD%'`;
  for (const s of all) {
    const cfg = s.scraper_config as any;
    console.log("\n" + s.name);
    for (const ep of cfg.endpoints) {
      console.log("  " + ep.path + " → parser=" + ep.parser + " mappings=" + JSON.stringify(ep.column_mappings || ep.parser_config?.column_mappings || "none"));
    }
  }
  
  await sql.end();
}

main().catch(console.error);
