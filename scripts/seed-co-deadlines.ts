import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function seedCODeadlines() {
  const stateResult = await sql`SELECT id FROM states WHERE code = 'CO' LIMIT 1`;
  const stateId = stateResult[0]?.id;
  if (!stateId) {
    console.log("Colorado state not found in DB");
    await sql.end();
    return;
  }
  console.log("CO state ID:", stateId);

  const speciesRows = await sql`SELECT id, slug FROM species WHERE slug IN ('elk', 'mule-deer', 'pronghorn', 'moose', 'bighorn-sheep', 'mountain-goat', 'black-bear')`;
  const speciesMap: Record<string, string> = {};
  for (const s of speciesRows) speciesMap[s.slug] = s.id;
  console.log("Species found:", Object.keys(speciesMap));

  // Colorado 2026 deadlines (CPW draw schedule)
  const deadlines = [
    // Primary Draw
    { title: "CO Primary Draw Application Open", species: "elk", deadline_date: "2026-03-03", deadline_type: "application_open", description: "Primary big game draw application period opens for elk, deer, pronghorn, bear, moose, sheep, goat" },
    { title: "CO Primary Draw Application Deadline", species: "elk", deadline_date: "2026-04-07", deadline_type: "application_deadline", description: "Primary big game draw application deadline" },
    { title: "CO Primary Draw Results", species: "elk", deadline_date: "2026-05-27", deadline_type: "draw_results", description: "Primary draw results posted" },

    // Secondary Draw
    { title: "CO Secondary Draw Application Open", species: "elk", deadline_date: "2026-06-09", deadline_type: "application_open", description: "Secondary draw application opens for remaining licenses" },
    { title: "CO Secondary Draw Application Deadline", species: "elk", deadline_date: "2026-06-16", deadline_type: "application_deadline", description: "Secondary draw application deadline" },
    { title: "CO Secondary Draw Results", species: "elk", deadline_date: "2026-06-23", deadline_type: "draw_results", description: "Secondary draw results posted" },

    // Leftover
    { title: "CO Leftover Licenses Available", species: "elk", deadline_date: "2026-07-07", deadline_type: "application_open", description: "Leftover licenses go on sale first-come first-served" },

    // Preference Points
    { title: "CO Preference Point Application Open", species: "elk", deadline_date: "2026-03-03", deadline_type: "preference_point", description: "Preference point only applications open (included in primary draw window)" },
    { title: "CO Preference Point Application Deadline", species: "elk", deadline_date: "2026-04-07", deadline_type: "preference_point", description: "Last day to apply for preference points only" },

    // Mountain Goat/Sheep special
    { title: "CO Moose/Sheep/Goat Draw Deadline", species: "moose", deadline_date: "2026-04-07", deadline_type: "application_deadline", description: "Moose, bighorn sheep, and mountain goat draw deadline (primary draw)" },

    // Bear
    { title: "CO Bear License Application Open", species: null, deadline_date: "2026-03-03", deadline_type: "application_open", description: "Bear license application opens with primary draw" },

    // Turkey (spring)
    { title: "CO Spring Turkey Application Open", species: null, deadline_date: "2026-01-14", deadline_type: "application_open", description: "Spring turkey limited license draw application opens" },
    { title: "CO Spring Turkey Application Deadline", species: null, deadline_date: "2026-02-04", deadline_type: "application_deadline", description: "Spring turkey limited license draw deadline" },
    { title: "CO Spring Turkey Draw Results", species: null, deadline_date: "2026-02-18", deadline_type: "draw_results", description: "Spring turkey draw results posted" },

    // General hunting/fishing
    { title: "CO Annual Habitat Stamp Required", species: null, deadline_date: "2026-04-01", deadline_type: "other", description: "Annual habitat stamp required for all hunting/fishing licenses" },
  ];

  let inserted = 0;
  for (const d of deadlines) {
    try {
      const speciesId = d.species ? (speciesMap[d.species] || null) : null;
      await sql`
        INSERT INTO deadlines (state_id, species_id, title, deadline_date, deadline_type, description, year, url, created_at)
        VALUES (${stateId}, ${speciesId}, ${d.title}, ${d.deadline_date}, ${d.deadline_type}, ${d.description}, 2026, 'https://cpw.state.co.us/hunting/big-game/primary-draw', NOW())
        ON CONFLICT DO NOTHING
      `;
      inserted++;
      console.log("  + " + d.title + " (" + d.deadline_date + ")");
    } catch (err: any) {
      console.warn("  x " + d.title + ": " + err.message);
    }
  }

  const count = await sql`SELECT COUNT(*) as cnt FROM deadlines WHERE state_id = ${stateId}`;
  console.log("\nTotal CO deadlines: " + count[0].cnt);
  console.log("Inserted: " + inserted);

  // Show total across all states
  const total = await sql`SELECT s.code, COUNT(*) as cnt FROM deadlines d JOIN states s ON d.state_id = s.id GROUP BY s.code ORDER BY s.code`;
  console.log("\n=== All Deadlines by State ===");
  for (const r of total) console.log("  " + r.code + ": " + r.cnt);

  await sql.end();
}

seedCODeadlines().catch(console.error);
