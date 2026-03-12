import postgres from "postgres";
import { PDFParse } from "pdf-parse";
import { DrawOddsTableParser } from "../src/services/ingestion/parsers/draw-odds-parser";
import { StateNormalizer } from "../src/services/ingestion/normalizers/state-normalizer";

const sql = postgres(process.env.DATABASE_URL || "");
const normalizer = new StateNormalizer();
const drawParser = new DrawOddsTableParser();

const WGFD_PDFS = [
  { url: "https://wgfd.wyo.gov/media/32449/download?inline", species: "elk", label: "NR Elk Random" },
  { url: "https://wgfd.wyo.gov/media/32699/download?inline", species: "mule_deer", label: "NR Deer Random" },
  { url: "https://wgfd.wyo.gov/media/32690/download?inline", species: "pronghorn", label: "NR Antelope Random" },
  { url: "https://wgfd.wyo.gov/media/32421/download?inline", species: "bighorn_sheep", label: "NR Bighorn Random" },
  { url: "https://wgfd.wyo.gov/media/32422/download?inline", species: "moose", label: "NR Moose Random" },
];

async function main() {
  // Get WY state ID
  const stateResult = await sql`SELECT id FROM states WHERE code = 'WY' LIMIT 1`;
  const stateId = stateResult[0]?.id;
  if (!stateId) { console.log("WY not found"); await sql.end(); return; }

  let totalInserted = 0;

  for (const pdf of WGFD_PDFS) {
    console.log(`\n--- ${pdf.label} ---`);

    // Fetch PDF
    const res = await fetch(pdf.url, { headers: { "User-Agent": "Mozilla/5.0 HuntLogic/1.0" }, redirect: "follow" });
    if (!res.ok) { console.log(`  SKIP: HTTP ${res.status}`); continue; }

    const buffer = await res.arrayBuffer();
    const pdfParser = new PDFParse({ data: Buffer.from(buffer) });
    const textResult = await pdfParser.getText();

    // Parse draw odds
    const result = await drawParser.parse(textResult.text, {
      state_code: "WY",
      species_slug: pdf.species,
      year: 2025,
      column_mappings: { unit: 0, weapon_type: 1, species: 2, total_tags: 3, total_applicants: 4 },
    });

    console.log(`  Parsed ${result.records.length} records (quality: ${result.qualityScore})`);

    // Normalize and insert
    const normalized = normalizer.normalizeDrawOdds(result.records as any[], "WY", "wgfd-pdf-seed");

    let inserted = 0;
    for (const rec of normalized.records) {
      const r = rec as any;

      // Look up species
      const speciesSlug = normalizer.normalizeSpecies(r.species || pdf.species);
      const speciesResult = await sql`SELECT id FROM species WHERE slug = ${speciesSlug} LIMIT 1`;
      if (speciesResult.length === 0) {
        // Try the configured species slug
        const fallback = await sql`SELECT id FROM species WHERE slug = ${pdf.species} LIMIT 1`;
        if (fallback.length === 0) continue;
        r._speciesId = fallback[0].id;
      } else {
        r._speciesId = speciesResult[0].id;
      }

      // Look up or skip hunt unit
      const unitCode = normalizer.normalizeUnitCode(r.unitCode || "", "WY");
      const huntUnitResult = await sql`
        SELECT id FROM hunt_units WHERE state_id = ${stateId} AND unit_code = ${unitCode} LIMIT 1
      `;
      const huntUnitId = huntUnitResult[0]?.id || null;

      try {
        await sql`
          INSERT INTO draw_odds (
            state_id, species_id, hunt_unit_id, year,
            resident_type, weapon_type, choice_rank,
            total_applicants, total_tags,
            min_points_drawn, max_points_drawn, avg_points_drawn,
            draw_rate, source_id, raw_data, created_at
          ) VALUES (
            ${stateId}, ${r._speciesId}, ${huntUnitId}, ${r.year || 2025},
            ${r.residentType || 'nonresident'}, ${r.weaponType || null}, ${r.choiceRank || null},
            ${r.totalApplicants || null}, ${r.totalTags || null},
            ${r.minPointsDrawn || null}, ${r.maxPointsDrawn || null}, ${r.avgPointsDrawn || null},
            ${r.drawRate || null}, ${'9172f227-8de8-4c40-a33f-bc1886357dc4'}, ${JSON.stringify(r.rawRow || {})}::jsonb, NOW()
          )
          ON CONFLICT DO NOTHING
        `;
        inserted++;
      } catch (err: any) {
        if (!err.message?.includes("duplicate") && !err.message?.includes("conflict")) {
          console.log(`  ERR inserting unit ${unitCode}: ${err.message}`);
        }
      }
    }

    console.log(`  Inserted: ${inserted}`);
    totalInserted += inserted;
  }

  // Summary
  const drawCount = await sql`SELECT COUNT(*) as cnt FROM draw_odds WHERE state_id = ${stateId}`;
  console.log(`\n=== TOTAL ===`);
  console.log(`Inserted this run: ${totalInserted}`);
  console.log(`WY draw_odds in DB: ${drawCount[0].cnt}`);

  await sql.end();
}

main().catch(console.error);
