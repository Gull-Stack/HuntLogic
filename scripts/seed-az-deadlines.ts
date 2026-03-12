import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

async function seedAZDeadlines() {
  const stateResult = await sql`SELECT id FROM states WHERE code = 'AZ' LIMIT 1`;
  const stateId = stateResult[0]?.id;
  if (!stateId) {
    console.log("Arizona state not found in DB");
    await sql.end();
    return;
  }
  console.log("AZ state ID:", stateId);

  // Look up species IDs
  const speciesRows = await sql`SELECT id, slug FROM species WHERE slug IN ('elk', 'mule-deer')`;
  const speciesMap: Record<string, string> = {};
  for (const s of speciesRows) speciesMap[s.slug] = s.id;
  console.log("Species found:", Object.keys(speciesMap));

  const deadlines = [
    { title: "AZ Spring Draw Application Open", species: "elk", deadline_date: "2025-10-08", deadline_type: "application_open", description: "Spring draw opens for elk, pronghorn, javelina, bear, turkey, bison" },
    { title: "AZ Spring Draw Application Deadline", species: "elk", deadline_date: "2025-11-12", deadline_type: "application_deadline", description: "Spring draw application deadline" },
    { title: "AZ Credit Card Update Deadline", species: "elk", deadline_date: "2026-02-17", deadline_type: "other", description: "Last day to update credit card for spring draw" },
    { title: "AZ 2026M Draw Results (Pronghorn & Elk)", species: "elk", deadline_date: "2026-03-01", deadline_type: "draw_results", description: "2026M draw results posted for pronghorn and elk" },
    { title: "AZ Fall Draw Application Open", species: "mule-deer", deadline_date: "2026-05-01", deadline_type: "application_open", description: "Fall draw opens for deer, fall turkey, fall javelina" },
    { title: "AZ Fall Draw Application Deadline", species: "mule-deer", deadline_date: "2026-06-10", deadline_type: "application_deadline", description: "Fall draw application deadline" },
    { title: "AZ Fall Draw Results", species: "mule-deer", deadline_date: "2026-08-15", deadline_type: "draw_results", description: "Fall draw results posted for deer, turkey, javelina" },
    { title: "AZ PointGuard Purchase Deadline", species: "elk", deadline_date: "2026-02-17", deadline_type: "preference_point", description: "Last day to purchase PointGuard for spring draw" },
    { title: "AZ Sandhill Crane Draw Deadline", species: null, deadline_date: "2026-08-01", deadline_type: "application_deadline", description: "Sandhill crane permit draw application deadline" },
    { title: "AZ General Hunting License Available", species: null, deadline_date: "2026-01-01", deadline_type: "application_open", description: "General hunting and combo licenses available year-round" },
  ];

  let inserted = 0;
  for (const d of deadlines) {
    try {
      const speciesId = d.species ? (speciesMap[d.species] || null) : null;
      await sql`
        INSERT INTO deadlines (state_id, species_id, title, deadline_date, deadline_type, description, year, url, created_at)
        VALUES (${stateId}, ${speciesId}, ${d.title}, ${d.deadline_date}, ${d.deadline_type}, ${d.description}, 2026, 'https://draw.azgfd.com/', NOW())
        ON CONFLICT DO NOTHING
      `;
      inserted++;
      console.log("  + " + d.title + " (" + d.deadline_date + ")");
    } catch (err: any) {
      console.warn("  x " + d.title + ": " + err.message);
    }
  }

  const count = await sql`SELECT COUNT(*) as cnt FROM deadlines WHERE state_id = ${stateId}`;
  console.log("\nTotal AZ deadlines: " + count[0].cnt);
  console.log("Inserted: " + inserted);

  await sql.end();
}

seedAZDeadlines().catch(console.error);
