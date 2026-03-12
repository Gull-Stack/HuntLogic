// =============================================================================
// HuntLogic — Harvest Report Parser
// =============================================================================
// Parses harvest statistics from state reports.
// Handles both table-based and narrative-style reports.
// Config-driven column mappings for cross-state compatibility.
// =============================================================================

import { BaseParser } from "./base-parser";
import type {
  ParserName,
  ParserConfig,
  ParsedResult,
  ParsedHarvestStats,
} from "../types";

const DEFAULT_COLUMN_MAP: Record<string, string> = {
  unit: "unit",
  species: "species",
  weapon_type: "weapon",
  total_hunters: "hunters",
  total_harvest: "harvest",
  success_rate: "success",
  avg_days_hunted: "days",
  year: "year",
};

export class HarvestReportParser extends BaseParser {
  readonly name: ParserName = "harvest_report";

  async parse(
    rawContent: string,
    config: ParserConfig
  ): Promise<ParsedResult> {
    console.log("[ingestion:parser:harvest_report] Parsing harvest report");

    const columnMap = { ...DEFAULT_COLUMN_MAP, ...(config.column_mappings || {}) };

    // Detect content type and parse accordingly
    const isHtmlTable = /<table/i.test(rawContent);
    const isJson = rawContent.trim().startsWith("[") || rawContent.trim().startsWith("{");

    let records: ParsedHarvestStats[];
    let warnings: string[];
    let columnCount: number;

    if (isJson) {
      const result = this.parseJsonReport(rawContent, columnMap, config);
      records = result.records;
      warnings = result.warnings;
      columnCount = result.columnCount;
    } else if (isHtmlTable) {
      const result = this.parseTableReport(rawContent, columnMap, config);
      records = result.records;
      warnings = result.warnings;
      columnCount = result.columnCount;
    } else {
      // Attempt narrative parsing
      const result = this.parseNarrativeReport(rawContent, config);
      records = result.records;
      warnings = result.warnings;
      columnCount = 0;
    }

    const qualityScore = this.calculateQuality(records);

    console.log(
      `[ingestion:parser:harvest_report] Parsed ${records.length} records (${warnings.length} warnings)`
    );

    return {
      records: records as unknown as Record<string, unknown>[],
      metadata: {
        parser: this.name,
        rowCount: records.length,
        columnCount,
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
  // Parse HTML table report
  // -------------------------------------------------------------------------

  private parseTableReport(
    html: string,
    columnMap: Record<string, string>,
    config: ParserConfig
  ): { records: ParsedHarvestStats[]; warnings: string[]; columnCount: number } {
    const tableData = this.extractTable(html, config.table_selector);
    const records: ParsedHarvestStats[] = [];
    const warnings: string[] = [];

    if (tableData.length < 2) {
      return { records, warnings: ["No data rows in harvest table"], columnCount: 0 };
    }

    const headerRowIdx = config.header_row ?? 0;
    const dataStartIdx = config.data_start_row ?? headerRowIdx + 1;
    const headerRow = tableData[headerRowIdx].map((h) => h.toLowerCase().trim());

    const colIndex = this.buildColumnIndex(headerRow, columnMap);

    for (let i = dataStartIdx; i < tableData.length; i++) {
      if (config.skip_rows?.includes(i)) continue;
      const row = tableData[i];
      if (row.length === 0 || row.every((c) => c.trim() === "")) continue;

      try {
        const record = this.parseRow(row, colIndex, config);
        if (record) {
          const rowWarnings = this.validateRecord(record, i);
          warnings.push(...rowWarnings);
          records.push(record);
        }
      } catch (error) {
        warnings.push(`Row ${i}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return { records, warnings, columnCount: headerRow.length };
  }

  // -------------------------------------------------------------------------
  // Parse JSON report
  // -------------------------------------------------------------------------

  private parseJsonReport(
    json: string,
    columnMap: Record<string, string>,
    config: ParserConfig
  ): { records: ParsedHarvestStats[]; warnings: string[]; columnCount: number } {
    const records: ParsedHarvestStats[] = [];
    const warnings: string[] = [];

    try {
      const data = JSON.parse(json);
      const items = Array.isArray(data) ? data : data.data || data.results || [];

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        try {
          const record: ParsedHarvestStats = {
            year:
              parseInt(item[columnMap.year] || item.year) ||
              config.year ||
              new Date().getFullYear(),
            unitCode: String(item[columnMap.unit] || item.unit || item.unitCode || ""),
            species: item[columnMap.species] || item.species || config.species_slug || "unknown",
            weaponType: item[columnMap.weapon_type] || item.weapon || item.weaponType || undefined,
            totalHunters: this.parseInteger(String(item[columnMap.total_hunters] ?? item.hunters ?? "")),
            totalHarvest: this.parseInteger(String(item[columnMap.total_harvest] ?? item.harvest ?? "")),
            successRate: this.parseRate(String(item[columnMap.success_rate] ?? item.success ?? "")),
            avgDaysHunted: this.parseNumber(String(item[columnMap.avg_days_hunted] ?? item.days ?? "")),
            trophyMetrics: item.trophy_metrics || item.trophyMetrics || undefined,
            rawRow: item,
          };
          if (record.unitCode) records.push(record);
        } catch (error) {
          warnings.push(`Item ${i}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    } catch (error) {
      warnings.push(`JSON parse error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { records, warnings, columnCount: Object.keys(columnMap).length };
  }

  // -------------------------------------------------------------------------
  // Parse narrative (text) report — extract what we can
  // -------------------------------------------------------------------------

  private parseNarrativeReport(
    text: string,
    config: ParserConfig
  ): { records: ParsedHarvestStats[]; warnings: string[] } {
    const records: ParsedHarvestStats[] = [];
    const warnings: string[] = [
      "Narrative report detected — limited data extraction",
    ];

    // Try to extract key metrics using common patterns
    // e.g., "Unit 10: 245 hunters, 89 harvested, 36% success rate"
    const unitPattern =
      /(?:unit|area|zone)\s*[#:]?\s*(\w+)[^.]*?(\d+)\s*hunters?[^.]*?(\d+)\s*harvest/gi;
    let match: RegExpExecArray | null;

    while ((match = unitPattern.exec(text)) !== null) {
      const hunters = this.parseInteger(match[2]);
      const harvest = this.parseInteger(match[3]);

      records.push({
        year: config.year ?? new Date().getFullYear(),
        unitCode: match[1],
        species: config.species_slug || "unknown",
        totalHunters: hunters,
        totalHarvest: harvest,
        successRate:
          hunters && harvest ? Math.round((harvest / hunters) * 100) / 100 : undefined,
        rawRow: { raw_text: match[0] },
      });
    }

    if (records.length === 0) {
      warnings.push(
        "Could not extract structured data from narrative report"
      );
    }

    return { records, warnings };
  }

  // -------------------------------------------------------------------------
  // Row parsing
  // -------------------------------------------------------------------------

  private parseRow(
    row: string[],
    colIndex: Map<string, number>,
    config: ParserConfig
  ): ParsedHarvestStats | null {
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
      weaponType: get("weapon_type") || undefined,
      totalHunters: this.parseInteger(get("total_hunters")),
      totalHarvest: this.parseInteger(get("total_harvest")),
      successRate: this.parseRate(get("success_rate")),
      avgDaysHunted: this.parseNumber(get("avg_days_hunted")),
      trophyMetrics: undefined,
      rawRow: Object.fromEntries(row.map((cell, i) => [i.toString(), cell])),
    };
  }

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  private buildColumnIndex(
    headerRow: string[],
    columnMap: Record<string, string | number>
  ): Map<string, number> {
    const index = new Map<string, number>();
    for (const [ourField, sourceField] of Object.entries(columnMap)) {
      if (typeof sourceField === "number") {
        index.set(ourField, sourceField);
      } else {
        const lower = sourceField.toLowerCase();
        const colIdx = headerRow.findIndex(
          (h) => h === lower || h.includes(lower) || lower.includes(h)
        );
        if (colIdx !== -1) index.set(ourField, colIdx);
      }
    }
    return index;
  }

  private validateRecord(
    record: ParsedHarvestStats,
    rowIndex: number
  ): string[] {
    const warnings: string[] = [];

    if (
      record.successRate !== undefined &&
      (record.successRate < 0 || record.successRate > 1)
    ) {
      warnings.push(
        `Row ${rowIndex}: Success rate ${record.successRate} outside [0, 1]`
      );
    }

    if (
      record.totalHunters !== undefined &&
      record.totalHarvest !== undefined &&
      record.totalHarvest > record.totalHunters * 3
    ) {
      warnings.push(
        `Row ${rowIndex}: Harvest (${record.totalHarvest}) seems high relative to hunters (${record.totalHunters})`
      );
    }

    return warnings;
  }

  private calculateQuality(records: ParsedHarvestStats[]): number {
    if (records.length === 0) return 0;

    let totalFields = 0;
    let populated = 0;
    const keyFields: (keyof ParsedHarvestStats)[] = [
      "unitCode",
      "species",
      "totalHunters",
      "totalHarvest",
      "successRate",
    ];

    for (const record of records) {
      for (const field of keyFields) {
        totalFields++;
        if (record[field] !== undefined && record[field] !== null) populated++;
      }
    }

    return totalFields > 0
      ? Math.round((populated / totalFields) * 100) / 100
      : 0;
  }
}
