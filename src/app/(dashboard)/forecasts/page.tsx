"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PointCreepGraph } from "@/components/hunt/PointCreepGraph";
import { DrawOddsChart } from "@/components/hunt/DrawOddsChart";
import { SkeletonList } from "@/components/ui/Skeleton";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
} from "lucide-react";

interface ForecastSelection {
  state: string;
  species: string;
}

const states = [
  { code: "CO", name: "Colorado" },
  { code: "WY", name: "Wyoming" },
  { code: "MT", name: "Montana" },
  { code: "AZ", name: "Arizona" },
  { code: "NM", name: "New Mexico" },
  { code: "UT", name: "Utah" },
  { code: "NV", name: "Nevada" },
  { code: "ID", name: "Idaho" },
];

const speciesList = [
  { code: "elk", name: "Elk" },
  { code: "mule_deer", name: "Mule Deer" },
  { code: "antelope", name: "Pronghorn" },
  { code: "moose", name: "Moose" },
  { code: "sheep", name: "Bighorn Sheep" },
];

// Mock forecast data
const mockForecastData = {
  pointCreep: {
    historicalData: [
      { year: 2020, points: 2 },
      { year: 2021, points: 3 },
      { year: 2022, points: 3 },
      { year: 2023, points: 4 },
      { year: 2024, points: 4 },
      { year: 2025, points: 5 },
    ],
    projectedData: [
      { year: 2026, points: 5 },
      { year: 2027, points: 6 },
      { year: 2028, points: 6 },
      { year: 2029, points: 7 },
    ],
    userPoints: 3,
    estimatedDrawYear: 2028,
  },
  drawOdds: {
    atCurrentPoints: 15,
    trend: [
      { year: 2020, value: 25 },
      { year: 2021, value: 22 },
      { year: 2022, value: 18 },
      { year: 2023, value: 16 },
      { year: 2024, value: 15 },
      { year: 2025, value: 14 },
    ],
  },
  roi: {
    recommendation: "buy" as const,
    costPerOpportunity: 2800,
    projectedYears: 3,
    totalInvestment: 450,
    explanation:
      "Continue building points. Your investment of $50/year in preference points has strong projected returns. At current point creep rates, you should draw within 3 years with a total point investment of approximately $450. The hunt quality in your target units justifies this timeline.",
  },
  trend: "rising" as const,
};

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
  const [selection, setSelection] = useState<ForecastSelection>({
    state: "CO",
    species: "elk",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [forecast] = useState(mockForecastData);

  const handleSelectionChange = (field: keyof ForecastSelection, value: string) => {
    setSelection((prev) => ({ ...prev, [field]: value }));
    // Simulate loading
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 800);
  };

  const TrendIcon = trendIcons[forecast.trend] || Minus;
  const roiInfo = roiColors[forecast.roi.recommendation] ?? roiColors.hold!;

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
            {states.map((s) => (
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
            {speciesList.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
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

              <div className="mt-4 grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-brand-sage/5 p-3 text-center dark:bg-brand-sage/10">
                  <p className="text-xs text-brand-sage">Year 1</p>
                  <p className="text-lg font-bold text-brand-bark dark:text-brand-cream">15%</p>
                </div>
                <div className="rounded-lg bg-brand-sage/5 p-3 text-center dark:bg-brand-sage/10">
                  <p className="text-xs text-brand-sage">Year 3</p>
                  <p className="text-lg font-bold text-brand-bark dark:text-brand-cream">42%</p>
                </div>
                <div className="rounded-lg bg-brand-sage/5 p-3 text-center dark:bg-brand-sage/10">
                  <p className="text-xs text-brand-sage">Year 5</p>
                  <p className="text-lg font-bold text-brand-bark dark:text-brand-cream">78%</p>
                </div>
              </div>
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
              <div className="rounded-xl bg-brand-forest/5 p-4 dark:bg-brand-sage/10">
                <h4 className="flex items-center gap-1.5 text-sm font-semibold text-brand-bark dark:text-brand-cream mb-2">
                  <Sparkles className="h-4 w-4 text-brand-sunset" />
                  What this means for you
                </h4>
                <p className="text-sm leading-relaxed text-brand-sage">
                  {forecast.roi.explanation}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
