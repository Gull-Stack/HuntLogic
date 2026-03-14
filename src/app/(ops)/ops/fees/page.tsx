"use client";

import { useState, useEffect, useCallback } from "react";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { fetchWithCache, invalidateCache } from "@/lib/api/cache";
import { DollarSign } from "lucide-react";

interface FeeSchedule {
  id: string;
  stateCode: string;
  stateName?: string;
  species: string;
  residency: "resident" | "non_resident";
  feeType: string;
  feeName: string;
  amount: number;
  required: boolean;
  year: number;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

export default function OpsFeesPage() {
  const [fees, setFees] = useState<FeeSchedule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [yearFilter, setYearFilter] = useState<string>("all");

  const fetchFees = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (stateFilter !== "all") params.set("state", stateFilter);
      if (yearFilter !== "all") params.set("year", yearFilter);
      const query = params.toString();
      const url = `/api/v1/ops/fee-schedules${query ? `?${query}` : ""}`;

      const data = await fetchWithCache<{ fees: FeeSchedule[] }>(url, {
        staleMs: 60_000,
      });
      setFees(data.fees || []);
      setError(null);
    } catch (err) {
      console.error("[ops/fees] Failed to fetch:", err);
      setError("Failed to load fee schedules. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [stateFilter, yearFilter]);

  useEffect(() => {
    setIsLoading(true);
    fetchFees();
  }, [fetchFees]);

  // Unique states and years for filters
  const uniqueStates = Array.from(new Set(fees.map((f) => f.stateCode))).sort();
  const uniqueYears = Array.from(new Set(fees.map((f) => String(f.year))))
    .sort()
    .reverse();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-1 h-5 w-64 animate-pulse rounded-lg bg-white/5" />
        </div>
        <SkeletonList count={6} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Fee Schedules</h1>
        <p className="mt-1 text-sm text-gray-400">
          State application fees and service charges by species
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
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

        <select
          value={yearFilter}
          onChange={(e) => setYearFilter(e.target.value)}
          className="rounded-lg border border-white/10 bg-gray-900 px-3 py-2 text-sm text-gray-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          <option value="all">All Years</option>
          {uniqueYears.map((year) => (
            <option key={year} value={year}>
              {year}
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
              invalidateCache("/api/v1/ops/fee-schedules");
              fetchFees();
            }}
            className="mt-2 text-sm font-medium text-blue-400 underline hover:text-blue-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Fee Table */}
      {fees.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-500">
            <DollarSign className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">
            No fee schedules found
          </h3>
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
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    State
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    Species
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    Residency
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    Fee Type
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-gray-400">
                    Fee Name
                  </th>
                  <th className="px-4 py-3 text-right font-medium text-gray-400">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-400">
                    Required
                  </th>
                  <th className="px-4 py-3 text-center font-medium text-gray-400">
                    Year
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {fees.map((fee) => (
                  <tr
                    key={fee.id}
                    className="transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {fee.stateName || fee.stateCode}
                    </td>
                    <td className="px-4 py-3 text-gray-300">{fee.species}</td>
                    <td className="px-4 py-3 text-gray-300">
                      {fee.residency === "resident" ? "Resident" : "Non-Resident"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-300">
                        {fee.feeType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-300">{fee.feeName}</td>
                    <td className="px-4 py-3 text-right font-medium text-emerald-400">
                      {formatCurrency(fee.amount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge
                        variant={fee.required ? "warning" : "default"}
                        size="sm"
                        className={
                          fee.required
                            ? "bg-amber-500/10 text-amber-400"
                            : "bg-gray-500/10 text-gray-400"
                        }
                      >
                        {fee.required ? "Required" : "Optional"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-gray-400">
                      {fee.year}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {fees.map((fee) => (
              <div
                key={fee.id}
                className="rounded-xl border border-white/10 bg-gray-900 p-4 space-y-2"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {fee.stateName || fee.stateCode} &mdash; {fee.species}
                    </p>
                    <p className="text-xs text-gray-400">
                      {fee.residency === "resident" ? "Resident" : "Non-Resident"}{" "}
                      &middot; {fee.year}
                    </p>
                  </div>
                  <span className="text-sm font-bold text-emerald-400">
                    {formatCurrency(fee.amount)}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span className="inline-block rounded bg-white/5 px-1.5 py-0.5 font-medium text-gray-300">
                    {fee.feeType}
                  </span>
                  <span>{fee.feeName}</span>
                  <Badge
                    variant={fee.required ? "warning" : "default"}
                    size="sm"
                    className={
                      fee.required
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-gray-500/10 text-gray-400"
                    }
                  >
                    {fee.required ? "Required" : "Optional"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
