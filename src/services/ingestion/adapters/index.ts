// =============================================================================
// HuntLogic — Adapter Registry
// =============================================================================
// Dynamic adapter registry: maps adapter names from scraper_config to classes.
// New adapters are registered here — no code changes needed elsewhere.
// =============================================================================

import type { AdapterName } from "../types";
import { BaseAdapter } from "./base-adapter";
import { WebScraperAdapter } from "./web-scraper-adapter";
import { PdfAdapter } from "./pdf-adapter";
import { ApiAdapter } from "./api-adapter";

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const adapterRegistry = new Map<AdapterName, () => BaseAdapter>();

// Register built-in adapters
adapterRegistry.set("web_scraper", () => new WebScraperAdapter());
adapterRegistry.set("pdf_download", () => new PdfAdapter());
adapterRegistry.set("api_json", () => new ApiAdapter());

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get an adapter instance by name.
 * Adapter names come from data_sources.scraper_config.adapter field.
 */
export function getAdapter(adapterName: string): BaseAdapter {
  const factory = adapterRegistry.get(adapterName as AdapterName);
  if (!factory) {
    const available = Array.from(adapterRegistry.keys()).join(", ");
    throw new Error(
      `[ingestion:adapter] Unknown adapter "${adapterName}". Available: ${available}`
    );
  }
  return factory();
}

/**
 * Register a new adapter (for extensibility without modifying this file).
 */
export function registerAdapter(
  name: AdapterName,
  factory: () => BaseAdapter
): void {
  adapterRegistry.set(name, factory);
  console.log(`[ingestion:adapter] Registered adapter: ${name}`);
}

/**
 * List all registered adapter names.
 */
export function listAdapters(): AdapterName[] {
  return Array.from(adapterRegistry.keys());
}

// Re-export base class for external adapter implementations
export { BaseAdapter } from "./base-adapter";
export { WebScraperAdapter } from "./web-scraper-adapter";
export { PdfAdapter } from "./pdf-adapter";
export { ApiAdapter } from "./api-adapter";
