// =============================================================================
// HuntLogic — API/JSON Adapter
// =============================================================================
// For states that have actual APIs or structured JSON endpoints.
// Handles: auth headers, pagination, response mapping.
// Config-driven: endpoint, headers, params, pagination strategy all from JSONB.
// =============================================================================

import { BaseAdapter } from "./base-adapter";
import type {
  AdapterName,
  EndpointConfig,
  ScraperConfig,
  RawFetchResult,
  PaginationConfig,
} from "../types";

export class ApiAdapter extends BaseAdapter {
  readonly name: AdapterName = "api_json";
  readonly sourceType = "api";

  async fetch(
    endpoint: EndpointConfig,
    config: ScraperConfig
  ): Promise<RawFetchResult> {
    const url = this.buildUrl(config.base_url, endpoint.path, endpoint.params);
    const timeoutMs = config.timeout_ms || 30_000;
    const maxRetries = config.retry?.max_attempts || 3;
    const backoffMs = config.retry?.backoff_ms || 5000;

    console.log(`[ingestion:adapter:api_json] Fetching API: ${url}`);

    // If pagination is configured, handle paginated fetch
    if (endpoint.pagination) {
      return this.fetchPaginated(url, endpoint, config);
    }

    // Single request
    return this.fetchSingle(url, endpoint, config, maxRetries, backoffMs, timeoutMs);
  }

  // -------------------------------------------------------------------------
  // Single (non-paginated) fetch
  // -------------------------------------------------------------------------

  private async fetchSingle(
    url: string,
    endpoint: EndpointConfig,
    config: ScraperConfig,
    maxRetries: number,
    backoffMs: number,
    timeoutMs: number
  ): Promise<RawFetchResult> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.handleRateLimit(config.rate_limit);

        const headers = this.buildHeaders(endpoint, config);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const response = await fetch(url, {
          method: "GET",
          headers,
          signal: controller.signal,
          redirect: "follow",
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(
            `HTTP ${response.status}: ${response.statusText} for ${url}`
          );
        }

        const contentType =
          response.headers.get("content-type") || "application/json";
        const content = await response.text();

        // Validate JSON if expected
        if (contentType.includes("json")) {
          try {
            JSON.parse(content);
          } catch {
            throw new Error(`Invalid JSON response from ${url}`);
          }
        }

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        console.log(
          `[ingestion:adapter:api_json] Success: ${url} (${content.length} bytes)`
        );

        return {
          content,
          contentType,
          statusCode: response.status,
          url: response.url,
          headers: responseHeaders,
          fetchedAt: new Date().toISOString(),
          byteSize: new TextEncoder().encode(content).byteLength,
        };
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        console.warn(
          `[ingestion:adapter:api_json] Attempt ${attempt}/${maxRetries} failed: ${lastError.message}`
        );

        if (attempt < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `[ingestion:adapter:api_json] All ${maxRetries} attempts failed for ${url}: ${lastError?.message}`
    );
  }

  // -------------------------------------------------------------------------
  // Paginated fetch (accumulates all pages into single result)
  // -------------------------------------------------------------------------

  private async fetchPaginated(
    baseUrl: string,
    endpoint: EndpointConfig,
    config: ScraperConfig
  ): Promise<RawFetchResult> {
    const pagination = endpoint.pagination!;
    const maxPages = pagination.max_pages || 50;
    const pageSize = pagination.page_size || 100;
    const timeoutMs = config.timeout_ms || 30_000;
    const allRecords: unknown[] = [];
    let currentPage = 1;
    let hasMore = true;

    console.log(
      `[ingestion:adapter:api_json] Starting paginated fetch: ${baseUrl} (strategy: ${pagination.strategy})`
    );

    while (hasMore && currentPage <= maxPages) {
      await this.handleRateLimit(config.rate_limit);

      const pageUrl = this.buildPageUrl(
        baseUrl,
        pagination,
        currentPage,
        pageSize
      );
      const headers = this.buildHeaders(endpoint, config);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const response = await fetch(pageUrl, {
          method: "GET",
          headers,
          signal: controller.signal,
        });

        clearTimeout(timeout);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status} on page ${currentPage}`);
        }

        const text = await response.text();
        const data = JSON.parse(text);

        // Extract records from response (common patterns)
        const records = Array.isArray(data)
          ? data
          : data.data || data.results || data.items || data.records || [];

        if (records.length === 0) {
          hasMore = false;
        } else {
          allRecords.push(...records);
          currentPage++;

          // Check if we got less than a full page
          if (records.length < pageSize) {
            hasMore = false;
          }
        }
      } catch (error) {
        clearTimeout(timeout);
        console.error(
          `[ingestion:adapter:api_json] Pagination failed on page ${currentPage}: ${error}`
        );
        hasMore = false;
      }
    }

    const content = JSON.stringify(allRecords);

    console.log(
      `[ingestion:adapter:api_json] Paginated fetch complete: ${allRecords.length} records across ${currentPage - 1} pages`
    );

    return {
      content,
      contentType: "application/json",
      statusCode: 200,
      url: baseUrl,
      headers: {},
      fetchedAt: new Date().toISOString(),
      byteSize: new TextEncoder().encode(content).byteLength,
    };
  }

  // -------------------------------------------------------------------------
  // Build page URL based on pagination strategy
  // -------------------------------------------------------------------------

  private buildPageUrl(
    baseUrl: string,
    pagination: PaginationConfig,
    page: number,
    pageSize: number
  ): string {
    const url = new URL(baseUrl);
    const paramName = pagination.param_name || "page";

    switch (pagination.strategy) {
      case "page_param":
        url.searchParams.set(paramName, page.toString());
        url.searchParams.set("per_page", pageSize.toString());
        break;
      case "offset_limit":
        url.searchParams.set("offset", ((page - 1) * pageSize).toString());
        url.searchParams.set("limit", pageSize.toString());
        break;
      case "cursor":
        // Cursor pagination would need the cursor from previous response
        // For initial page, just add page_size
        url.searchParams.set("limit", pageSize.toString());
        break;
      case "next_link":
        // next_link pagination uses URLs from the response body
        // For initial page, use the base URL
        break;
    }

    return url.toString();
  }

  // -------------------------------------------------------------------------
  // Build request headers (with auth)
  // -------------------------------------------------------------------------

  private buildHeaders(
    endpoint: EndpointConfig,
    config: ScraperConfig
  ): Record<string, string> {
    const headers: Record<string, string> = {
      "User-Agent": this.getRandomUserAgent(config),
      Accept: "application/json",
      ...(endpoint.headers || {}),
    };

    // Add auth headers based on config
    if (config.auth) {
      switch (config.auth.type) {
        case "api_key":
          if (config.auth.key_header && config.auth.key_value) {
            headers[config.auth.key_header] = config.auth.key_value;
          }
          break;
        case "bearer":
          if (config.auth.key_value) {
            headers["Authorization"] = `Bearer ${config.auth.key_value}`;
          }
          break;
        case "basic":
          if (config.auth.username && config.auth.password) {
            const encoded = Buffer.from(
              `${config.auth.username}:${config.auth.password}`
            ).toString("base64");
            headers["Authorization"] = `Basic ${encoded}`;
          }
          break;
      }
    }

    return headers;
  }
}
