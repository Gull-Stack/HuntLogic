// =============================================================================
// HuntLogic — Base Adapter (abstract)
// =============================================================================
// All source adapters extend this class. Adapter selection is config-driven
// from the data_sources.scraper_config JSONB — no hardcoded state logic.
// =============================================================================

import type {
  AdapterName,
  EndpointConfig,
  ScraperConfig,
  RateLimitConfig,
  RawFetchResult,
} from "../types";

export abstract class BaseAdapter {
  abstract readonly name: AdapterName;
  abstract readonly sourceType: string;

  // -------------------------------------------------------------------------
  // Abstract: subclasses implement the actual fetch logic
  // -------------------------------------------------------------------------

  abstract fetch(
    endpoint: EndpointConfig,
    config: ScraperConfig
  ): Promise<RawFetchResult>;

  // -------------------------------------------------------------------------
  // Config validation
  // -------------------------------------------------------------------------

  validateConfig(config: ScraperConfig): boolean {
    if (!config.base_url) {
      console.warn(`[ingestion:adapter:${this.name}] Missing base_url`);
      return false;
    }
    if (!config.endpoints || config.endpoints.length === 0) {
      console.warn(`[ingestion:adapter:${this.name}] No endpoints configured`);
      return false;
    }
    if (!config.rate_limit || !config.rate_limit.requests_per_minute) {
      console.warn(
        `[ingestion:adapter:${this.name}] Missing rate_limit config`
      );
      return false;
    }
    return true;
  }

  // -------------------------------------------------------------------------
  // URL builder
  // -------------------------------------------------------------------------

  buildUrl(
    base: string,
    path: string,
    params: Record<string, string> = {}
  ): string {
    // Replace template variables in path: /draw-results/{year} → /draw-results/2025
    let resolvedPath = path;
    for (const [key, value] of Object.entries(params)) {
      resolvedPath = resolvedPath.replace(`{${key}}`, encodeURIComponent(value));
    }

    // Also resolve special template variables
    const currentYear = new Date().getFullYear().toString();
    resolvedPath = resolvedPath.replace("{{current_year}}", currentYear);

    // Build full URL
    const baseUrl = base.replace(/\/+$/, "");
    const cleanPath = resolvedPath.startsWith("/")
      ? resolvedPath
      : `/${resolvedPath}`;

    const url = new URL(`${baseUrl}${cleanPath}`);

    // Add remaining params as query string (those not used in path templates)
    for (const [key, value] of Object.entries(params)) {
      if (!path.includes(`{${key}}`)) {
        url.searchParams.set(key, value);
      }
    }

    return url.toString();
  }

  // -------------------------------------------------------------------------
  // Rate limiting
  // -------------------------------------------------------------------------

  async handleRateLimit(config: RateLimitConfig): Promise<void> {
    if (!config.requests_per_minute || config.requests_per_minute <= 0) {
      return;
    }

    const delayMs = Math.ceil(60_000 / config.requests_per_minute);
    const jitter = Math.floor(Math.random() * 500); // add 0-500ms jitter
    const totalDelay = delayMs + jitter;

    console.log(
      `[ingestion:adapter:${this.name}] Rate limiting: waiting ${totalDelay}ms`
    );
    await new Promise((resolve) => setTimeout(resolve, totalDelay));
  }

  // -------------------------------------------------------------------------
  // User-Agent rotation
  // -------------------------------------------------------------------------

  protected getRandomUserAgent(config: ScraperConfig): string {
    const defaultAgents = [
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15",
      "HuntLogic-Bot/1.0 (+https://huntlogic.com/bot)",
    ];

    const agents = config.user_agents?.length
      ? config.user_agents
      : defaultAgents;

    return agents[Math.floor(Math.random() * agents.length)];
  }
}
