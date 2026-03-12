// =============================================================================
// HuntLogic — Ingestion Pipeline Type Definitions
// =============================================================================

// ---------------------------------------------------------------------------
// Adapter Names & Parser Names
// ---------------------------------------------------------------------------

export type AdapterName = "web_scraper" | "pdf_download" | "api_json";

export type ParserName =
  | "draw_odds_table"
  | "draw_odds_csv"
  | "harvest_report"
  | "season_dates"
  | "regulation_text";

// ---------------------------------------------------------------------------
// Scraper / Source Configuration (stored in data_sources.scraper_config JSONB)
// ---------------------------------------------------------------------------

export interface RateLimitConfig {
  requests_per_minute: number;
}

export interface RetryConfig {
  max_attempts: number;
  backoff_ms: number;
}

export interface EndpointConfig {
  path: string;
  parser: ParserName;
  params: Record<string, string>;
  schedule?: string; // cron expression override for this endpoint
  doc_type?: string; // 'draw_report' | 'harvest_report' | 'regulation' etc.
  headers?: Record<string, string>;
  pagination?: PaginationConfig;
  selectors?: Record<string, string>; // CSS selectors for web scraping
}

export interface PaginationConfig {
  strategy: "page_param" | "offset_limit" | "cursor" | "next_link";
  param_name?: string;
  page_size?: number;
  max_pages?: number;
}

export interface AuthConfig {
  type: "none" | "api_key" | "bearer" | "basic";
  key_header?: string;
  key_value?: string;
  username?: string;
  password?: string;
}

export interface ScraperConfig {
  adapter: AdapterName;
  base_url: string;
  endpoints: EndpointConfig[];
  auth?: AuthConfig;
  rate_limit: RateLimitConfig;
  retry: RetryConfig;
  user_agents?: string[];
  timeout_ms?: number;
  state_code?: string;
  species_slugs?: string[];
}

// ---------------------------------------------------------------------------
// Fetch Results
// ---------------------------------------------------------------------------

export interface RawFetchResult {
  content: string;
  contentType: string; // 'text/html' | 'application/pdf' | 'application/json' | 'text/csv'
  statusCode: number;
  url: string;
  headers: Record<string, string>;
  fetchedAt: string; // ISO timestamp
  byteSize: number;
  objectStorageKey?: string; // if stored in S3/MinIO (e.g., PDFs)
}

// ---------------------------------------------------------------------------
// Parse Results
// ---------------------------------------------------------------------------

export interface ParsedResult {
  records: Record<string, unknown>[];
  metadata: ParsedMetadata;
  qualityScore: number; // 0-1
  warnings: string[];
}

export interface ParsedMetadata {
  parser: ParserName;
  rowCount: number;
  columnCount: number;
  year?: number;
  stateCode?: string;
  speciesSlug?: string;
  sourceUrl?: string;
  parsedAt: string; // ISO timestamp
}

export interface ParsedDrawOdds {
  year: number;
  unitCode: string;
  species: string;
  residentType: string; // 'resident' | 'nonresident'
  weaponType?: string;
  choiceRank?: number;
  totalApplicants?: number;
  totalTags?: number;
  minPointsDrawn?: number;
  maxPointsDrawn?: number;
  avgPointsDrawn?: number;
  drawRate?: number; // 0-1
  rawRow: Record<string, unknown>;
}

export interface ParsedHarvestStats {
  year: number;
  unitCode: string;
  species: string;
  weaponType?: string;
  totalHunters?: number;
  totalHarvest?: number;
  successRate?: number; // 0-1
  avgDaysHunted?: number;
  trophyMetrics?: Record<string, unknown>;
  rawRow: Record<string, unknown>;
}

export interface ParsedSeason {
  year: number;
  unitCode?: string;
  species: string;
  seasonName?: string;
  weaponType?: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  tagType?: string; // 'draw' | 'otc' | 'leftover'
  quota?: number;
  rawRow: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Parser Configuration (per-state column mappings etc.)
// ---------------------------------------------------------------------------

export interface ParserConfig {
  column_mappings?: Record<string, string | number>; // our field name → source column name or index
  table_selector?: string; // CSS selector for the data table
  row_selector?: string;
  header_row?: number; // row index of header (0-based)
  data_start_row?: number; // first data row index
  skip_rows?: number[];
  delimiter?: string; // for CSV parsing
  date_format?: string;
  state_code?: string;
  species_slug?: string;
  year?: number;
}

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

export interface NormalizedData {
  table: "draw_odds" | "harvest_stats" | "seasons" | "deadlines";
  records: Record<string, unknown>[];
  stateCode: string;
  speciesSlug?: string;
  year?: number;
  sourceId: string;
}

// ---------------------------------------------------------------------------
// Quality Assessment
// ---------------------------------------------------------------------------

export interface QualityFlag {
  field: string;
  issue: string;
  severity: "info" | "warning" | "error";
  value?: unknown;
}

export interface QualityReport {
  overallScore: number; // 0-1
  completeness: number; // 0-1: % of expected fields present
  consistency: number; // 0-1: values within expected ranges
  freshness: number; // 0-1: based on age of data
  authority: number; // 0-1: based on source tier
  flags: QualityFlag[];
  recordCount: number;
  validRecordCount: number;
}

// ---------------------------------------------------------------------------
// BullMQ Job Payloads
// ---------------------------------------------------------------------------

export interface FetchJobData {
  sourceId: string;
  endpoint: EndpointConfig;
  config: ScraperConfig;
}

export interface ParseJobData {
  sourceId: string;
  rawContent: string;
  docType: string;
  parser: ParserName;
  metadata: {
    url: string;
    fetchedAt: string;
    stateCode?: string;
    speciesSlug?: string;
    year?: number;
    objectStorageKey?: string;
  };
}

export interface NormalizeJobData {
  sourceId: string;
  parsedData: ParsedResult;
  docType: string;
  stateCode: string;
  speciesSlug?: string;
}

export interface EmbedJobData {
  documentId: string;
}
