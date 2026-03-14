import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "");

async function main() {
  // Find WGFD Season source
  const sources = await sql`SELECT id, name FROM data_sources WHERE name ILIKE '%WGFD%Season%'`;
  console.log("WGFD Season sources:", JSON.stringify(sources));

  if (sources.length === 0) {
    console.log("No WGFD Season source found");
    await sql.end();
    return;
  }

  const sourceId = sources[0].id;
  console.log("Source ID:", sourceId);

  // Trigger via the API-style import
  const { triggerSource } = await import("../src/services/ingestion");
  await triggerSource(sourceId);
  console.log("Triggered! Jobs should appear in fetch queue now.");

  await sql.end();
}

main().catch(console.error);
