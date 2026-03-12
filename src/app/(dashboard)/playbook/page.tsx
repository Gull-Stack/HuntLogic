"use client";

import { useState, useEffect } from "react";
import { PlaybookView } from "@/components/hunt/PlaybookView";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";
import type { PlaybookData } from "@/services/intelligence/types";

// Mock playbook for development
const mockPlaybook: PlaybookData = {
  id: "pb-001",
  version: 3,
  generatedAt: "2026-03-01T10:00:00Z",
  goalsSummary:
    "Multi-species western big game hunter focused on elk and mule deer with a balanced orientation. Budget-conscious with preference points in CO, WY, and MT.",
  profileSnapshot: {},
  executiveSummary:
    "Your 2026 strategy centers on a strong Colorado elk application this spring using your 3 preference points in Unit 61, giving you approximately 45% draw odds. Simultaneously, continue building Wyoming elk points (currently at 5) while taking advantage of Montana's general combo tag for an immediate hunting opportunity. Your point investment in Wyoming is tracking well and you should draw within 2-3 years. Consider adding an Arizona elk application as a long-term play with their generous bonus point system.",
  nearTerm: [
    {
      hunt: {
        stateId: "co-001",
        stateCode: "CO",
        stateName: "Colorado",
        speciesId: "elk-001",
        speciesSlug: "elk",
        speciesName: "Elk",
        huntUnitId: "co-unit-61",
        unitCode: "61",
        unitName: "Unit 61",
        publicLandPct: 65,
        terrainClass: "mountain",
        elevationMin: 7500,
        elevationMax: 11000,
        hasDraw: true,
        hasOtc: false,
        hasPoints: true,
        pointType: "preference",
        weaponTypes: ["rifle", "archery"],
        latestDrawRate: 0.45,
        latestMinPoints: 2,
        latestMaxPoints: 5,
        latestAvgPoints: 3,
        totalApplicants: 1200,
        totalTags: 540,
        latestSuccessRate: 0.32,
        trophyMetrics: null,
        tagType: "draw",
        seasonName: "2nd Rifle",
        seasonStart: "2026-10-15",
        seasonEnd: "2026-10-23",
        estimatedCost: { tag: 650, license: 100, points: 80, travel: 1200, gear: 300, total: 2330 },
        estimatedDriveHours: 8,
        filtersApplied: ["species", "state", "points"],
        factors: {
          draw_odds_score: 0.72,
          trophy_quality_score: 0.65,
          success_rate_score: 0.55,
          cost_efficiency_score: 0.7,
          access_score: 0.8,
          forecast_score: 0.6,
          personal_fit_score: 0.85,
          timeline_fit_score: 0.9,
        },
        weightsUsed: {
          draw_odds: 0.2,
          trophy_quality: 0.15,
          success_rate: 0.15,
          cost_efficiency: 0.15,
          access: 0.1,
          forecast: 0.1,
          personal_fit: 0.1,
          timeline_fit: 0.05,
        },
        compositeScore: 0.73,
        rank: 1,
        confidence: { score: 0.82, label: "high", basis: "3+ years of data" },
        timelineCategory: "this_year",
        recType: "apply_now",
      },
      rationale:
        "Unit 61 is an excellent match for your profile. With 3 preference points, you have a strong 45% chance of drawing this year. The unit offers 65% public land with good elk populations. Your balanced orientation aligns well with the unit's mix of trophy potential and reasonable success rates.",
      costEstimate: { tag: 650, license: 100, points: 80, travel: 1200, gear: 300, total: 2330 },
      timelineEstimate: { earliest: "2026", expected: "2026", latest: "2027" },
      confidence: { score: 0.82, label: "high", basis: "3+ years of data" },
      orientation: "balanced",
      status: "active",
    },
  ],
  midTerm: [
    {
      hunt: {
        stateId: "wy-001",
        stateCode: "WY",
        stateName: "Wyoming",
        speciesId: "elk-001",
        speciesSlug: "elk",
        speciesName: "Elk",
        huntUnitId: "wy-unit-100",
        unitCode: "100",
        unitName: "Area 100",
        publicLandPct: 45,
        terrainClass: "mountain",
        elevationMin: 6500,
        elevationMax: 10500,
        hasDraw: true,
        hasOtc: false,
        hasPoints: true,
        pointType: "preference",
        weaponTypes: ["rifle"],
        latestDrawRate: 0.15,
        latestMinPoints: 5,
        latestMaxPoints: 8,
        latestAvgPoints: 6,
        totalApplicants: 800,
        totalTags: 120,
        latestSuccessRate: 0.55,
        trophyMetrics: null,
        tagType: "draw",
        seasonName: "General",
        seasonStart: "2028-10-01",
        seasonEnd: "2028-10-31",
        estimatedCost: { tag: 800, license: 250, points: 150, travel: 1500, gear: 200, total: 2900 },
        estimatedDriveHours: 10,
        filtersApplied: ["species", "state", "points"],
        factors: {
          draw_odds_score: 0.35,
          trophy_quality_score: 0.75,
          success_rate_score: 0.7,
          cost_efficiency_score: 0.55,
          access_score: 0.6,
          forecast_score: 0.65,
          personal_fit_score: 0.8,
          timeline_fit_score: 0.7,
        },
        weightsUsed: {
          draw_odds: 0.2,
          trophy_quality: 0.15,
          success_rate: 0.15,
          cost_efficiency: 0.15,
          access: 0.1,
          forecast: 0.1,
          personal_fit: 0.1,
          timeline_fit: 0.05,
        },
        compositeScore: 0.62,
        rank: 3,
        confidence: { score: 0.7, label: "medium", basis: "Moderate data availability" },
        timelineCategory: "1-3_years",
        recType: "build_points",
      },
      rationale:
        "Wyoming Area 100 offers exceptional trophy potential with 55% success rates. Continue building preference points (currently at 5, need ~7-8). You should be able to draw within 2-3 years.",
      costEstimate: { tag: 800, license: 250, points: 150, travel: 1500, gear: 200, total: 2900 },
      timelineEstimate: { earliest: "2028", expected: "2029", latest: "2030" },
      confidence: { score: 0.7, label: "medium", basis: "Moderate data availability" },
      orientation: "balanced",
      status: "active",
    },
  ],
  longTerm: [],
  pointStrategy: [
    {
      stateId: "co-001",
      stateCode: "CO",
      stateName: "Colorado",
      speciesId: "elk-001",
      speciesName: "Elk",
      currentPoints: 3,
      pointType: "preference",
      recommendation: "apply_now",
      rationale: "You have enough points for a strong draw in your target units. Apply this year.",
      forecast: null,
      annualCost: 40,
      projectedYearsToTag: 1,
    },
    {
      stateId: "wy-001",
      stateCode: "WY",
      stateName: "Wyoming",
      speciesId: "elk-001",
      speciesName: "Elk",
      currentPoints: 5,
      pointType: "preference",
      recommendation: "build_points",
      rationale: "Continue building. You need 7-8 points for your target area. 2-3 more years of point purchases.",
      forecast: null,
      annualCost: 50,
      projectedYearsToTag: 3,
    },
  ],
  budgetAllocation: {
    totalBudget: 8000,
    allocations: [
      { category: "Applications & Tags", amount: 2500, description: "CO elk tag, WY point, MT combo" },
      { category: "Travel", amount: 2800, description: "Fuel, lodging for CO and MT hunts" },
      { category: "Point Purchases", amount: 700, description: "WY elk, AZ elk" },
      { category: "Gear & Equipment", amount: 1200, description: "Upgrades and replacements" },
      { category: "Reserve", amount: 800, description: "Emergency and opportunity fund" },
    ],
    unallocated: 0,
  },
  upcomingDeadlines: [
    {
      state: "Colorado",
      species: "Elk",
      deadlineType: "Application",
      date: "2026-04-01",
      actionRequired: "Submit primary application",
    },
  ],
  confidenceSummary: "High confidence based on 3+ years of historical data across all recommended units.",
  dataSourcesUsed: ["State wildlife agencies", "Draw statistics 2020-2025", "Harvest reports"],
  assumptions: ["Non-resident applicant", "Rifle hunter", "Average physical fitness"],
};

export default function PlaybookPage() {
  const [playbook, setPlaybook] = useState<PlaybookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileComplete] = useState(true);

  useEffect(() => {
    async function fetchPlaybook() {
      try {
        const res = await fetch("/api/v1/playbook");
        if (res.ok) {
          const data = await res.json();
          setPlaybook(data);
        } else if (res.status === 404) {
          setPlaybook(null);
        }
      } catch {
        // Dev mode: use mock data
        setPlaybook(mockPlaybook);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaybook();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/v1/playbook/refresh", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPlaybook(data);
      }
    } catch {
      // Dev: just simulate delay
      await new Promise((r) => setTimeout(r, 1500));
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-56 animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!profileComplete && !playbook) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
            Playbook
          </h1>
          <p className="mt-1 text-sm text-brand-sage">
            Your personalized multi-year hunting strategy
          </p>
        </div>
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="Complete Your Profile First"
          description="We need to know more about your hunting goals before we can build your strategy."
          actionLabel="Continue Setup"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          Playbook
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Your personalized multi-year hunting strategy
        </p>
      </div>

      <PlaybookView
        playbook={playbook}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
