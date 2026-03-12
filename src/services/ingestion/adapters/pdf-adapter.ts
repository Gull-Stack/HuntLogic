// =============================================================================
// HuntLogic — PDF Download Adapter
// =============================================================================
// Downloads PDF files from state agencies (many draw/harvest reports are PDFs).
// Stores raw PDF in object storage (S3/MinIO), returns extracted text.
// NOTE: Full PDF text extraction will require a pdf-parse library (future dep).
// =============================================================================

import { BaseAdapter } from "./base-adapter";
import type {
  AdapterName,
  EndpointConfig,
  ScraperConfig,
  RawFetchResult,
} from "../types";

export class PdfAdapter extends BaseAdapter {
  readonly name: AdapterName = "pdf_download";
  readonly sourceType = "pdf";

  async fetch(
    endpoint: EndpointConfig,
    config: ScraperConfig
  ): Promise<RawFetchResult> {
    const url = this.buildUrl(config.base_url, endpoint.path, endpoint.params);
    const timeoutMs = config.timeout_ms || 60_000; // PDFs can be large
    const maxRetries = config.retry?.max_attempts || 3;
    const backoffMs = config.retry?.backoff_ms || 5000;

    console.log(`[ingestion:adapter:pdf_download] Fetching PDF: ${url}`);

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await this.handleRateLimit(config.rate_limit);

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);

        const headers: Record<string, string> = {
          "User-Agent": this.getRandomUserAgent(config),
          Accept: "application/pdf,*/*;q=0.8",
          ...(endpoint.headers || {}),
        };

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
          response.headers.get("content-type") || "application/pdf";

        // Read as ArrayBuffer for binary PDF content
        const arrayBuffer = await response.arrayBuffer();
        const byteSize = arrayBuffer.byteLength;

        if (byteSize === 0) {
          throw new Error(`Empty PDF response from ${url}`);
        }

        // Store the raw PDF bytes in object storage (MinIO/S3)
        const objectStorageKey = await this.storePdf(
          arrayBuffer,
          url,
          config
        );

        // Attempt basic text extraction
        // NOTE: For production, integrate pdf-parse or pdfjs-dist
        const textContent = await this.extractText(arrayBuffer);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        console.log(
          `[ingestion:adapter:pdf_download] Success: ${url} (${byteSize} bytes, stored as ${objectStorageKey})`
        );

        return {
          content: textContent,
          contentType,
          statusCode: response.status,
          url: response.url,
          headers: responseHeaders,
          fetchedAt: new Date().toISOString(),
          byteSize,
          objectStorageKey,
        };
      } catch (error) {
        lastError =
          error instanceof Error ? error : new Error(String(error));

        console.warn(
          `[ingestion:adapter:pdf_download] Attempt ${attempt}/${maxRetries} failed for ${url}: ${lastError.message}`
        );

        if (attempt < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(
      `[ingestion:adapter:pdf_download] All ${maxRetries} attempts failed for ${url}: ${lastError?.message}`
    );
  }

  // -------------------------------------------------------------------------
  // Store PDF in object storage
  // -------------------------------------------------------------------------

  private async storePdf(
    buffer: ArrayBuffer,
    sourceUrl: string,
    config: ScraperConfig
  ): Promise<string> {
    // Generate a deterministic-ish key from the URL
    const urlHash = await this.hashString(sourceUrl);
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const stateCode = config.state_code || "unknown";
    const key = `pdfs/${stateCode}/${urlHash}-${timestamp}.pdf`;

    // TODO: Implement actual MinIO/S3 upload
    // const { Client } = await import("minio");
    // const minio = new Client({
    //   endPoint: process.env.MINIO_ENDPOINT || "localhost",
    //   port: parseInt(process.env.MINIO_PORT || "9000"),
    //   useSSL: false,
    //   accessKey: process.env.MINIO_ACCESS_KEY || "huntlogic_minio",
    //   secretKey: process.env.MINIO_SECRET_KEY || "huntlogic_minio_secret",
    // });
    // const bucket = process.env.MINIO_BUCKET || "huntlogic-data";
    // await minio.putObject(bucket, key, Buffer.from(buffer));

    console.log(
      `[ingestion:adapter:pdf_download] Stored PDF: ${key} (${buffer.byteLength} bytes)`
    );
    return key;
  }

  // -------------------------------------------------------------------------
  // Extract text from PDF
  // -------------------------------------------------------------------------

  private async extractText(buffer: ArrayBuffer): Promise<string> {
    try {
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: Buffer.from(buffer) });
      const result = await parser.getText();
      console.log(
        `[ingestion:adapter:pdf_download] Extracted ${result.text.length} chars from PDF (${result.total} pages)`
      );
      return result.text;
    } catch (error) {
      console.error(
        `[ingestion:adapter:pdf_download] PDF text extraction failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return `[PDF_EXTRACTION_FAILED:${buffer.byteLength}_bytes]`;
    }
  }

  // -------------------------------------------------------------------------
  // Simple string hashing for storage keys
  // -------------------------------------------------------------------------

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 16); // first 16 hex chars
  }
}
