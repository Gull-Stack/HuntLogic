/**
 * Multi-year WGFD draw odds seeder. Companion to seed-wgfd-draw-odds.ts which
 * is hardcoded to current year. This one accepts a year parameter and a URL
 * manifest so historical PDFs can be ingested as their URLs are discovered.
 *
 * The forecast point-creep regression at src/services/intelligence/forecast-engine.ts
 * needs ≥3 years of (state, unit, species) data per row to produce a usable
 * slope. Today (2026-05-07) draw_odds has 2025 only; this script is the
 * vehicle for backfilling 2020-2024.
 *
 * URL discovery is manual — WGFD media IDs differ per year and cannot be
 * predicted. Find historical IDs by visiting wgfd.wyo.gov/Hunting/Apply-to-Hunt
 * and walking the "Drawing Statistics" archive links.
 *
 * Run:
 *   DATABASE_URL="..." YEAR=2024 npx tsx scripts/seed-wgfd-multiyear.ts
 *
 * Then add the discovered URLs into HISTORICAL_MANIFEST below.
 */

import postgres from "postgres";
import { PDFParse } from "pdf-parse";
import { DrawOddsTableParser } from "../src/services/ingestion/parsers/draw-odds-parser";
import { StateNormalizer } from "../src/services/ingestion/normalizers/state-normalizer";

interface YearManifest {
  year: number;
  pdfs: { url: string; species: string; label: string }[];
}

// =============================================================================
// HISTORICAL MANIFEST — fill in as URLs are discovered
// =============================================================================
// Each entry is one full year of WGFD nonresident-random draw stats PDFs.
// Existing 2025 manifest lives in seed-wgfd-draw-odds.ts; mirror that shape.
// To find historical URLs:
//   1. Visit https://wgfd.wyo.gov/Hunting/Apply-to-Hunt
//   2. Click "Drawing Statistics" → choose year
//   3. For each big-game species (Elk, Mule Deer, Pronghorn, Bighorn, Moose),
//      grab the NR Random PDF url. Format is wgfd.wyo.gov/media/<id>/download
//   4. Add to the manifest below with the correct year tag.
// =============================================================================
const HISTORICAL_MANIFEST: YearManifest[] = [
  // Example structure — populate with real URLs:
  // {
  //   year: 2024,
  //   pdfs: [
  //     { url: "https://wgfd.wyo.gov/media/<id>/download?inline", species: "elk", label: "2024 NR Elk Random" },
  //     { url: "https://wgfd.wyo.gov/media/<id>/download?inline", species: "mule_deer", label: "2024 NR Deer Random" },
  //     { url: "https://wgfd.wyo.gov/media/<id>/download?inline", species: "pronghorn", label: "2024 NR Antelope Random" },
  //     { url: "https://wgfd.wyo.gov/media/<id>/download?inline", species: "bighorn_sheep", label: "2024 NR Bighorn Random" },
  //     { url: "https://wgfd.wyo.gov/media/<id>/download?inline", species: "moose", label: "2024 NR Moose Random" },
  //   ],
  // },
];

const REQUESTED_YEAR = process.env.YEAR ? parseInt(process.env.YEAR, 10) : null;

