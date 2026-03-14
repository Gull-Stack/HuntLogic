"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { PointCreepGraph } from "@/components/hunt/PointCreepGraph";
import { DrawOddsChart } from "@/components/hunt/DrawOddsChart";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  BarChart3,
} from "lucide-react";
import { fetchWithCache } from "@/lib/api/cache";

interface ForecastSelection {
  state: string;
  species: string;
}

interface ForecastData {
  pointCreep: {
    historicalData: { year: number; points: number }[];
    projectedData: { year: number; points: number }[];
    userPoints: number;
    estimatedDrawYear: number;
  };
  drawOdds: {
    atCurrentPoints: number;
    trend: { year: number; value: number }[];
  };
  roi: {
    recommendation: string;
    costPerOpportunity: number;
    projectedYears: number;
    totalInvestment: number;
    explanation: string;
  };
  trend: string;
}

const roiColors: Record<string, { variant: "success" | "info" | "warning" | "danger"; label: string }> = {
  strong_buy: { variant: "success", label: "Strong Buy" },
  buy: { variant: "success", label: "Buy" },
  hold: { variant: "warning", label: "Hold" },
  consider_exit: { variant: "danger", label: "Consider Exit" },
  exit: { variant: "danger", label: "Exit" },
};

const trendIcons: Record<string, typeof TrendingUp> = {
  rising: TrendingUp,
  stable: Minus,
  declining: TrendingDown,
};

