import { SeasonParser } from "../src/services/ingestion/parsers/season-parser";

async function main() {
  const res = await fetch("https://wgfd.wyo.gov/licenses-applications/application-dates-deadlines");
  const html = await res.text();
  console.log("Fetched " + html.length + " bytes");

  const parser = new SeasonParser();
  const result = await parser.parse(html, {
    state_code: "WY",
    year: 2026,
    column_mappings: {
      season_name: "license type",
      start_date: "open date",
      end_date: "close date",
    },
  });

  console.log("\n=== Parse Results ===");
  console.log("Records: " + result.records.length);
  console.log("Quality: " + result.qualityScore);
  console.log("Warnings: " + result.warnings.length);

  for (const r of result.records) {
    const rec = r as Record<string, unknown>;
    console.log("  " + rec.seasonName + " | open=" + rec.startDate + " close=" + rec.endDate + " year=" + rec.year + " species=" + rec.species);
  }
}

main().catch(console.error);
