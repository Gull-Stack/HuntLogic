// =============================================================================
// HuntLogic — Base Parser (abstract)
// =============================================================================
// All parsers extend this class. Parser selection is config-driven from
// the endpoint's `parser` field in scraper_config JSONB.
// =============================================================================

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

  /**
   * Clean a cell value from a table: trim, remove special chars, normalize
   */
  protected cleanCell(value: string): string {
    return value
      .replace(/\u00a0/g, " ") // non-breaking spaces
      .replace(/\u200b/g, "") // zero-width spaces
      .replace(/\s+/g, " ")
      .replace(/^["']+|["']+$/g, "") // strip wrapping quotes
      .trim();
  }

  // -------------------------------------------------------------------------
  // HTML table extraction helper
  // -------------------------------------------------------------------------

  /**
   * Extract a table from HTML as a 2D string array.
   * Uses regex-based parsing (no DOM dependency for server-side).
   * For complex HTML, consider cheerio or jsdom in production.
   */
  extractTable(html: string, selector?: string): string[][] {
    const rows: string[][] = [];

    // Find all table content — if selector provided, try to narrow down
    // (basic selector support: tagname, #id, .class)
    let tableHtml = html;
    if (selector) {
      const tableMatch = this.findElementBySelector(html, selector);
      if (tableMatch) {
        tableHtml = tableMatch;
      }
    }

    // Extract <tr> rows
    const trPattern = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
    let trMatch: RegExpExecArray | null;

    while ((trMatch = trPattern.exec(tableHtml)) !== null) {
      const rowHtml = trMatch[1];
      const cells: string[] = [];

      // Extract <td> and <th> cells
      const cellPattern = /<(?:td|th)[^>]*>([\s\S]*?)<\/(?:td|th)>/gi;
      let cellMatch: RegExpExecArray | null;

      while ((cellMatch = cellPattern.exec(rowHtml)) !== null) {
        // Strip inner HTML tags, keep text
        const text = cellMatch[1]
          .replace(/<[^>]+>/g, "")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&#(\d+);/g, (_match, code) =>
            String.fromCharCode(parseInt(code, 10))
          );
        cells.push(this.cleanCell(text));
      }

      if (cells.length > 0) {
        rows.push(cells);
      }
    }

    return rows;
  }

  /**
   * Parse CSV content into a 2D string array.
   */
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

  // -------------------------------------------------------------------------
  // Basic element finder (simple CSS selector support)
  // -------------------------------------------------------------------------

  private findElementBySelector(
    html: string,
    selector: string
  ): string | null {
    // Simple selectors: table, table.classname, table#id, #id, .class
    let pattern: RegExp;

    if (selector.startsWith("#")) {
      const id = selector.slice(1);
      pattern = new RegExp(
        `<(\\w+)[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
        "i"
      );
    } else if (selector.startsWith(".")) {
      const cls = selector.slice(1);
      pattern = new RegExp(
        `<(\\w+)[^>]*class=["'][^"']*${cls}[^"']*["'][^>]*>([\\s\\S]*?)<\\/\\1>`,
        "i"
      );
    } else if (selector.includes("#")) {
      const [tag, id] = selector.split("#");
      pattern = new RegExp(
        `<${tag}[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/${tag}>`,
        "i"
      );
    } else if (selector.includes(".")) {
      const [tag, cls] = selector.split(".");
      pattern = new RegExp(
        `<${tag}[^>]*class=["'][^"']*${cls}[^"']*["'][^>]*>([\\s\\S]*?)<\\/${tag}>`,
        "i"
      );
    } else {
      // Just a tag name — return first instance
      pattern = new RegExp(
        `<${selector}[^>]*>([\\s\\S]*?)<\\/${selector}>`,
        "i"
      );
    }

    const match = pattern.exec(html);
    return match ? match[0] : null;
  }
}
