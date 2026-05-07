"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { getPointTypesForState } from "@/lib/data/state-point-systems";
import { Plus, Trash2, Play, Trophy, DollarSign, Clock } from "lucide-react";

interface ScenarioInput {
  stateCode: string;
  speciesSlug: string;
  unitCode: string;
  currentPoints: number;
  strategy: "preference" | "bonus" | "random";
}

interface SimulationResult {
  scenario: ScenarioInput;
  expectedDrawYear: number;
  probabilityCurve: { year: number; cumulativeProbability: number }[];
  expectedTotalCost: number;
  confidenceInterval: { low: number; high: number };
  recommendedStrategy: string;
}

interface ComparisonResult {
  results: SimulationResult[];
  bestBySpeed: number;
  bestByCost: number;
  bestByOdds: number;
  summary: string;
}

interface StateOption {
  code: string;
  name: string;
}

interface SpeciesOption {
  slug: string;
  name: string;
  commonName?: string;
}

const emptyScenario = (): ScenarioInput => ({
  stateCode: "",
  speciesSlug: "",
  unitCode: "",
  currentPoints: 0,
  strategy: "preference",
});

const STRATEGY_LABELS: Record<ScenarioInput["strategy"], string> = {
  preference: "Preference",
  bonus: "Bonus",
  random: "Random",
};

function normalizePointType(pointType: string): ScenarioInput["strategy"] {
  if (pointType === "bonus" || pointType === "weighted") return "bonus";
  if (pointType === "none") return "random";
  return "preference";
}

function getAvailableStrategies(stateCode: string): ScenarioInput["strategy"][] {
  if (!stateCode) return ["preference", "bonus", "random"];

  const normalized = Array.from(
    new Set(getPointTypesForState(stateCode).map(normalizePointType))
  );

  return normalized.length > 0 ? normalized : ["preference", "bonus", "random"];
}

