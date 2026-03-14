import { BaseParser } from "../src/services/ingestion/parsers/base-parser";
import type { ParserName, ParserConfig, ParsedResult } from "../src/services/ingestion/types";

// Concrete test class to access extractTable
class TestParser extends BaseParser {
  readonly name: ParserName = "season_dates";
  async parse(raw: string, config: ParserConfig): Promise<ParsedResult> {
    return { records: [], metadata: { parser: this.name, rowCount: 0, columnCount: 0, parsedAt: "" }, qualityScore: 0, warnings: [] };
  }
}

async function main() {
  const res = await fetch("https://wgfd.wyo.gov/licenses-applications/application-dates-deadlines");
  const html = await res.text();
  console.log("Fetched " + html.length + " bytes");

  const parser = new TestParser();
  const table = parser.extractTable(html);
  console.log("\nExtracted rows: " + table.length);
  for (const row of table) {
    console.log("  [" + row.join(" | ") + "]");
  }

  // Also check what headers the season parser is looking for
  console.log("\n=== Expected Column Mappings ===");
  const expectedMap: Record<string, string> = {
    season_name: "season",
    unit: "unit",
    species: "species",
    weapon_type: "weapon",
    start_date: "start",
    end_date: "end",
    tag_type: "tag_type",
    quota: "quota",
    year: "year",
  };
  for (const [field, search] of Object.entries(expectedMap)) {
    console.log("  " + field + " → looks for header containing '" + search + "'");
  }

  if (table.length > 0) {
    console.log("\n=== Actual Headers ===");
    const headers = table[0];
    for (let i = 0; i < headers.length; i++) {
      console.log("  col " + i + ": '" + headers[i] + "'");
    }
  }
}

main().catch(console.error);
