// =============================================================================
// HuntLogic — Web Scraper Adapter
// =============================================================================
// Fetches HTML content from state agency websites.
// Config-driven: all URLs, selectors, and params come from scraper_config JSONB.
// =============================================================================

import { BaseAdapter } from "./base-adapter";
import type {
  AdapterName,
  EndpointConfig,
  ScraperConfig,
  RawFetchResult,
} from "../types";

export class WebScraperAdapter extends BaseAdapter {
  readonly name: AdapterName = "web_scraper";
  readonly sourceType = "web";

  async fetch(
    endpoint: EndpointConfig,
    config: ScraperConfig
  ): Promise<RawFetchResult> {
    const url = this.buildUrl(config.base_url, endpoint.path, endpoint.params);
    const timeoutMs = config.timeout_ms || 30_000;
    const maxRetries = config.retry?.max_attempts || 3;
    const backoffMs = config.retry?.backoff_ms || 5000;

    console.log(`[ingestion:adapter:web_scraper] Fetching: ${url}`);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Rate limit before each request
        await this.handleRateLimit(config.rate_limit);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const headers: Record<string, string> = {
          "User-Agent": this.getRandomUserAgent(config),
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate",
          Connection: "keep-alive",
          ...(endpoint.headers || {}),
        };

        const response = await fetch(url, {
          method: "GET",
          headers,
          signal: controller.signal,
          redirect: "follow",
        });

        clearTimeout(timeout);

        // Validate response
        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText} for ${url}`
          );
        }

        const contentType =
          response.headers.get("content-type") || "text/html";
        const content = await response.text();

        if (!content || content.trim().length === 0) {
          throw new Error(`Empty response body from ${url}`);
        }

        // Build response headers map
        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        console.log(
          `[ingestion:adapter:web_scraper] Success: ${url} (${content.length} bytes, attempt ${attempt})`
        );

        return {
          content,
          contentType,
          statusCode: response.status,
          url: response.url, // may differ from request URL after redirects
          headers: responseHeaders,
          fetchedAt: new Date().toISOString(),
          byteSize: new TextEncoder().encode(content).byteLength,
        };
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        console.warn(
          `[ingestion:adapter:web_scraper] Attempt ${attempt}/${maxRetries} failed for ${url}: ${lastError.message}`
        );

        if (attempt < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempt - 1);
          console.log(
            `[ingestion:adapter:web_scraper] Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `[ingestion:adapter:web_scraper] All ${maxRetries} attempts failed for ${url}: ${lastError?.message}`
    );
  }
}
