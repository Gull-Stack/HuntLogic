"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { ListTodo, Clock, User, MapPin, RefreshCw } from "lucide-react";
import { fetchWithCache, invalidateCache } from "@/lib/api/cache";

interface QueueItem {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerName: string;
  stateCode: string;
  species: string;
  status: "queued" | "in_progress" | "submitted" | "confirmed" | "failed";
  createdAt: string;
  assignedAgentName?: string;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info"; className?: string }> = {
  queued: { label: "Queued", variant: "warning", className: "bg-amber-500/10 text-amber-400" },
  in_progress: { label: "In Progress", variant: "info", className: "bg-blue-500/10 text-blue-400" },
  submitted: { label: "Submitted", variant: "info", className: "bg-purple-500/10 text-purple-400" },
  confirmed: { label: "Confirmed", variant: "success", className: "bg-emerald-500/10 text-emerald-400" },
  failed: { label: "Failed", variant: "danger", className: "bg-red-500/10 text-red-400" },
};

function formatRelativeTime(dateStr: string): string {
  const minutes = Math.round(
    (Date.now() - new Date(dateStr).getTime()) / 60000
  );
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function QueuePage() {
  const router = useRouter();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const fetchQueue = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (stateFilter !== "all") params.set("state", stateFilter);
      const query = params.toString();
      const url = `/api/v1/ops/queue${query ? `?${query}` : ""}`;

      const data = await fetchWithCache<{ items: QueueItem[] }>(url, {
        staleMs: 10_000,
      });
      setItems(data.items || []);
      setError(null);
    } catch (err) {
      console.error("[ops/queue] Failed to fetch:", err);
      setError("Failed to load queue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, stateFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchQueue();
  }, [fetchQueue]);

  // Auto-refresh every 30s
  useEffect(() => {
    const interval = setInterval(() => {
      invalidateCache("/api/v1/ops/queue");
      fetchQueue();
    }, 30_000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  async function handleClaim(itemId: string) {
    setClaimingId(itemId);
    try {
      const res = await fetch(`/api/v1/ops/queue/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in_progress" }),
      });
      if (!res.ok) throw new Error("Failed to claim item");
      invalidateCache("/api/v1/ops/queue");
      await fetchQueue();
    } catch (err) {
      console.error("[ops/queue] Claim failed:", err);
      setError("Failed to claim item. Please try again.");
    } finally {
      setClaimingId(null);
    }
  }

  // Collect unique states for filter
  const uniqueStates = Array.from(new Set(items.map((i) => i.stateCode))).sort();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-1 h-5 w-64 animate-pulse rounded-lg bg-white/5" />
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Queue</h1>
          <p className="mt-1 text-sm text-gray-400">
            Application items ready for processing
          </p>
        </div>
        <button
          onClick={() => {
            invalidateCache("/api/v1/ops/queue");
            setIsLoading(true);
            fetchQueue();
          }}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Statuses</option>
          <option value="queued">Queued</option>
          <option value="in_progress">In Progress</option>
        </select>

        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All States</option>
          {uniqueStates.map((state) => (
            <option key={state} value={state}>
              {state}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => {
              setError(null);
              setIsLoading(true);
              invalidateCache("/api/v1/ops/queue");
              fetchQueue();
            }}
            className="mt-2 text-sm font-medium text-blue-400 underline hover:text-blue-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Queue Items */}
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-500">
            <ListTodo className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">No items in queue</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-400">
            All caught up! New application items will appear here when orders are placed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const badge = STATUS_BADGE[item.status] ?? STATUS_BADGE.queued;
            const isQueued = item.status === "queued";

            return (
              <div
                key={item.id}
                className="group rounded-xl border border-white/10 bg-gray-900 p-4 transition-all hover:border-white/20 hover:bg-gray-900/80"
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Left: details */}
                  <button
                    onClick={() => router.push(`/ops/orders/${item.orderId}`)}
                    className="flex-1 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-semibold text-white">
                          {item.customerName}
                        </span>
                      </div>
                      <Badge
                        variant={badge.variant}
                        size="sm"
                        className={badge.className}
                      >
                        {badge.label}
                      </Badge>
                    </div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.stateCode}
                      </span>
                      <span>{item.species}</span>
                      {item.orderNumber && (
                        <span className="font-mono">#{item.orderNumber}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(item.createdAt)}
                      </span>
                      {item.assignedAgentName && (
                        <span className="text-blue-400">
                          Assigned: {item.assignedAgentName}
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Right: action */}
                  {isQueued && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClaim(item.id);
                      }}
                      disabled={claimingId === item.id}
                      className={cn(
                        "shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed",
                        claimingId === item.id && "animate-pulse"
                      )}
                    >
                      {claimingId === item.id ? "Claiming..." : "Claim"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
