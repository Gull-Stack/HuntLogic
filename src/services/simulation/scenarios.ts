// =============================================================================
// Scenario Comparison — Compare multiple draw strategies side by side
// =============================================================================

import { type SimulationResult } from "./index";

export interface ScenarioComparison {
  results: SimulationResult[];
  bestBySpeed: number; // index of fastest draw
  bestByCost: number; // index of cheapest
  bestByOdds: number; // index of highest 5-year probability
  summary: string;
}

/**
 * Compare simulation results and rank strategies.
 */
export function compareScenarios(
  results: SimulationResult[]
): ScenarioComparison {
  if (results.length === 0) {
    return {
      results: [],
      bestBySpeed: 0,
      bestByCost: 0,
      bestByOdds: 0,
      summary: "No scenarios to compare.",
    };
  }

  // Find best by expected draw year (earliest)
  let bestBySpeed = 0;
  for (let i = 1; i < results.length; i++) {
    if (results[i].expectedDrawYear < results[bestBySpeed].expectedDrawYear) {
      bestBySpeed = i;
    }
  }

  // Find best by cost (cheapest)
  let bestByCost = 0;
  for (let i = 1; i < results.length; i++) {
    if (results[i].expectedTotalCost < results[bestByCost].expectedTotalCost) {
      bestByCost = i;
    }
  }

  // Find best by 5-year odds (highest cumulative probability)
  let bestByOdds = 0;
  const get5YearProb = (r: SimulationResult) => {
    const fiveYear = r.probabilityCurve.find(
      (p) => p.year === new Date().getFullYear() + 5
    );
    return fiveYear?.cumulativeProbability ?? 0;
  };
  for (let i = 1; i < results.length; i++) {
    if (get5YearProb(results[i]) > get5YearProb(results[bestByOdds])) {
      bestByOdds = i;
    }
  }

  // Generate summary
  const best = results[bestBySpeed];
  const summary =
    results.length === 1
      ? `Expected draw in ${best.expectedDrawYear} with ~$${best.expectedTotalCost} total investment.`
      : `Scenario ${bestBySpeed + 1} (${best.scenario.stateCode} ${best.scenario.speciesSlug}) draws fastest by ${best.expectedDrawYear}. ` +
        `Scenario ${bestByCost + 1} is cheapest at ~$${results[bestByCost].expectedTotalCost}.`;

  return {
    results,
    bestBySpeed,
    bestByCost,
    bestByOdds,
    summary,
  };
}
