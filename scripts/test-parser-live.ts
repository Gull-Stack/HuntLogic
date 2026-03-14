import { SeasonParser } from "../src/services/ingestion/parsers/season-parser";

async function main() {
  // Fetch real WGFD page
  const res = await fetch("https://wgfd.wyo.gov/licenses-applications/application-dates-deadlines");
  if (!res.ok) {
    console.error("Fetch failed:", res.status);
    return;
  }
  const html = await res.text();
  console.log("Fetched " + html.length + " bytes from WGFD");

  // Run through season parser
  const parser = new SeasonParser();
  const result = await parser.parse(html, {
    state_code: "WY",
    year: 2026,
  });

  console.log("\n=== Parse Results ===");
  console.log("Records: " + result.records.length);
  console.log("Quality: " + result.qualityScore);
  console.log("Warnings: " + result.warnings.length);

  if (result.warnings.length > 0) {
    console.log("\nWarnings:");
    for (const w of result.warnings.slice(0, 5)) console.log("  " + w);
  }

  console.log("\nParsed Records:");
  for (const r of result.records) {
    const rec = r as Record<string, unknown>;
    console.log("  " + (rec.seasonName || rec.species || "?") + " | start=" + (rec.startDate || "?") + " end=" + (rec.endDate || "?") + " year=" + rec.year);
  }
}

main().catch(console.error);
