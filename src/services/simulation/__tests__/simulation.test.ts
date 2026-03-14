import { describe, it, expect } from "vitest";
import { compareScenarios } from "../scenarios";
import type { SimulationResult } from "../index";

function makeResult(overrides: Partial<SimulationResult> = {}): SimulationResult {
  const currentYear = new Date().getFullYear();
  return {
    scenario: { stateCode: "CO", speciesSlug: "elk", currentPoints: 5, strategy: "preference" },
    expectedDrawYear: currentYear + 3,
    probabilityCurve: Array.from({ length: 5 }, (_, i) => ({
      year: currentYear + i + 1,
      cumulativeProbability: (i + 1) * 0.15,
    })),
    expectedTotalCost: 600,
    confidenceInterval: { low: currentYear + 2, high: currentYear + 5 },
    recommendedStrategy: "Keep building points.",
    ...overrides,
  };
}

describe("compareScenarios", () => {
  it("returns empty comparison for no scenarios", () => {
    const result = compareScenarios([]);
    expect(result.results).toHaveLength(0);
    expect(result.summary).toBe("No scenarios to compare.");
  });

  it("returns valid structure for a single scenario", () => {
    const result = compareScenarios([makeResult()]);
    expect(result.results).toHaveLength(1);
    expect(result.bestBySpeed).toBe(0);
    expect(result.bestByCost).toBe(0);
    expect(result.bestByOdds).toBe(0);
    expect(result.summary).toContain("Expected draw");
  });

  it("identifies best by speed and cost across multiple scenarios", () => {
    const currentYear = new Date().getFullYear();
    const fast = makeResult({ expectedDrawYear: currentYear + 1, expectedTotalCost: 1000 });
    const cheap = makeResult({ expectedDrawYear: currentYear + 5, expectedTotalCost: 200 });
    const result = compareScenarios([fast, cheap]);
    expect(result.bestBySpeed).toBe(0);
    expect(result.bestByCost).toBe(1);
  });
});