export default function ForecastsPage() {
  const [availableStates, setAvailableStates] = useState<{ code: string; name: string }[]>([]);
  const [availableSpecies, setAvailableSpecies] = useState<{ slug: string; name: string }[]>([]);
  const [selection, setSelection] = useState<ForecastSelection>({
    state: "",
    species: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [forecast, setForecast] = useState<ForecastData | null>(null);

  // Fetch available states and species on mount (rarely changes — 120s stale)
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [statesData, speciesData] = await Promise.all([
          fetchWithCache<{ states?: { code: string; name: string }[]; data?: { code: string; name: string }[] }>(
            "/api/v1/regulations",
            { staleMs: 120_000 }
          ),
          fetchWithCache<{ species?: { slug: string; name: string }[]; data?: { slug: string; name: string }[] }>(
            "/api/v1/species",
            { staleMs: 120_000 }
          ),
        ]);

        const statesList = statesData.states || statesData.data || [];
        setAvailableStates(statesList.map((s) => ({ code: s.code, name: s.name })));

        const speciesList = speciesData.species || speciesData.data || [];
        setAvailableSpecies(speciesList.map((s) => ({ slug: s.slug, name: s.name })));
      } catch (err) {
        console.error("[forecasts] Failed to fetch dropdown options:", err);
      } finally {
        setIsInitializing(false);
      }
    }
    fetchOptions();
  }, []);

  // Fetch forecast data when selection changes
  useEffect(() => {
    if (!selection.state || !selection.species) {
      setForecast(null);
      return;
    }

    async function fetchForecast() {
      setIsLoading(true);
      try {
        const [pointCreepData, roiData] = await Promise.all([
          fetchWithCache<{ forecast?: { pointCreep?: ForecastData["pointCreep"]; drawOdds?: ForecastData["drawOdds"]; trend?: string } }>(
            `/api/v1/forecasts?type=point-creep&state=${selection.state}&species=${selection.species}`,
            { staleMs: 60_000 }
          ),
          fetchWithCache<{ assessment?: ForecastData["roi"] }>(
            `/api/v1/forecasts?type=roi&state=${selection.state}&species=${selection.species}`,
            { staleMs: 60_000 }
          ),
        ]);

        setForecast({
          pointCreep: pointCreepData.forecast?.pointCreep ?? pointCreepData.forecast as unknown as ForecastData["pointCreep"] ?? {
            historicalData: [],
            projectedData: [],
            userPoints: 0,
            estimatedDrawYear: 0,
          },
          drawOdds: pointCreepData.forecast?.drawOdds ?? {
            atCurrentPoints: 0,
            trend: [],
          },
          roi: roiData.assessment ?? {
            recommendation: "hold",
            costPerOpportunity: 0,
            projectedYears: 0,
            totalInvestment: 0,
            explanation: "",
          },
          trend: pointCreepData.forecast?.trend ?? "stable",
        });
      } catch (err) {
        console.error("[forecasts] Failed to fetch forecast:", err);
        setForecast(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchForecast();
  }, [selection.state, selection.species]);

  const handleSelectionChange = (field: keyof ForecastSelection, value: string) => {
    setSelection((prev) => ({ ...prev, [field]: value }));
  };

  const TrendIcon = forecast ? (trendIcons[forecast.trend] || Minus) : Minus;
  const roiInfo = forecast ? (roiColors[forecast.roi.recommendation] ?? roiColors.hold!) : roiColors.hold!;

  if (isInitializing) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-56 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
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
          Forecasts
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Draw odds predictions and trend analysis
        </p>
      </div>

      {/* Selection dropdowns */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
            State
          </label>
          <select
            value={selection.state}
            onChange={(e) => handleSelectionChange("state", e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-base text-brand-bark focus:outline-none focus:ring-2 focus:ring-brand-forest dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30"
          >
            <option value="">Select state</option>
            {availableStates.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
            Species
          </label>
          <select
            value={selection.species}
            onChange={(e) => handleSelectionChange("species", e.target.value)}
            className="w-full min-h-[44px] rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-base text-brand-bark focus:outline-none focus:ring-2 focus:ring-brand-forest dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30"
          >
            <option value="">Select species</option>
            {availableSpecies.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : !forecast ? (
        <EmptyState
          icon={<BarChart3 className="h-8 w-8" />}
          title="No forecast data"
          description={
            !selection.state || !selection.species
              ? "Select a state and species to view draw odds forecasts."
              : "No forecast data is available for the selected state and species."
          }
        />
      ) : (
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {/* Point Creep Trend */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-brand-bark dark:text-brand-cream">
                  Point Creep Trend
                </h3>
                <div className="flex items-center gap-1">
                  <TrendIcon
                    className={cn(
                      "h-4 w-4",
                      forecast.trend === "rising"
                        ? "text-red-500"
                        : forecast.trend === "declining"
                          ? "text-green-500"
                          : "text-amber-500"
                    )}
                  />
                  <span
                    className={cn(
                      "text-xs font-medium capitalize",
                      forecast.trend === "rising"
                        ? "text-red-500"
                        : forecast.trend === "declining"
                          ? "text-green-500"
                          : "text-amber-500"
                    )}
                  >
                    {forecast.trend}
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <PointCreepGraph
                historicalData={forecast.pointCreep.historicalData}
                projectedData={forecast.pointCreep.projectedData}
                userPoints={forecast.pointCreep.userPoints}
                estimatedDrawYear={forecast.pointCreep.estimatedDrawYear}
              />
            </CardContent>
          </Card>

          {/* Draw Odds at Your Point Level */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-brand-bark dark:text-brand-cream">
                Draw Odds at Your Point Level
              </h3>
            </CardHeader>
            <CardContent>
              <DrawOddsChart
                percentage={forecast.drawOdds.atCurrentPoints}
                label={`With ${forecast.pointCreep.userPoints} preference points`}
                trend={forecast.drawOdds.trend}
              />
            </CardContent>
          </Card>

          {/* ROI Assessment */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-brand-bark dark:text-brand-cream">
                  ROI Assessment
                </h3>
                <Badge variant={roiInfo.variant} size="md">
                  {roiInfo.label}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="rounded-lg bg-brand-sage/5 p-3 text-center dark:bg-brand-sage/10">
                  <p className="text-xs text-brand-sage">Cost/Opportunity</p>
                  <p className="text-lg font-bold text-brand-bark dark:text-brand-cream">
                    ${forecast.roi.costPerOpportunity.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-brand-sage/5 p-3 text-center dark:bg-brand-sage/10">
                  <p className="text-xs text-brand-sage">Years to Draw</p>
                  <p className="text-lg font-bold text-brand-bark dark:text-brand-cream">
                    ~{forecast.roi.projectedYears}
                  </p>
                </div>
                <div className="rounded-lg bg-brand-sage/5 p-3 text-center dark:bg-brand-sage/10">
                  <p className="text-xs text-brand-sage">Total Investment</p>
                  <p className="text-lg font-bold text-brand-bark dark:text-brand-cream">
                    ${forecast.roi.totalInvestment}
                  </p>
                </div>
              </div>

              {/* AI explanation */}
              {forecast.roi.explanation && (
                <div className="rounded-xl bg-brand-forest/5 p-4 dark:bg-brand-sage/10">
                  <h4 className="flex items-center gap-1.5 text-sm font-semibold text-brand-bark dark:text-brand-cream mb-2">
                    <Sparkles className="h-4 w-4 text-brand-sunset" />
                    What this means for you
                  </h4>
                  <p className="text-sm leading-relaxed text-brand-sage">
                    {forecast.roi.explanation}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
