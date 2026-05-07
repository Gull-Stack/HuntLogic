// =============================================================================
// HuntLogic — Base Parser (abstract)
// =============================================================================
// All parsers extend this class. Parser selection is config-driven from
// the endpoint's `parser` field in scraper_config JSONB.
// Uses cheerio for robust DOM-based HTML extraction.
// =============================================================================

import * as cheerio from "cheerio";
import type { ParserName, ParserConfig, ParsedResult } from "../types";

export abstract class BaseParser {
  abstract readonly name: ParserName;

  // -------------------------------------------------------------------------
  // Abstract: subclasses implement the actual parse logic
  // -------------------------------------------------------------------------

  abstract parse(
    rawContent: string,
    config: ParserConfig
  ): Promise<ParsedResult>;

  // -------------------------------------------------------------------------
  // Common text cleaning
  // -------------------------------------------------------------------------

  clean(text: string): string {
    return text
      .replace(/\r\n/g, "\n") // normalize line endings
      .replace(/\t/g, " ") // tabs to spaces
      .replace(/\u00a0/g, " ") // non-breaking spaces
      .replace(/\u200b/g, "") // zero-width spaces
      .replace(/\s+/g, " ") // collapse multiple spaces
      .trim();
  }

  protected cleanCell(value: string): string {
    return value
      .replace(/\u00a0/g, " ") // non-breaking spaces
      .replace(/\u200b/g, "") // zero-width spaces
      .replace(/\s+/g, " ")
      .replace(/^["']+|["']+$/g, "") // strip wrapping quotes
      .trim();
  }

  // -------------------------------------------------------------------------
  // HTML table extraction (cheerio-based)
  // -------------------------------------------------------------------------

  /**
   * Extract a table from HTML as a 2D string array using cheerio.
   * Supports full CSS selectors, handles <th> data cells, colspan/rowspan,
   * and nested elements that regex-based parsing misses.
   */
  extractTable(html: string, selector?: string): string[][] {
    const $ = cheerio.load(html);
    const rows: string[][] = [];

    // Find the target table
    const tableSelector = selector || "table";
    const $table = $(tableSelector).first();

    if ($table.length === 0) {
      // Fallback: if no table found with selector, try first table on page
      const $fallback = $("table").first();
      if ($fallback.length === 0) return rows;
      return this.extractTableFromElement($, $fallback);
    }

    return this.extractTableFromElement($, $table);
  }

  /**
   * Extract ALL tables from HTML. Useful when data spans multiple tables
   * (e.g., one per species or region).
   */
  extractAllTables(html: string, selector?: string): string[][][] {
    const $ = cheerio.load(html);
    const tables: string[][][] = [];
    const tableSelector = selector || "table";

    $(tableSelector).each((_, tableEl) => {
      const tableData = this.extractTableFromElement($, $(tableEl));
      if (tableData.length > 0) {
        tables.push(tableData);
      }
    });

    return tables;
  }

  private extractTableFromElement(
    $: cheerio.CheerioAPI,
    // cheerio's Element type isn't directly exported in current versions —
    // accept any cheerio selection wrapper since the only operations we use
    // are Cheerio.find/text which exist on all node types.
    $table: cheerio.Cheerio<any>
  ): string[][] {
    const rows: string[][] = [];

    $table.find("tr").each((_, tr) => {
      const cells: string[] = [];

      $(tr)
        .find("td, th")
        .each((_, cell) => {
          const text = $(cell).text();
          cells.push(this.cleanCell(text));
        });

      if (cells.length > 0) {
        rows.push(cells);
      }
    });

    return rows;
  }

  // -------------------------------------------------------------------------
  // Cheerio helpers for subclasses
  // -------------------------------------------------------------------------

  /**
   * Load HTML and return a cheerio instance for direct DOM querying.
   */
  protected loadHtml(html: string): cheerio.CheerioAPI {
    return cheerio.load(html);
  }

  /**
   * Extract all links matching a pattern from HTML.
   * Useful for finding PDF download links on state agency pages.
   */
  protected extractLinks(
    html: string,
    pattern?: RegExp
  ): Array<{ text: string; href: string }> {
    const $ = cheerio.load(html);
    const links: Array<{ text: string; href: string }> = [];

    $("a[href]").each((_, el) => {
      const href = $(el).attr("href") || "";
      const text = this.cleanCell($(el).text());

      if (!pattern || pattern.test(href) || pattern.test(text)) {
        links.push({ text, href });
      }
    });

    return links;
  }

  // -------------------------------------------------------------------------
  // PDF text-table extraction (for space-aligned tabular text from pdf-parse)
  // -------------------------------------------------------------------------

  /**
   * Parse space-aligned tabular text (from PDF extraction) into a 2D array.
   * Handles repeated page headers, separator rows, and multi-row headers
   * common in state agency PDF reports.
   */
  protected extractTextTable(text: string): string[][] {
    const lines = text
      .split("\n")
      .map((l) => l.replace(/\r$/, ""))
      .filter((l) => l.trim().length > 0);

    if (lines.length < 2) return [];

    // Split all lines on 2+ spaces or tabs
    const allRows = lines.map((line) =>
      line
        .split(/\s{2,}/)
        .map((cell) => cell.trim())
        .filter((cell) => cell.length > 0)
    );

    // Determine dominant column count
    const colCounts = allRows.map((r) => r.length);
    const mostCommon = this.mode(colCounts);
    if (mostCommon < 3) return allRows.filter((r) => r.length >= 2);

    // Filter to rows with consistent column count
    const consistent = allRows.filter(
      (r) => Math.abs(r.length - mostCommon) <= 1
    );

    if (consistent.length < 2) return [];

    // Remove separator rows (all dashes/underscores)
    const noSeparators = consistent.filter(
      (r) => !r.every((c) => /^[-_=.]+$/.test(c))
    );

    // Collect all unique header-like rows (no digits in any cell) for dedup
    const headerKeys = new Set<string>();
    for (const row of noSeparators) {
      if (row.every((c) => !/\d/.test(c))) {
        headerKeys.add(row.join("|"));
      }
    }

    // Keep first occurrence of each header pattern, remove subsequent duplicates
    const seenHeaders = new Set<string>();
    const deduped: string[][] = [];
    for (const row of noSeparators) {
      const key = row.join("|");
      if (headerKeys.has(key)) {
        if (!seenHeaders.has(key)) {
          seenHeaders.add(key);
          deduped.push(row);
        }
        // Skip duplicate header rows
      } else {
        deduped.push(row);
      }
    }

    return deduped.map((r) => r.map((c) => this.cleanCell(c)));
  }

  /** Find the most frequent value in a number array. */
  private mode(arr: number[]): number {
    const freq = new Map<number, number>();
    for (const v of arr) freq.set(v, (freq.get(v) || 0) + 1);
    let maxCount = 0;
    let modeVal = 0;
    for (const [val, count] of freq) {
      if (count > maxCount) { maxCount = count; modeVal = val; }
    }
    return modeVal;
  }

  /**
   * Convert a 2D text table array back to HTML table string.
   * Useful for reusing HTML-table parsers with PDF-extracted text.
   */
  protected textTableToHtml(rows: string[][]): string {
    if (rows.length === 0) return "<table></table>";
    const headerHtml = rows[0].map((h) => `<th>${h}</th>`).join("");
    const bodyHtml = rows
      .slice(1)
      .map((row) => `<tr>${row.map((c) => `<td>${c}</td>`).join("")}</tr>`)
      .join("\n");
    return `<table><tr>${headerHtml}</tr>\n${bodyHtml}</table>`;
  }

  // -------------------------------------------------------------------------
  // CSV parsing
  // -------------------------------------------------------------------------

  protected parseCsv(content: string, delimiter: string = ","): string[][] {
    const lines = content.split("\n").filter((line) => line.trim().length > 0);
    return lines.map((line) => {
      const cells: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            current += '"';
            i++; // skip escaped quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          cells.push(this.cleanCell(current));
          current = "";
        } else {
          current += char;
        }
      }
      cells.push(this.cleanCell(current));
      return cells;
    });
  }

  // -------------------------------------------------------------------------
  // Number parsing helpers
  // -------------------------------------------------------------------------

  protected parseNumber(value: string | undefined | null): number | undefined {
    if (!value || value.trim() === "" || value === "-" || value === "N/A") {
      return undefined;
    }
    const cleaned = value.replace(/,/g, "").replace(/[%$]/g, "").trim();
    const num = parseFloat(cleaned);
    return isNaN(num) ? undefined : num;
  }

  protected parseInteger(
    value: string | undefined | null
  ): number | undefined {
    const num = this.parseNumber(value);
    return num !== undefined ? Math.round(num) : undefined;
  }

  protected parseRate(value: string | undefined | null): number | undefined {
    const num = this.parseNumber(value);
    if (num === undefined) return undefined;
    // If it looks like a percentage (> 1), convert to 0-1 range
    return num > 1 ? num / 100 : num;
  }
}
