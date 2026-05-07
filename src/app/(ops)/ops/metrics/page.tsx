"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchWithCache, invalidateCache } from "@/lib/api/cache";
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  DollarSign,
  RefreshCw,
} from "lucide-react";

interface MetricsData {
  queued: number;
  inProgress: number;
  completedToday: number;
  failed: number;
  revenueToday: number;
  revenueWeek?: number;
  revenueMonth?: number;
}

const DATE_RANGES = [
  { value: "today", label: "Today" },
  { value: "week", label: "This Week" },
  { value: "month", label: "This Month" },
];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

interface MetricCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconBgClass: string;
  valueClass?: string;
}

function MetricCard({
  label,
  value,
  icon,
  iconBgClass,
  valueClass = "text-white",
}: MetricCardProps) {
  return (
    <div className="rounded-xl border border-white/10 bg-gray-900 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
            {label}
          </p>
          <p className={`mt-2 text-3xl font-bold ${valueClass}`}>{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconBgClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function OpsMetricsPage() {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("today");

  const fetchMetrics = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      params.set("range", dateRange);
      const url = `/api/v1/ops/metrics?${params.toString()}`;

      const data = await fetchWithCache<{ metrics: MetricsData }>(url, {
        staleMs: 15_000,
      });
      setMetrics(data.metrics);
      setError(null);
    } catch (err) {
      console.error("[ops/metrics] Failed to fetch:", err);
      setError("Failed to load metrics. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    setIsLoading(true);
    fetchMetrics();
  }, [fetchMetrics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-1 h-5 w-56 animate-pulse rounded-lg bg-white/5" />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-28 rounded-xl bg-white/5 animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Metrics</h1>
          <p className="mt-1 text-sm text-gray-400">
            Operations performance at a glance
          </p>
        </div>
        <button
          onClick={() => {
            invalidateCache("/api/v1/ops/metrics");
            setIsLoading(true);
            fetchMetrics();
          }}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Date Range Selector */}
      <div className="flex items-center gap-2">
        {DATE_RANGES.map((range) => (
          <button
            key={range.value}
            onClick={() => setDateRange(range.value)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              dateRange === range.value
                ? "bg-blue-600 text-white"
                : "bg-gray-900 text-gray-400 hover:bg-gray-800 hover:text-gray-300 border border-white/10"
            }`}
          >
            {range.label}
          </button>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              invalidateCache("/api/v1/ops/metrics");
              fetchMetrics();
            }}
            className="mt-2 text-sm font-medium text-blue-400 underline hover:text-blue-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetricCard
            label="Queued"
            value={metrics.queued}
            icon={<Clock className="h-6 w-6 text-amber-400" />}
            iconBgClass="bg-amber-500/10"
            valueClass="text-amber-400"
          />
          <MetricCard
            label="In Progress"
            value={metrics.inProgress}
            icon={<PlayCircle className="h-6 w-6 text-blue-400" />}
            iconBgClass="bg-blue-500/10"
            valueClass="text-blue-400"
          />
          <MetricCard
            label={
              dateRange === "today"
                ? "Completed Today"
                : dateRange === "week"
                  ? "Completed This Week"
                  : "Completed This Month"
            }
            value={metrics.completedToday}
            icon={<CheckCircle2 className="h-6 w-6 text-emerald-400" />}
            iconBgClass="bg-emerald-500/10"
            valueClass="text-emerald-400"
          />
          <MetricCard
            label="Failed"
            value={metrics.failed}
            icon={<AlertCircle className="h-6 w-6 text-red-400" />}
            iconBgClass="bg-red-500/10"
            valueClass={metrics.failed > 0 ? "text-red-400" : "text-white"}
          />
          <MetricCard
            label={
              dateRange === "today"
                ? "Revenue Today"
                : dateRange === "week"
                  ? "Revenue This Week"
                  : "Revenue This Month"
            }
            value={formatCurrency(
              dateRange === "week"
                ? (metrics.revenueWeek ?? metrics.revenueToday)
                : dateRange === "month"
                  ? (metrics.revenueMonth ?? metrics.revenueToday)
                  : metrics.revenueToday
            )}
            icon={<DollarSign className="h-6 w-6 text-emerald-400" />}
            iconBgClass="bg-emerald-500/10"
            valueClass="text-emerald-400"
          />
        </div>
      )}
    </div>
  );
}
