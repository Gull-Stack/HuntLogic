import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL || "");

async function main() {
  // Find the WGFD Draw Results source
  const sources = await sql`
    SELECT id, name, scraper_config FROM data_sources
    WHERE name ILIKE '%WGFD%Draw%'
  `;

  if (sources.length === 0) {
    console.log("No WGFD Draw source found");
    await sql.end();
    return;
  }

  const source = sources[0];
  console.log("Updating:", source.name, "(", source.id, ")");

  const config = source.scraper_config as any;

  // WGFD 2025 Draw Odds PDFs — key species for nonresident random draw
  const pdfEndpoints = [
    {
      path: "/media/32449/download?inline",
      parser: "draw_odds_table",
      doc_type: "draw_report",
      params: { year: "2025" },
      column_mappings: { unit: 0, weapon_type: 1, species: 2, total_tags: 3, total_applicants: 4 },
    },
    {
      path: "/media/32699/download?inline",
      parser: "draw_odds_table",
      doc_type: "draw_report",
      params: { year: "2025" },
      column_mappings: { unit: 0, weapon_type: 1, species: 2, total_tags: 3, total_applicants: 4 },
    },
    {
      path: "/media/32690/download?inline",
      parser: "draw_odds_table",
      doc_type: "draw_report",
      params: { year: "2025" },
      column_mappings: { unit: 0, weapon_type: 1, species: 2, total_tags: 3, total_applicants: 4 },
    },
    {
      path: "/media/32421/download?inline",
      parser: "draw_odds_table",
      doc_type: "draw_report",
      params: { year: "2025" },
      column_mappings: { unit: 0, weapon_type: 1, species: 2, total_tags: 3, total_applicants: 4 },
    },
    {
      path: "/media/32422/download?inline",
      parser: "draw_odds_table",
      doc_type: "draw_report",
      params: { year: "2025" },
      column_mappings: { unit: 0, weapon_type: 1, species: 2, total_tags: 3, total_applicants: 4 },
    },
  ];

  // Keep existing non-PDF endpoints, add PDF endpoints
  const existingNonPdf = (config.endpoints || []).filter(
    (ep: any) => !ep.path.includes("/media/")
  );

  const updatedConfig = {
    ...config,
    adapter: "pdf_download",
    endpoints: [...existingNonPdf, ...pdfEndpoints],
    species_slugs: ["elk", "mule_deer", "pronghorn", "bighorn_sheep", "moose"],
  };

  await sql`
    UPDATE data_sources
    SET scraper_config = ${JSON.stringify(updatedConfig)}::jsonb,
        updated_at = NOW()
    WHERE id = ${source.id}
  `;

  console.log(`Updated ${source.name} with ${pdfEndpoints.length} PDF endpoints`);
  console.log("Total endpoints:", updatedConfig.endpoints.length);
  console.log("PDF endpoints:");
  for (const ep of pdfEndpoints) {
    console.log(`  ${ep.path}`);
  }

  await sql.end();
}

main().catch(console.error);