export default function SimulationPage() {
  const [scenarios, setScenarios] = useState<ScenarioInput[]>([emptyScenario()]);
  const [results, setResults] = useState<ComparisonResult | null>(null);
  const [running, setRunning] = useState(false);
  const [statesOptions, setStatesOptions] = useState<StateOption[]>([]);
  const [speciesOptions, setSpeciesOptions] = useState<SpeciesOption[]>([]);

  const fetchOptions = useCallback(async () => {
    try {
      const [statesRes, speciesRes] = await Promise.all([
        fetch("/api/v1/explore/states"),
        fetch("/api/v1/explore/species"),
      ]);
      if (statesRes.ok) {
        const data = await statesRes.json();
        setStatesOptions(data.states ?? []);
      }
      if (speciesRes.ok) {
        const data = await speciesRes.json();
        setSpeciesOptions(data.species ?? []);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  const addScenario = () => {
    if (scenarios.length < 3) {
      setScenarios([...scenarios, emptyScenario()]);
    }
  };

  const removeScenario = (idx: number) => {
    if (scenarios.length > 1) {
      setScenarios(scenarios.filter((_, i) => i !== idx));
    }
  };

  const updateScenario = (idx: number, field: keyof ScenarioInput, value: string | number) => {
    setScenarios(
      scenarios.map((s, i) => {
        if (i !== idx) return s;

        const next = { ...s, [field]: value } as ScenarioInput;

        if (field === "stateCode") {
          const availableStrategies = getAvailableStrategies(String(value));
          if (!availableStrategies.includes(next.strategy)) {
            next.strategy = availableStrategies[0] ?? "preference";
          }
        }

        return next;
      })
    );
  };

  const runSimulation = async () => {
    const validScenarios = scenarios.filter(
      (s) => s.stateCode && s.speciesSlug
    );
    if (validScenarios.length === 0) return;

    setRunning(true);
    setResults(null);
    try {
      const res = await fetch("/api/v1/simulation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarios: validScenarios, yearsForward: 10 }),
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      }
    } catch {
      // Silent fail
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          What If Simulator
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Compare draw strategies with 10,000 Monte Carlo simulations per scenario
        </p>
      </div>

      {/* Scenario Builder */}
      <div className="space-y-4">
        {scenarios.map((scenario, idx) => {
          const availableStrategies = getAvailableStrategies(scenario.stateCode);
          const shouldShowStrategySelector = availableStrategies.length > 1;

          return (
            <div
              key={idx}
              className="rounded-xl border border-brand-sage/10 bg-white p-4 shadow-sm dark:border-brand-sage/20 dark:bg-brand-bark"
            >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                Scenario {idx + 1}
              </h3>
              {scenarios.length > 1 && (
                <button
                  onClick={() => removeScenario(idx)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <select
                value={scenario.stateCode}
                onChange={(e) => updateScenario(idx, "stateCode", e.target.value)}
                className="min-h-[44px] w-full appearance-none rounded-[10px] border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
              >
                <option value="">State...</option>
                {statesOptions.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </select>

              <select
                value={scenario.speciesSlug}
                onChange={(e) => updateScenario(idx, "speciesSlug", e.target.value)}
                className="min-h-[44px] w-full appearance-none rounded-[10px] border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
              >
                <option value="">Species...</option>
                {speciesOptions.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.name ?? s.commonName}
                  </option>
                ))}
              </select>

              <input
                type="number"
                value={scenario.currentPoints}
                onChange={(e) =>
                  updateScenario(idx, "currentPoints", parseInt(e.target.value) || 0)
                }
                min={0}
                placeholder="Points"
                className="min-h-[44px] w-full rounded-[10px] border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
              />

              {shouldShowStrategySelector ? (
                <select
                  value={scenario.strategy}
                  onChange={(e) =>
                    updateScenario(idx, "strategy", e.target.value)
                  }
                  className="min-h-[44px] w-full appearance-none rounded-[10px] border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
                >
                  {availableStrategies.map((strategy) => (
                    <option key={strategy} value={strategy}>
                      {STRATEGY_LABELS[strategy]}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex min-h-[44px] items-center rounded-[10px] border border-brand-sage/20 bg-brand-sage/5 px-3 py-2 text-sm text-brand-sage dark:border-brand-sage/30 dark:bg-brand-sage/10 dark:text-brand-cream/80">
                  {scenario.stateCode
                    ? `${STRATEGY_LABELS[availableStrategies[0] ?? "preference"]} points`
                    : "Point system auto-detected"}
                </div>
              )}

              <input
                type="text"
                value={scenario.unitCode}
                onChange={(e) => updateScenario(idx, "unitCode", e.target.value)}
                placeholder="Unit (opt)"
                className="min-h-[44px] w-full rounded-[10px] border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark placeholder:text-brand-sage/50 dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
              />
            </div>
            {scenario.stateCode && !shouldShowStrategySelector && (
              <p className="mt-2 text-xs text-brand-sage">
                Point type is locked by state for this scenario.
              </p>
            )}
            </div>
          );
        })}

        <div className="flex gap-3">
          {scenarios.length < 3 && (
            <button
              onClick={addScenario}
              className="flex min-h-[44px] items-center gap-2 rounded-[8px] border border-brand-sage/20 px-4 py-2 text-sm font-medium text-brand-sage transition-colors hover:bg-brand-sage/5 dark:border-brand-sage/30"
            >
              <Plus className="h-4 w-4" />
              Add Scenario
            </button>
          )}

          <button
            onClick={runSimulation}
            disabled={running || scenarios.every((s) => !s.stateCode || !s.speciesSlug)}
            className="flex min-h-[44px] items-center gap-2 rounded-[8px] bg-gradient-cta px-6 py-2 text-sm font-semibold text-white transition-all hover:shadow-md disabled:opacity-50 motion-safe:hover:-translate-y-0.5"
          >
            <Play className="h-4 w-4" />
            {running ? "Running 10,000 simulations..." : "Run Simulation"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {running && (
        <div className="space-y-4">
          {scenarios.map((_, idx) => (
            <div
              key={idx}
              className="h-48 rounded-xl bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20"
            />
          ))}
        </div>
      )}

      {/* Results */}
      {results && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="rounded-xl border-2 border-brand-forest/20 bg-brand-forest/5 p-4 dark:border-brand-sage/30 dark:bg-brand-sage/10">
            <h3 className="text-sm font-semibold text-brand-forest dark:text-brand-cream">
              Best Strategy
            </h3>
            <p className="mt-1 text-sm text-brand-bark dark:text-brand-cream/80">
              {results.summary}
            </p>
          </div>

          {/* Result Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.results.map((r, idx) => (
              <div
                key={idx}
                className={cn(
                  "rounded-xl border bg-white p-5 shadow-sm dark:bg-brand-bark",
                  idx === results.bestBySpeed
                    ? "border-brand-forest dark:border-brand-sage"
                    : "border-brand-sage/10 dark:border-brand-sage/20"
                )}
              >
                {/* Header */}
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xs font-medium uppercase tracking-wider text-brand-sage">
                    Scenario {idx + 1}
                  </span>
                  <div className="flex gap-1">
                    {idx === results.bestBySpeed && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Fastest
                      </span>
                    )}
                    {idx === results.bestByCost && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                        Cheapest
                      </span>
                    )}
                  </div>
                </div>

                <p className="mb-4 text-sm font-medium text-brand-bark dark:text-brand-cream">
                  {r.scenario.stateCode} — {r.scenario.speciesSlug} ({r.scenario.strategy})
                </p>

                {/* Big number */}
                <div className="mb-4 text-center">
                  <p className="text-4xl font-bold text-brand-forest dark:text-brand-cream">
                    {r.expectedDrawYear}
                  </p>
                  <p className="text-xs text-brand-sage">Expected Draw Year</p>
                </div>

                {/* Stats */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-brand-sage">
                      <DollarSign className="h-3.5 w-3.5" /> Total Cost
                    </span>
                    <span className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                      ~${r.expectedTotalCost.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-brand-sage">
                      <Clock className="h-3.5 w-3.5" /> Confidence
                    </span>
                    <span className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                      {r.confidenceInterval.low}–{r.confidenceInterval.high}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs text-brand-sage">
                      <Trophy className="h-3.5 w-3.5" /> 5-Year Odds
                    </span>
                    <span className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                      {Math.round(
                        (r.probabilityCurve[4]?.cumulativeProbability ?? 0) * 100
                      )}
                      %
                    </span>
                  </div>
                </div>

                {/* Probability Curve (mini chart) */}
                <div className="mt-4">
                  <p className="mb-1 text-xs text-brand-sage">
                    Cumulative Probability
                  </p>
                  <svg
                    viewBox="0 0 200 60"
                    className="w-full"
                    preserveAspectRatio="none"
                  >
                    <polyline
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-brand-forest dark:text-brand-sage"
                      points={r.probabilityCurve
                        .map(
                          (p, i) =>
                            `${(i / (r.probabilityCurve.length - 1)) * 200},${60 - p.cumulativeProbability * 60}`
                        )
                        .join(" ")}
                    />
                    <polyline
                      fill="url(#gradient)"
                      opacity="0.1"
                      points={`0,60 ${r.probabilityCurve
                        .map(
                          (p, i) =>
                            `${(i / (r.probabilityCurve.length - 1)) * 200},${60 - p.cumulativeProbability * 60}`
                        )
                        .join(" ")} 200,60`}
                    />
                    <defs>
                      <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1A3C2A" />
                        <stop offset="100%" stopColor="#1A3C2A" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>

                {/* Strategy */}
                <p className="mt-3 text-xs text-brand-sage">
                  {r.recommendedStrategy}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
