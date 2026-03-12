// =============================================================================
// HuntLogic — Draw Odds Parser
// =============================================================================
// Parses draw odds tables from various formats (HTML tables, CSV).
// Config-driven: column mappings come from parser config — different states
// use different column layouts but all map to our canonical schema.
// =============================================================================

import { BaseParser } from "./base-parser";
import type {
  ParserName,
  ParserConfig,
  ParsedResult,
  ParsedDrawOdds,
} from "../types";

// Default column mappings (can be overridden per-source in parser config)
const DEFAULT_COLUMN_MAP: Record<string, string> = {
  unit: "unit",
  species: "species",
  resident_type: "resident_type",
  weapon_type: "weapon_type",
  choice_rank: "choice",
  total_applicants: "applicants",
  total_tags: "tags",
  min_points_drawn: "min_points",
  max_points_drawn: "max_points",
  avg_points_drawn: "avg_points",
  draw_rate: "draw_rate",
  year: "year",
};

export class DrawOddsTableParser extends BaseParser {
  readonly name: ParserName = "draw_odds_table";

  async parse(
    rawContent: string,
    config: ParserConfig
  ): Promise<ParsedResult> {
    console.log("[ingestion:parser:draw_odds_table] Parsing draw odds table");

    const columnMap = { ...DEFAULT_COLUMN_MAP, ...(config.column_mappings || {}) };
    const tableData = this.extractTable(rawContent, config.table_selector);

    if (tableData.length < 2) {
      return {
        records: [],
        metadata: {
          parser: this.name,
          rowCount: 0,
          columnCount: 0,
          stateCode: config.state_code,
          speciesSlug: config.species_slug,
          year: config.year,
          parsedAt: new Date().toISOString(),
        },
        qualityScore: 0,
        warnings: ["No data rows found in draw odds table"],
      };
    }

    // Determine header row and data start
    const headerRowIdx = config.header_row ?? 0;
    const dataStartIdx = config.data_start_row ?? headerRowIdx + 1;
    const headerRow = tableData[headerRowIdx].map((h) =>
      h.toLowerCase().trim()
    );

    // Build column index map: our field name → column index
    const colIndex = this.buildColumnIndex(headerRow, columnMap);

    // Parse data rows
    const records: ParsedDrawOdds[] = [];
    const warnings: string[] = [];

    for (let i = dataStartIdx; i < tableData.length; i++) {
      if (config.skip_rows?.includes(i)) continue;

      const row = tableData[i];
      if (row.length === 0 || row.every((c) => c.trim() === "")) continue;

      try {
        const record = this.parseRow(row, colIndex, config);
        if (record) {
          // Validate the record
          const rowWarnings = this.validateRecord(record, i);
          if (rowWarnings.length > 0) {
            warnings.push(...rowWarnings);
          }
          records.push(record);
        }
      } catch (error) {
        warnings.push(
          `Row ${i}: Parse error — ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    const qualityScore = this.calculateQuality(records, tableData.length - dataStartIdx);

    console.log(
      `[ingestion:parser:draw_odds_table] Parsed ${records.length} records (${warnings.length} warnings, quality: ${qualityScore.toFixed(2)})`
    );

    return {
      records: records as unknown as Record<string, unknown>[],
      metadata: {
        parser: this.name,
        rowCount: records.length,
        columnCount: headerRow.length,
        stateCode: config.state_code,
        speciesSlug: config.species_slug,
        year: config.year,
        parsedAt: new Date().toISOString(),
      },
      qualityScore,
      warnings,
    };
  }

  // -------------------------------------------------------------------------
  // Build column index from header row
  // -------------------------------------------------------------------------

  private buildColumnIndex(
    headerRow: string[],
    columnMap: Record<string, string | number>
  ): Map<string, number> {
    const index = new Map<string, number>();

    for (const [ourField, sourceField] of Object.entries(columnMap)) {
      if (typeof sourceField === "number") {
        // Direct column index
        index.set(ourField, sourceField);
      } else {
        // Find by header name (fuzzy match)
        const sourceFieldLower = sourceField.toLowerCase();
        const colIdx = headerRow.findIndex(
          (h) =>
            h === sourceFieldLower ||
            h.includes(sourceFieldLower) ||
            sourceFieldLower.includes(h)
        );
        if (colIdx !== -1) {
          index.set(ourField, colIdx);
        }
      }
    }

    return index;
  }

  // -------------------------------------------------------------------------
  // Parse a single row into a DrawOdds record
  // -------------------------------------------------------------------------

  private parseRow(
    row: string[],
    colIndex: Map<string, number>,
    config: ParserConfig
  ): ParsedDrawOdds | null {
    const get = (field: string): string | undefined => {
      const idx = colIndex.get(field);
      return idx !== undefined && idx < row.length ? row[idx] : undefined;
    };

    const unitCode = get("unit");
    if (!unitCode || unitCode.trim() === "") return null;

    return {
      year: this.parseInteger(get("year")) ?? config.year ?? new Date().getFullYear(),
      unitCode: this.clean(unitCode),
      species: get("species") ?? config.species_slug ?? "unknown",
      residentType: this.normalizeResidentType(get("resident_type") ?? "resident"),
      weaponType: get("weapon_type") || undefined,
      choiceRank: this.parseInteger(get("choice_rank")),
      totalApplicants: this.parseInteger(get("total_applicants")),
      totalTags: this.parseInteger(get("total_tags")),
      minPointsDrawn: this.parseInteger(get("min_points_drawn")),
      maxPointsDrawn: this.parseInteger(get("max_points_drawn")),
      avgPointsDrawn: this.parseNumber(get("avg_points_drawn")),
      drawRate: this.parseRate(get("draw_rate")),
      rawRow: Object.fromEntries(row.map((cell, i) => [i.toString(), cell])),
    };
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  private validateRecord(record: ParsedDrawOdds, rowIndex: number): string[] {
    const warnings: string[] = [];

    if (record.drawRate !== undefined && (record.drawRate < 0 || record.drawRate > 1)) {
      warnings.push(
        `Row ${rowIndex}: Draw rate ${record.drawRate} outside valid range [0, 1]`
      );
    }

    if (
      record.totalApplicants !== undefined &&
      record.totalTags !== undefined &&
      record.totalTags > record.totalApplicants
    ) {
      warnings.push(
        `Row ${rowIndex}: Tags (${record.totalTags}) exceed applicants (${record.totalApplicants})`
      );
    }

    if (
      record.minPointsDrawn !== undefined &&
      record.maxPointsDrawn !== undefined &&
      record.minPointsDrawn > record.maxPointsDrawn
    ) {
      warnings.push(
        `Row ${rowIndex}: Min points (${record.minPointsDrawn}) > max points (${record.maxPointsDrawn})`
      );
    }

    if (record.year < 1990 || record.year > new Date().getFullYear() + 1) {
      warnings.push(`Row ${rowIndex}: Year ${record.year} seems unlikely`);
    }

    return warnings;
  }

  // -------------------------------------------------------------------------
  // Quality scoring
  // -------------------------------------------------------------------------

  private calculateQuality(records: ParsedDrawOdds[], expectedRows: number): number {
    if (records.length === 0) return 0;

    // Completeness: how many key fields are populated
    let totalFields = 0;
    let populatedFields = 0;
    const keyFields: (keyof ParsedDrawOdds)[] = [
      "unitCode",
      "species",
      "residentType",
      "totalApplicants",
      "totalTags",
      "drawRate",
    ];

    for (const record of records) {
      for (const field of keyFields) {
        totalFields++;
        if (record[field] !== undefined && record[field] !== null) {
          populatedFields++;
        }
      }
    }

    const completeness = totalFields > 0 ? populatedFields / totalFields : 0;
    const parseRate = expectedRows > 0 ? records.length / expectedRows : 0;

    return Math.round((completeness * 0.6 + parseRate * 0.4) * 100) / 100;
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private normalizeResidentType(value: string): string {
    const v = value.toLowerCase().trim();
    if (v.includes("non") || v.includes("nr") || v === "n") return "nonresident";
    if (v.includes("res") || v.includes("r") || v === "r") return "resident";
    return v;
  }
}

// =============================================================================
// Draw Odds CSV Parser (variant for CSV-format draw data)
// =============================================================================

export class DrawOddsCsvParser extends BaseParser {
  readonly name: ParserName = "draw_odds_csv";

  async parse(
    rawContent: string,
    config: ParserConfig
  ): Promise<ParsedResult> {
    console.log("[ingestion:parser:draw_odds_csv] Parsing draw odds CSV");

    const delimiter = config.delimiter || ",";
    const rows = this.parseCsv(rawContent, delimiter);

    if (rows.length < 2) {
      return {
        records: [],
        metadata: {
          parser: this.name,
          rowCount: 0,
          columnCount: 0,
          stateCode: config.state_code,
          parsedAt: new Date().toISOString(),
        },
        qualityScore: 0,
        warnings: ["No data rows found in CSV"],
      };
    }

    // Delegate to the table parser logic (same structure after CSV → 2D array)
    const tableParser = new DrawOddsTableParser();
    // Re-compose as HTML table for extraction — or just build directly
    // Since we already have the 2D array, we reformat as quasi-HTML for reuse
    const htmlTable = this.rowsToHtmlTable(rows);
    return tableParser.parse(htmlTable, config);
  }

  private rowsToHtmlTable(rows: string[][]): string {
    const headerHtml = rows[0]
      .map((h) => `<th>${h}</th>`)
      .join("");
    const bodyHtml = rows
      .slice(1)
      .map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("\n");
    return `<table><tr>${headerHtml}</tr>\n${bodyHtml}</table>`;
  }
}