async function main() {
  const sql = postgres(process.env.DATABASE_URL || "");
  const normalizer = new StateNormalizer();
  const drawParser = new DrawOddsTableParser();

  const stateRow = await sql`SELECT id FROM states WHERE code = 'WY' LIMIT 1`;
  const stateId = stateRow[0]?.id;
  if (!stateId) {
    console.log("WY not found in states table — aborting.");
    await sql.end();
    return;
  }

  const manifestsToProcess = REQUESTED_YEAR
    ? HISTORICAL_MANIFEST.filter((m) => m.year === REQUESTED_YEAR)
    : HISTORICAL_MANIFEST;

  if (manifestsToProcess.length === 0) {
    console.log(
      REQUESTED_YEAR
        ? `No manifest entry for YEAR=${REQUESTED_YEAR}. Add URLs to HISTORICAL_MANIFEST in this file.`
        : "HISTORICAL_MANIFEST is empty. See header comment for URL discovery steps.",
    );
    await sql.end();
    return;
  }

  let totalInserted = 0;

  for (const manifest of manifestsToProcess) {
    console.log(`\n=== YEAR ${manifest.year} ===`);

    for (const pdf of manifest.pdfs) {
      console.log(`\n--- ${pdf.label} ---`);

      const res = await fetch(pdf.url, {
        headers: { "User-Agent": "Mozilla/5.0 HuntLogic/1.0" },
        redirect: "follow",
      });
      if (!res.ok) {
        console.log(`  SKIP: HTTP ${res.status}`);
        continue;
      }

      const buffer = await res.arrayBuffer();
      const pdfParser = new PDFParse({ data: Buffer.from(buffer) });
      const textResult = await pdfParser.getText();

      const result = await drawParser.parse(textResult.text, {
        state_code: "WY",
        species_slug: pdf.species,
        year: manifest.year,
        column_mappings: {
          unit: 0,
          weapon_type: 1,
          species: 2,
          total_tags: 3,
          total_applicants: 4,
        },
      });

      console.log(
        `  Parsed ${result.records.length} records (quality: ${result.qualityScore})`,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const normalized = normalizer.normalizeDrawOdds(result.records as any[], "WY", "wgfd-pdf-multiyear");

      let inserted = 0;
      for (const rec of normalized.records) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const r = rec as any;

        const speciesSlug = normalizer.normalizeSpecies(r.species || pdf.species);
        const speciesResult = await sql`SELECT id FROM species WHERE slug = ${speciesSlug} LIMIT 1`;
        if (speciesResult.length === 0) {
          const fallback = await sql`SELECT id FROM species WHERE slug = ${pdf.species} LIMIT 1`;
          if (fallback.length === 0) continue;
          r._speciesId = fallback[0].id;
        } else {
          r._speciesId = speciesResult[0].id;
        }

        const unitCode = normalizer.normalizeUnitCode(r.unitCode || "", "WY");
        const huntUnitResult = await sql`
          SELECT id FROM hunt_units
          WHERE state_id = ${stateId} AND unit_code = ${unitCode}
          LIMIT 1
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
              ${stateId}, ${r._speciesId}, ${huntUnitId}, ${manifest.year},
              ${r.residentType || "nonresident"}, ${r.weaponType || "any"}, ${r.choiceRank || 1},
              ${r.totalApplicants || 0}, ${r.totalTags || 0},
              ${r.minPointsDrawn ?? null}, ${r.maxPointsDrawn ?? null}, ${r.avgPointsDrawn ?? null},
              ${r.drawRate ?? null}, ${"wgfd-pdf-multiyear"}, ${JSON.stringify(r)}, NOW()
            )
            ON CONFLICT (state_id, species_id, hunt_unit_id, year, resident_type, weapon_type, choice_rank)
            DO UPDATE SET
              total_applicants = EXCLUDED.total_applicants,
              total_tags = EXCLUDED.total_tags,
              min_points_drawn = EXCLUDED.min_points_drawn,
              max_points_drawn = EXCLUDED.max_points_drawn,
              avg_points_drawn = EXCLUDED.avg_points_drawn,
              draw_rate = EXCLUDED.draw_rate,
              raw_data = EXCLUDED.raw_data
          `;
          inserted++;
        } catch (err) {
          console.error(
            `  Insert error for ${manifest.year} ${pdf.species} ${unitCode}:`,
            err instanceof Error ? err.message : err,
          );
        }
      }

      console.log(`  Inserted/updated ${inserted} draw_odds rows`);
      totalInserted += inserted;
    }
  }

  console.log(`\n=== TOTAL: ${totalInserted} rows ===`);
  await sql.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
