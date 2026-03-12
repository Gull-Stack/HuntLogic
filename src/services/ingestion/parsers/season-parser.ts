// =============================================================================
// HuntLogic — Season/Regulation Parser
// =============================================================================
// Parses season dates, regulations, quotas from state agency pages.
// Handles state-specific formatting differences via config-driven mappings.
// =============================================================================

import { BaseParser } from "./base-parser";
import type {
  ParserName,
  ParserConfig,
  ParsedResult,
  ParsedSeason,
} from "../types";

const DEFAULT_COLUMN_MAP: Record<string, string> = {
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

export class SeasonParser extends BaseParser {
  readonly name: ParserName = "season_dates";

  async parse(
    rawContent: string,
    config: ParserConfig
  ): Promise<ParsedResult> {
    console.log("[ingestion:parser:season_dates] Parsing season data");

    const columnMap = { ...DEFAULT_COLUMN_MAP, ...(config.column_mappings || {}) };
    const isHtmlTable = /<table/i.test(rawContent);
    const isJson = rawContent.trim().startsWith("[") || rawContent.trim().startsWith("{");

    let records: ParsedSeason[];
    let warnings: string[];
    let columnCount: number;

    if (isJson) {
      const result = this.parseJsonSeasons(rawContent, columnMap, config);
      records = result.records;
      warnings = result.warnings;
      columnCount = result.columnCount;
    } else if (isHtmlTable) {
      const result = this.parseTableSeasons(rawContent, columnMap, config);
      records = result.records;
      warnings = result.warnings;
      columnCount = result.columnCount;
    } else {
      const result = this.parseTextSeasons(rawContent, config);
      records = result.records;
      warnings = result.warnings;
      columnCount = 0;
    }

    const qualityScore = this.calculateQuality(records);

    console.log(
      `[ingestion:parser:season_dates] Parsed ${records.length} season records`
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
  // Parse HTML table seasons
  // -------------------------------------------------------------------------

  private parseTableSeasons(
    html: string,
    columnMap: Record<string, string>,
    config: ParserConfig
  ): { records: ParsedSeason[]; warnings: string[]; columnCount: number } {
    const tableData = this.extractTable(html, config.table_selector);
    const records: ParsedSeason[] = [];
    const warnings: string[] = [];

    if (tableData.length < 2) {
      return { records, warnings: ["No data rows in season table"], columnCount: 0 };
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
  // Parse JSON seasons
  // -------------------------------------------------------------------------

  private parseJsonSeasons(
    json: string,
    columnMap: Record<string, string>,
    config: ParserConfig
  ): { records: ParsedSeason[]; warnings: string[]; columnCount: number } {
    const records: ParsedSeason[] = [];
    const warnings: string[] = [];

    try {
      const data = JSON.parse(json);
      const items = Array.isArray(data) ? data : data.data || data.results || [];

      for (const item of items) {
        const record: ParsedSeason = {
          year: parseInt(item[columnMap.year] || item.year) || config.year || new Date().getFullYear(),
          unitCode: item[columnMap.unit] || item.unit || item.unitCode || undefined,
          species: item[columnMap.species] || item.species || config.species_slug || "unknown",
          seasonName: item[columnMap.season_name] || item.season || item.seasonName || undefined,
          weaponType: item[columnMap.weapon_type] || item.weapon || item.weaponType || undefined,
          startDate: this.normalizeDate(item[columnMap.start_date] || item.start_date || item.startDate),
          endDate: this.normalizeDate(item[columnMap.end_date] || item.end_date || item.endDate),
          tagType: item[columnMap.tag_type] || item.tag_type || item.tagType || undefined,
          quota: this.parseInteger(String(item[columnMap.quota] ?? item.quota ?? "")),
          rawRow: item,
        };
        records.push(record);
      }
    } catch (error) {
      warnings.push(`JSON parse error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return { records, warnings, columnCount: Object.keys(columnMap).length };
  }

  // -------------------------------------------------------------------------
  // Parse text-based season info
  // -------------------------------------------------------------------------

  private parseTextSeasons(
    text: string,
    config: ParserConfig
  ): { records: ParsedSeason[]; warnings: string[] } {
    const records: ParsedSeason[] = [];
    const warnings: string[] = ["Text-based season parsing — limited extraction"];

    // Common patterns: "Archery: Sep 1 - Sep 30" or "General Rifle Season: Oct 15 through Nov 15"
    const seasonPattern =
      /(?:(\w[\w\s]*?)(?:season)?)\s*[:—-]\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{1,2})\s*(?:[-–—]|through|to)\s*((?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{1,2})/gi;

    let match: RegExpExecArray | null;
    while ((match = seasonPattern.exec(text)) !== null) {
      const year = config.year ?? new Date().getFullYear();
      records.push({
        year,
        species: config.species_slug || "unknown",
        seasonName: this.clean(match[1]),
        startDate: this.normalizeDate(`${match[2]} ${year}`),
        endDate: this.normalizeDate(`${match[3]} ${year}`),
        rawRow: { raw_text: match[0] },
      });
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
  ): ParsedSeason | null {
    const get = (field: string): string | undefined => {
      const idx = colIndex.get(field);
      return idx !== undefined && idx < row.length ? row[idx] : undefined;
    };

    // At minimum we need either a season name or dates
    const seasonName = get("season_name");
    const startDate = get("start_date");
    if (!seasonName && !startDate) return null;

    return {
      year: this.parseInteger(get("year")) ?? config.year ?? new Date().getFullYear(),
      unitCode: get("unit") || undefined,
      species: get("species") ?? config.species_slug ?? "unknown",
      seasonName: seasonName ? this.clean(seasonName) : undefined,
      weaponType: get("weapon_type") || undefined,
      startDate: this.normalizeDate(startDate),
      endDate: this.normalizeDate(get("end_date")),
      tagType: get("tag_type") || undefined,
      quota: this.parseInteger(get("quota")),
      rawRow: Object.fromEntries(row.map((cell, i) => [i.toString(), cell])),
    };
  }

  // -------------------------------------------------------------------------
  // Date normalization
  // -------------------------------------------------------------------------

  private normalizeDate(dateStr: string | undefined | null): string | undefined {
    if (!dateStr || dateStr.trim() === "" || dateStr === "-") return undefined;

    const cleaned = dateStr.trim();

    // Already in YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) return cleaned;

    // Try to parse with Date
    const parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }

    // Common formats: "Sep 1, 2025" or "9/1/2025" or "September 1"
    // Return as-is if we can't parse (normalizer will handle it)
    return undefined;
  }

  // -------------------------------------------------------------------------
  // Validation
  // -------------------------------------------------------------------------

  private validateRecord(record: ParsedSeason, rowIndex: number): string[] {
    const warnings: string[] = [];

    if (record.startDate && record.endDate && record.startDate > record.endDate) {
      warnings.push(
        `Row ${rowIndex}: Start date (${record.startDate}) after end date (${record.endDate})`
      );
    }

    if (record.quota !== undefined && record.quota < 0) {
      warnings.push(`Row ${rowIndex}: Negative quota (${record.quota})`);
    }

    return warnings;
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

  private calculateQuality(records: ParsedSeason[]): number {
    if (records.length === 0) return 0;

    let totalFields = 0;
    let populated = 0;
    const keyFields: (keyof ParsedSeason)[] = [
      "species",
      "seasonName",
      "startDate",
      "endDate",
      "weaponType",
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

// =============================================================================
// Regulation Text Parser (for full regulation documents)
// =============================================================================

export class RegulationTextParser extends BaseParser {
  readonly name: ParserName = "regulation_text";

  async parse(
    rawContent: string,
    config: ParserConfig
  ): Promise<ParsedResult> {
    console.log("[ingestion:parser:regulation_text] Parsing regulation text");

    // For regulation text, we store it as a document for RAG rather than
    // extracting structured records. Strip HTML if present.
    const cleanText = rawContent.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const records = [
      {
        doc_type: "regulation",
        content: cleanText,
        state_code: config.state_code,
        species_slug: config.species_slug,
        year: config.year ?? new Date().getFullYear(),
        word_count: cleanText.split(/\s+/).length,
      },
    ];

    return {
      records: records as unknown as Record<string, unknown>[],
      metadata: {
        parser: this.name,
        rowCount: 1,
        columnCount: 0,
        stateCode: config.state_code,
        speciesSlug: config.species_slug,
        year: config.year,
        parsedAt: new Date().toISOString(),
      },
      qualityScore: cleanText.length > 100 ? 0.7 : 0.3,
      warnings:
        cleanText.length < 100
          ? ["Regulation text is unusually short"]
          : [],
    };
  }
}
