"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { RecommendationCard } from "@/components/hunt/RecommendationCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { SkeletonList } from "@/components/ui/Skeleton";
import { Compass, SlidersHorizontal } from "lucide-react";
import type { RecommendationOutput } from "@/services/intelligence/types";

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

// Mock recommendations for development
function getMockRecommendations(): RecommendationOutput[] {
  return [
    {
      id: "rec-1",
      hunt: {
        stateId: "co-001", stateCode: "CO", stateName: "Colorado",
        speciesId: "elk-001", speciesSlug: "elk", speciesName: "Elk",
        huntUnitId: "u-61", unitCode: "61", unitName: "Unit 61",
        publicLandPct: 65, terrainClass: "mountain", elevationMin: 7500, elevationMax: 11000,
        hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference",
        weaponTypes: ["rifle", "archery"],
        latestDrawRate: 0.45, latestMinPoints: 2, latestMaxPoints: 5, latestAvgPoints: 3,
        totalApplicants: 1200, totalTags: 540, latestSuccessRate: 0.32,
        trophyMetrics: null, tagType: "draw", seasonName: "2nd Rifle",
        seasonStart: "2026-10-15", seasonEnd: "2026-10-23",
        estimatedCost: { tag: 650, license: 100, points: 80, travel: 1200, gear: 300, total: 2330 },
        estimatedDriveHours: 8, filtersApplied: ["species"],
        factors: { draw_odds_score: 0.72, trophy_quality_score: 0.65, success_rate_score: 0.55, cost_efficiency_score: 0.7, access_score: 0.8, forecast_score: 0.6, personal_fit_score: 0.85, timeline_fit_score: 0.9 },
        weightsUsed: { draw_odds: 0.2, trophy_quality: 0.15, success_rate: 0.15, cost_efficiency: 0.15, access: 0.1, forecast: 0.1, personal_fit: 0.1, timeline_fit: 0.05 },
        compositeScore: 0.73, rank: 1,
        confidence: { score: 0.82, label: "high", basis: "3+ years data" },
        timelineCategory: "this_year", recType: "apply_now",
      },
      rationale: "Unit 61 is an excellent match for your profile. With 3 preference points, you have a strong 45% chance of drawing. 65% public land with good elk populations.",
      costEstimate: { tag: 650, license: 100, points: 80, travel: 1200, gear: 300, total: 2330 },
      timelineEstimate: { earliest: "2026", expected: "2026", latest: "2027" },
      confidence: { score: 0.82, label: "high", basis: "3+ years data" },
      orientation: "balanced", status: "active",
    },
    {
      id: "rec-2",
      hunt: {
        stateId: "mt-001", stateCode: "MT", stateName: "Montana",
        speciesId: "md-001", speciesSlug: "mule-deer", speciesName: "Mule Deer",
        huntUnitId: "mt-u-410", unitCode: "410", unitName: "HD 410",
        publicLandPct: 55, terrainClass: "foothills", elevationMin: 5000, elevationMax: 8000,
        hasDraw: false, hasOtc: true, hasPoints: false, pointType: null,
        weaponTypes: ["rifle"],
        latestDrawRate: null, latestMinPoints: null, latestMaxPoints: null, latestAvgPoints: null,
        totalApplicants: null, totalTags: null, latestSuccessRate: 0.42,
        trophyMetrics: null, tagType: "otc", seasonName: "General",
        seasonStart: "2026-10-25", seasonEnd: "2026-11-29",
        estimatedCost: { tag: 250, license: 215, points: 0, travel: 800, gear: 100, total: 1365 },
        estimatedDriveHours: 6, filtersApplied: ["species"],
        factors: { draw_odds_score: 1.0, trophy_quality_score: 0.45, success_rate_score: 0.65, cost_efficiency_score: 0.85, access_score: 0.7, forecast_score: 0.5, personal_fit_score: 0.75, timeline_fit_score: 1.0 },
        weightsUsed: { draw_odds: 0.2, trophy_quality: 0.15, success_rate: 0.15, cost_efficiency: 0.15, access: 0.1, forecast: 0.1, personal_fit: 0.1, timeline_fit: 0.05 },
        compositeScore: 0.71, rank: 2,
        confidence: { score: 0.75, label: "high", basis: "OTC availability confirmed" },
        timelineCategory: "this_year", recType: "otc_opportunity",
      },
      rationale: "Montana HD 410 is available over-the-counter with no draw needed. Great opportunity for an immediate hunt with solid 42% success rates and reasonable costs.",
      costEstimate: { tag: 250, license: 215, points: 0, travel: 800, gear: 100, total: 1365 },
      timelineEstimate: { earliest: "2026", expected: "2026", latest: "2026" },
      confidence: { score: 0.75, label: "high", basis: "OTC availability confirmed" },
      orientation: "opportunity", status: "active",
    },
    {
      id: "rec-3",
      hunt: {
        stateId: "az-001", stateCode: "AZ", stateName: "Arizona",
        speciesId: "elk-001", speciesSlug: "elk", speciesName: "Elk",
        huntUnitId: "az-u-6a", unitCode: "6A", unitName: "Unit 6A",
        publicLandPct: 80, terrainClass: "plateau", elevationMin: 6000, elevationMax: 9000,
        hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus",
        weaponTypes: ["rifle", "archery", "muzzleloader"],
        latestDrawRate: 0.08, latestMinPoints: 8, latestMaxPoints: 20, latestAvgPoints: 14,
        totalApplicants: 2500, totalTags: 200, latestSuccessRate: 0.48,
        trophyMetrics: null, tagType: "draw", seasonName: "Fall",
        seasonStart: "2030-11-01", seasonEnd: "2030-11-14",
        estimatedCost: { tag: 800, license: 160, points: 500, travel: 1800, gear: 200, total: 3460 },
        estimatedDriveHours: 12, filtersApplied: ["species"],
        factors: { draw_odds_score: 0.2, trophy_quality_score: 0.85, success_rate_score: 0.68, cost_efficiency_score: 0.45, access_score: 0.85, forecast_score: 0.55, personal_fit_score: 0.7, timeline_fit_score: 0.4 },
        weightsUsed: { draw_odds: 0.2, trophy_quality: 0.15, success_rate: 0.15, cost_efficiency: 0.15, access: 0.1, forecast: 0.1, personal_fit: 0.1, timeline_fit: 0.05 },
        compositeScore: 0.56, rank: 5,
        confidence: { score: 0.55, label: "medium", basis: "Long timeline projection" },
        timelineCategory: "5+_years", recType: "build_points",
      },
      rationale: "Arizona Unit 6A is a trophy-quality elk unit with 80% public land. Low draw odds currently but bonus point system means every year you apply increases your chances. Start building points now for a premium hunt in 5+ years.",
      costEstimate: { tag: 800, license: 160, points: 500, travel: 1800, gear: 200, total: 3460 },
      timelineEstimate: { earliest: "2030", expected: "2032", latest: "2035" },
      confidence: { score: 0.55, label: "medium", basis: "Long timeline projection" },
      orientation: "trophy", status: "active",
    },
  ];
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<RecommendationOutput[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterValue>("all");
  const [activeSort, setActiveSort] = useState<SortValue>("best_match");
  const [showSortMenu, setShowSortMenu] = useState(false);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        const res = await fetch("/api/v1/recommendations");
        if (res.ok) {
          const data = await res.json();
          setRecommendations(data.data || data);
        }
      } catch {
        // Dev mode: use mock data
        setRecommendations(getMockRecommendations());
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
          <div className="h-7 w-52 animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-64 animate-pulse rounded-lg bg-brand-sage/10" />
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
              onSave={(id) => console.log("Save", id)}
              onDismiss={(id) =>
                setRecommendations((prev) =>
                  prev.filter((r) => r.id !== id)
                )
              }
            />
          ))}
        </div>
      )}

      {/* Load more */}
      {sortedRecs.length > 0 && sortedRecs.length >= 3 && (
        <div className="text-center pt-2">
          <button className="text-sm font-medium text-brand-sage hover:text-brand-forest transition-colors">
            Load more recommendations
          </button>
        </div>
      )}
    </div>
  );
}
