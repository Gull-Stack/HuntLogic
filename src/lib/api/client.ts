import { fetchWithCache } from "./cache";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

interface ApiClientOptions {
  baseUrl?: string;
  headers?: Record<string, string>;
}

interface ApiResponse<T> {
  data: T;
  error: string | null;
  status: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: ApiClientOptions = {}) {
    this.baseUrl = options.baseUrl || `${API_BASE_URL}/api/v1`;
    this.defaultHeaders = {
      "Content-Type": "application/json",
      ...options.headers,
    };
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: this.defaultHeaders,
        body: body ? JSON.stringify(body) : undefined,
      });

      const data = await response.json();

      return {
        data,
        error: response.ok ? null : data.error || "Request failed",
        status: response.status,
      };
    } catch (error) {
      return {
        data: null as T,
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  async get<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("GET", path);
  }

  /**
   * GET with stale-while-revalidate caching.
   * Returns cached data immediately if fresh, revalidates in background if stale.
   */
  async getCached<T>(
    path: string,
    options?: { staleMs?: number; maxAgeMs?: number }
  ): Promise<ApiResponse<T>> {
    try {
      const data = await fetchWithCache<T>(`${this.baseUrl}${path}`, {
        headers: this.defaultHeaders,
        staleMs: options?.staleMs,
        maxAgeMs: options?.maxAgeMs,
      });
      return {
        data,
        error: null,
        status: 200,
      };
    } catch (error) {
      return {
        data: null as T,
        error: error instanceof Error ? error.message : "Network error",
        status: 0,
      };
    }
  }

  async post<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("POST", path, body);
  }

  async put<T>(path: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>("PUT", path, body);
  }

  async delete<T>(path: string): Promise<ApiResponse<T>> {
    return this.request<T>("DELETE", path);
  }
}

export const apiClient = new ApiClient();
export default ApiClient;
