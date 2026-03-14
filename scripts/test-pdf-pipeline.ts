import { PDFParse } from "pdf-parse";
import { DrawOddsTableParser } from "../src/services/ingestion/parsers/draw-odds-parser";

const WGFD_PDFS = [
  { url: "https://wgfd.wyo.gov/media/32449/download?inline", species: "elk", label: "NR Elk Random 2025" },
  { url: "https://wgfd.wyo.gov/media/32699/download?inline", species: "mule_deer", label: "NR Deer Random 2025" },
  { url: "https://wgfd.wyo.gov/media/32690/download?inline", species: "pronghorn", label: "NR Antelope Random 2025" },
  { url: "https://wgfd.wyo.gov/media/32421/download?inline", species: "bighorn_sheep", label: "NR Bighorn Random 2025" },
];

async function testPdf(pdf: typeof WGFD_PDFS[0]) {
  const res = await fetch(pdf.url, { headers: { "User-Agent": "Mozilla/5.0 HuntLogic/1.0" }, redirect: "follow" });
  if (!res.ok) { console.log(`  SKIP ${pdf.label}: HTTP ${res.status}`); return null; }

  const buffer = await res.arrayBuffer();
  const pdfParser = new PDFParse({ data: Buffer.from(buffer) });
  const textResult = await pdfParser.getText();

  const drawParser = new DrawOddsTableParser();
  const result = await drawParser.parse(textResult.text, {
    state_code: "WY",
    species_slug: pdf.species,
    year: 2025,
    column_mappings: {
      unit: 0,
      weapon_type: 1,
      species: 2,
      total_tags: 3,
      total_applicants: 4,
    },
  });

  console.log(`  ${pdf.label}: ${result.records.length} records, quality=${result.qualityScore}, warnings=${result.warnings.length}`);
  if (result.records.length > 0) {
    const first = result.records[0] as any;
    const last = result.records[result.records.length - 1] as any;
    console.log(`    First: Unit ${first.unitCode} | ${first.species} | tags=${first.totalTags} | applicants=${first.totalApplicants}`);
    console.log(`    Last:  Unit ${last.unitCode} | ${last.species} | tags=${last.totalTags} | applicants=${last.totalApplicants}`);
  }

  return result;
}

async function main() {
  console.log("=== WGFD Draw Odds PDF Pipeline Test ===\n");

  let totalRecords = 0;
  for (const pdf of WGFD_PDFS) {
    const result = await testPdf(pdf);
    if (result) totalRecords += result.records.length;
  }

  console.log(`\n=== TOTAL: ${totalRecords} draw odds records from ${WGFD_PDFS.length} PDFs ===`);
}

main().catch(console.error);
