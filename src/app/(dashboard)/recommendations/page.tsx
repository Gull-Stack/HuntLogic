"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { RecommendationCard } from "@/components/hunt/RecommendationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Compass, SlidersHorizontal } from "lucide-react";
import type { RecommendationOutput } from "@/services/intelligence/types";
import { fetchWithCache, invalidateCache } from "@/lib/api/cache";

type FilterValue = "all" | "this_year" | "trophy" | "opportunity" | "by_state";
type SortValue = "best_match" | "draw_odds" | "cost" | "timeline";

const filters: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "this_year", label: "This Year" },
  { value: "trophy", label: "Trophy" },
  { value: "opportunity", label: "Opportunity" },
  { value: "by_state", label: "By State" },
];

const sortOptions: { value: SortValue; label: string }[] = [
  { value: "best_match", label: "Best Match" },
  { value: "draw_odds", label: "Draw Odds" },
  { value: "cost", label: "Cost" },
  { value: "timeline", label: "Timeline" },
];

async function submitFeedback(
  recommendationId: string,
  action: "save" | "dismiss" | "like" | "dislike"
): Promise<boolean> {
  try {
    const res = await fetch(`/api/v1/recommendations/${recommendationId}/feedback`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    return res.ok;
  } catch {
    console.error("[recommendations] Failed to submit feedback");
    return false;
  }
}

export default function RecommendationsPage() {
  const router = useRouter();
  const [recommendations, setRecommendations] = useState<RecommendationOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [activeSort, setActiveSort] = useState<SortValue>("best_match");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const handleApplyForMe = useCallback(
    async (recommendation: RecommendationOutput) => {
      try {
        // 1. Check for existing draft orders
        const draftsRes = await fetch("/api/v1/concierge/orders?status=draft");
        if (!draftsRes.ok) throw new Error("Failed to fetch draft orders");
        const draftsJson = await draftsRes.json();
        const drafts = draftsJson.data?.orders ?? [];

        let orderId: string;

        if (drafts.length > 0) {
          // Use existing draft
          orderId = drafts[0].id;
        } else {
          // 2. Create a new draft order
          const createRes = await fetch("/api/v1/concierge/orders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ year: new Date().getFullYear() }),
          });
          if (!createRes.ok) throw new Error("Failed to create order");
          const createJson = await createRes.json();
          orderId = createJson.data?.order?.id ?? createJson.order?.id;
        }

        // 3. Add the recommendation as an item
        // Default to nonresident since residency isn't on the recommendation —
        // user can change in the cart before checkout.
        const addItemRes = await fetch(
          `/api/v1/concierge/orders/${orderId}/items`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stateId: recommendation.hunt.stateId,
              speciesId: recommendation.hunt.speciesId,
              residency: "nonresident",
              recommendationId: recommendation.id,
            }),
          }
        );
        if (!addItemRes.ok) throw new Error("Failed to add item to order");

        // 4. Navigate to cart
        router.push("/orders/cart");
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        console.error("[recommendations] Apply for me failed:", message);
        alert(`Could not add to cart: ${message}`);
      }
    },
    [router]
  );

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const data = await fetchWithCache<{ recommendations: RecommendationOutput[] }>(
          "/api/v1/recommendations",
          { staleMs: 30_000 }
        );
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error("[recommendations] Failed to fetch:", err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchRecommendations();
  }, []);

  const filteredRecs = recommendations.filter((rec) => {
    switch (activeFilter) {
      case "this_year":
        return rec.hunt.timelineCategory === "this_year";
      case "trophy":
        return rec.orientation === "trophy";
      case "opportunity":
        return rec.orientation === "opportunity" || rec.hunt.recType === "otc_opportunity";
      default:
        return true;
    }
  });

  const sortedRecs = [...filteredRecs].sort((a, b) => {
    switch (activeSort) {
      case "draw_odds":
        return (b.hunt.latestDrawRate ?? 0) - (a.hunt.latestDrawRate ?? 0);
      case "cost":
        return a.costEstimate.total - b.costEstimate.total;
      case "timeline": {
        const order = { this_year: 0, "1-3_years": 1, "3-5_years": 2, "5+_years": 3 };
        return (order[a.hunt.timelineCategory] ?? 4) - (order[b.hunt.timelineCategory] ?? 4);
      }
      default:
        return b.hunt.compositeScore - a.hunt.compositeScore;
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-52 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-64 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          Recommendations
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          AI-powered hunt recommendations tailored to your profile
        </p>
      </div>

      {/* Filter + sort bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 flex-1 scrollbar-hide">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors min-h-[36px]",
                activeFilter === f.value
                  ? "bg-brand-forest text-brand-cream dark:bg-brand-sage"
                  : "bg-brand-sage/10 text-brand-sage hover:bg-brand-sage/20 dark:bg-brand-sage/20"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Sort button */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-sage/10 text-brand-sage transition-colors hover:bg-brand-sage/20"
            aria-label="Sort options"
          >
            <SlidersHorizontal className="h-4 w-4" />
          </button>

          {showSortMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowSortMenu(false)}
              />
              <div className="absolute right-0 top-11 z-20 w-44 rounded-xl border border-brand-sage/10 bg-white p-1 shadow-lg dark:bg-brand-bark dark:border-brand-sage/20">
                {sortOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setActiveSort(opt.value);
                      setShowSortMenu(false);
                    }}
                    className={cn(
                      "flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors min-h-[40px]",
                      activeSort === opt.value
                        ? "bg-brand-forest/10 text-brand-forest font-medium dark:bg-brand-sage/20 dark:text-brand-cream"
                        : "text-brand-bark hover:bg-brand-sage/5 dark:text-brand-cream/70"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recommendations grid */}
      {sortedRecs.length === 0 ? (
        <EmptyState
          icon={<Compass className="h-8 w-8" />}
          title="No recommendations found"
          description="Try adjusting your filters or complete your profile for personalized recommendations."
          actionLabel="Clear Filters"
          onAction={() => setActiveFilter("all")}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {sortedRecs.map((rec) => (
            <RecommendationCard
              key={rec.id}
              recommendation={rec}
              onApplyForMe={handleApplyForMe}
              onSave={(id) => {
                submitFeedback(id, "save").then(() => invalidateCache("/api/v1/recommendations"));
                setRecommendations((prev) =>
                  prev.map((r) =>
                    r.id === id
                      ? { ...r, status: r.status === "saved" ? "active" : "saved" }
                      : r
                  )
                );
              }}
              onDismiss={(id) => {
                submitFeedback(id, "dismiss").then(() => invalidateCache("/api/v1/recommendations"));
                setRecommendations((prev) =>
                  prev.filter((r) => r.id !== id)
                );
              }}
            />
          ))}
        </div>
      )}

      {/* TODO: Add pagination when API supports offset/limit */}
    </div>
  );
}
