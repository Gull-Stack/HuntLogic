"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Package, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchWithCache, invalidateCache } from "@/lib/api/cache";

interface OpsOrder {
  id: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  states: string[];
  itemCount: number;
  grandTotal: number;
  status: string;
  createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; variant: "default" | "success" | "warning" | "danger" | "info"; className?: string }> = {
  draft: { label: "Draft", variant: "default", className: "bg-gray-500/10 text-gray-400" },
  pending_payment: { label: "Pending Payment", variant: "warning", className: "bg-amber-500/10 text-amber-400" },
  paid: { label: "Paid", variant: "info", className: "bg-blue-500/10 text-blue-400" },
  in_progress: { label: "In Progress", variant: "info", className: "bg-indigo-500/10 text-indigo-400" },
  submitted: { label: "Submitted", variant: "info", className: "bg-purple-500/10 text-purple-400" },
  completed: { label: "Completed", variant: "success", className: "bg-emerald-500/10 text-emerald-400" },
  cancelled: { label: "Cancelled", variant: "danger", className: "bg-red-500/10 text-red-400" },
  refunded: { label: "Refunded", variant: "warning", className: "bg-orange-500/10 text-orange-400" },
};

const DATE_RANGES = [
  { value: "all", label: "All Time" },
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

function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

export default function OpsOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<OpsOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (dateRange !== "all") params.set("range", dateRange);
      params.set("page", String(page));
      params.set("limit", "20");
      const url = `/api/v1/ops/orders?${params.toString()}`;

      const data = await fetchWithCache<{
        orders: OpsOrder[];
        totalPages: number;
        page: number;
      }>(url, { staleMs: 15_000 });

      setOrders(data.orders || []);
      setTotalPages(data.totalPages || 1);
      setError(null);
    } catch (err) {
      console.error("[ops/orders] Failed to fetch:", err);
      setError("Failed to load orders. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter, dateRange, page]);

  useEffect(() => {
    setIsLoading(true);
    fetchOrders();
  }, [fetchOrders]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-1 h-5 w-56 animate-pulse rounded-lg bg-white/5" />
        </div>
        <SkeletonList count={5} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Orders</h1>
        <p className="mt-1 text-sm text-gray-400">
          All customer application orders
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_BADGE).map(([key, { label }]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {DATE_RANGES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
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
              invalidateCache("/api/v1/ops/orders");
              fetchOrders();
            }}
            className="mt-2 text-sm font-medium text-blue-400 underline hover:text-blue-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Orders Table */}
      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-500">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">No orders found</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-400">
            Try adjusting your filters or check back later.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-x-auto rounded-xl border border-white/10 md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-gray-900/50">
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Order #</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Customer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">States</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-400">Items</th>
                  <th className="px-4 py-3 text-right font-medium text-gray-400">Total</th>
                  <th className="px-4 py-3 text-center font-medium text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {orders.map((order) => {
                  const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.draft;

                  return (
                    <tr
                      key={order.id}
                      onClick={() => router.push(`/ops/orders/${order.id}`)}
                      className="cursor-pointer transition-colors hover:bg-white/5"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-white">
                        {order.orderNumber ? `#${order.orderNumber}` : "--"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{order.customerName}</div>
                        <div className="text-xs text-gray-500">{order.customerEmail}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {order.states.map((s) => (
                            <span
                              key={s}
                              className="inline-block rounded bg-white/5 px-1.5 py-0.5 text-xs font-medium text-gray-300"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-gray-300">
                        {order.itemCount}
                      </td>
                      <td className="px-4 py-3 text-right font-medium text-white">
                        {formatCurrency(order.grandTotal)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge
                          variant={badge.variant}
                          size="sm"
                          className={badge.className}
                        >
                          {badge.label}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-gray-400">
                        {formatDate(order.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {orders.map((order) => {
              const badge = STATUS_BADGE[order.status] ?? STATUS_BADGE.draft;

              return (
                <button
                  key={order.id}
                  onClick={() => router.push(`/ops/orders/${order.id}`)}
                  className="w-full rounded-xl border border-white/10 bg-gray-900 p-4 text-left transition-all hover:border-white/20"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-gray-500">
                        {order.orderNumber ? `#${order.orderNumber}` : "Order"}{" "}
                        &middot; {formatDate(order.createdAt)}
                      </p>
                    </div>
                    <Badge
                      variant={badge.variant}
                      size="sm"
                      className={badge.className}
                    >
                      {badge.label}
                    </Badge>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {order.states.join(", ")} &middot; {order.itemCount}{" "}
                      {order.itemCount === 1 ? "item" : "items"}
                    </span>
                    <span className="font-medium text-white">
                      {formatCurrency(order.grandTotal)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
