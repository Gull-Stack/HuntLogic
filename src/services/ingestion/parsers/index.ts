// =============================================================================
// HuntLogic — Parser Registry
// =============================================================================
// Dynamic parser registry mapping parser names (from scraper_config) to classes.
// =============================================================================

import type { ParserName } from "../types";
import { BaseParser } from "./base-parser";
import { DrawOddsTableParser, DrawOddsCsvParser } from "./draw-odds-parser";
import { HarvestReportParser } from "./harvest-report-parser";
import { SeasonParser, RegulationTextParser } from "./season-parser";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const parserRegistry = new Map<ParserName, () => BaseParser>();

// Register built-in parsers
parserRegistry.set("draw_odds_table", () => new DrawOddsTableParser());
parserRegistry.set("draw_odds_csv", () => new DrawOddsCsvParser());
parserRegistry.set("harvest_report", () => new HarvestReportParser());
parserRegistry.set("season_dates", () => new SeasonParser());
parserRegistry.set("regulation_text", () => new RegulationTextParser());

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get a parser instance by name.
 * Parser names come from endpoint.parser in scraper_config.
 */
export function getParser(parserName: string): BaseParser {
  const factory = parserRegistry.get(parserName as ParserName);
  if (!factory) {
    const available = Array.from(parserRegistry.keys()).join(", ");
    throw new Error(
      `[ingestion:parser] Unknown parser "${parserName}". Available: ${available}`
    );
  }
  return factory();
}

/**
 * Register a new parser (for extensibility).
 */
export function registerParser(
  name: ParserName,
  factory: () => BaseParser
): void {
  parserRegistry.set(name, factory);
  console.log(`[ingestion:parser] Registered parser: ${name}`);
}

/**
 * List all registered parser names.
 */
export function listParsers(): ParserName[] {
  return Array.from(parserRegistry.keys());
}

// Re-export
export { BaseParser } from "./base-parser";
export { DrawOddsTableParser, DrawOddsCsvParser } from "./draw-odds-parser";
export { HarvestReportParser } from "./harvest-report-parser";
export { SeasonParser, RegulationTextParser } from "./season-parser";
