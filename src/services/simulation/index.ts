// =============================================================================
// Simulation Engine — Monte Carlo "What If" Simulator
//
// Runs 10,000 iterations per scenario to project draw probability over time.
// =============================================================================

const LOG_PREFIX = "[simulation]";
const ITERATIONS = 10000;

// =============================================================================
// Types
// =============================================================================

export interface SimulationInput {
  stateCode: string;
  speciesSlug: string;
  unitCode?: string;
  currentPoints: number;
  strategy: "preference" | "bonus" | "random";
}

export interface SimulationResult {
  scenario: SimulationInput;
  expectedDrawYear: number;
  probabilityCurve: { year: number; cumulativeProbability: number }[];
  expectedTotalCost: number;
  confidenceInterval: { low: number; high: number };
  recommendedStrategy: string;
}

interface SimulationContext {
  annualPointCreepRate: number;
  baseDrawRate: number;
  annualApplicationFee: number;
  annualPointFee: number;
  totalApplicants: number;
  totalTags: number;
}

// =============================================================================
// runSimulation — Main entry point
// =============================================================================

export async function runSimulation(
  scenarios: SimulationInput[],
  yearsForward: number = 10
): Promise<SimulationResult[]> {
  console.log(
    `${LOG_PREFIX} Running simulation for ${scenarios.length} scenarios, ${yearsForward} years forward`
  );

  const results: SimulationResult[] = [];

  for (const scenario of scenarios) {
    const ctx = await getSimulationContext(scenario);
    const result = simulateScenario(scenario, ctx, yearsForward);
    results.push(result);
  }

  return results;
}

// =============================================================================
// simulateScenario — Run Monte Carlo for a single scenario
// =============================================================================

function simulateScenario(
  scenario: SimulationInput,
  ctx: SimulationContext,
  yearsForward: number
): SimulationResult {
  const currentYear = new Date().getFullYear();
  const drawYears: number[] = [];
  const yearDrawCounts = new Array(yearsForward).fill(0);

  for (let iter = 0; iter < ITERATIONS; iter++) {
    let points = scenario.currentPoints;
    let drawn = false;

    for (let y = 0; y < yearsForward; y++) {
      const year = currentYear + y + 1;
      const projectedCutoff = ctx.annualPointCreepRate * (y + 1);

      if (scenario.strategy === "preference") {
        // Preference point: draw when your points >= projected cutoff
        const cutoff = Math.max(
          scenario.currentPoints + projectedCutoff,
          ctx.baseDrawRate > 0 ? 1 / ctx.baseDrawRate : 20
        );
        if (points >= cutoff) {
          drawYears.push(year);
          yearDrawCounts[y]++;
          drawn = true;
          break;
        }
      } else if (scenario.strategy === "bonus") {
        // Bonus point: weighted random draw
        const weight = 1 + points;
        const totalWeight =
          ctx.totalApplicants > 0
            ? ctx.totalApplicants + points * 0.5
            : 1000 + points;
        const drawChance = Math.min(
          0.95,
          (weight / totalWeight) * (ctx.totalTags / Math.max(1, ctx.totalApplicants))
        );
        if (Math.random() < drawChance) {
          drawYears.push(year);
          yearDrawCounts[y]++;
          drawn = true;
          break;
        }
      } else {
        // Random: pure lottery
        const drawChance =
          ctx.totalTags > 0 && ctx.totalApplicants > 0
            ? ctx.totalTags / ctx.totalApplicants
            : ctx.baseDrawRate || 0.05;
        if (Math.random() < drawChance) {
          drawYears.push(year);
          yearDrawCounts[y]++;
          drawn = true;
          break;
        }
      }

      points++;
    }

    if (!drawn) {
      drawYears.push(currentYear + yearsForward + 1);
    }
  }

  // Calculate results
  drawYears.sort((a, b) => a - b);
  const medianDrawYear = drawYears[Math.floor(ITERATIONS / 2)];
  const p25 = drawYears[Math.floor(ITERATIONS * 0.25)];
  const p75 = drawYears[Math.floor(ITERATIONS * 0.75)];

  // Cumulative probability curve
  const probabilityCurve: { year: number; cumulativeProbability: number }[] = [];
  let cumulative = 0;
  for (let y = 0; y < yearsForward; y++) {
    cumulative += yearDrawCounts[y] / ITERATIONS;
    probabilityCurve.push({
      year: currentYear + y + 1,
      cumulativeProbability: Math.round(cumulative * 1000) / 1000,
    });
  }

  // Expected total cost
  const yearsUntilDraw = Math.max(1, medianDrawYear - currentYear);
  const expectedTotalCost =
    yearsUntilDraw * (ctx.annualApplicationFee + ctx.annualPointFee);

  // Strategy recommendation
  const fiveYearProb =
    yearsForward >= 5
      ? probabilityCurve[4]?.cumulativeProbability ?? 0
      : probabilityCurve[probabilityCurve.length - 1]?.cumulativeProbability ?? 0;

  let recommendedStrategy: string;
  if (fiveYearProb > 0.8) {
    recommendedStrategy = `Strong position — ${Math.round(fiveYearProb * 100)}% chance within 5 years. Keep building points.`;
  } else if (fiveYearProb > 0.5) {
    recommendedStrategy = `Good odds — ${Math.round(fiveYearProb * 100)}% chance within 5 years. Consider applying with current points.`;
  } else if (fiveYearProb > 0.2) {
    recommendedStrategy = `Long-term play — ${Math.round(fiveYearProb * 100)}% chance within 5 years. Pair with an OTC backup hunt.`;
  } else {
    recommendedStrategy = `Tough draw — only ${Math.round(fiveYearProb * 100)}% chance within 5 years. Consider alternative units or OTC options.`;
  }

  return {
    scenario,
    expectedDrawYear: medianDrawYear,
    probabilityCurve,
    expectedTotalCost: Math.round(expectedTotalCost),
    confidenceInterval: { low: p25, high: p75 },
    recommendedStrategy,
  };
}

// =============================================================================
// getSimulationContext — Fetch real data for simulation parameters
// =============================================================================

async function getSimulationContext(
  scenario: SimulationInput
): Promise<SimulationContext> {
  try {
    const { db } = await import("@/lib/db");
    const { drawOdds, states, species } = await import("@/lib/db/schema");
    const { eq, and, desc } = await import("drizzle-orm");

    // Get state and species IDs
    const stateRow = await db.query.states.findFirst({
      where: eq(states.code, scenario.stateCode),
      columns: { id: true },
    });

    const speciesRow = await db.query.species.findFirst({
      where: eq(species.slug, scenario.speciesSlug),
      columns: { id: true },
    });

    if (!stateRow || !speciesRow) {
      return getDefaultContext();
    }

    // Get recent draw odds data
    const recentOdds = await db
      .select({
        year: drawOdds.year,
        minPointsDrawn: drawOdds.minPointsDrawn,
        drawRate: drawOdds.drawRate,
        totalApplicants: drawOdds.totalApplicants,
        totalTags: drawOdds.totalTags,
      })
      .from(drawOdds)
      .where(
        and(
          eq(drawOdds.stateId, stateRow.id),
          eq(drawOdds.speciesId, speciesRow.id)
        )
      )
      .orderBy(desc(drawOdds.year))
      .limit(10);

    if (recentOdds.length < 2) {
      return getDefaultContext();
    }

    // Calculate point creep rate from historical data
    const pointData = recentOdds
      .filter((r) => r.minPointsDrawn !== null)
      .map((r) => ({ year: r.year, points: r.minPointsDrawn! }));

    let annualPointCreepRate = 0.5;
    if (pointData.length >= 2) {
      const yearSpan = pointData[0].year - pointData[pointData.length - 1].year;
      const pointSpan =
        pointData[0].points - pointData[pointData.length - 1].points;
      annualPointCreepRate =
        yearSpan > 0 ? pointSpan / yearSpan : 0.5;
    }

    const latestOdds = recentOdds[0];

    return {
      annualPointCreepRate: Math.max(0, annualPointCreepRate),
      baseDrawRate: latestOdds.drawRate ?? 0.1,
      annualApplicationFee: 50,
      annualPointFee: 50,
      totalApplicants: latestOdds.totalApplicants ?? 500,
      totalTags: latestOdds.totalTags ?? 50,
    };
  } catch {
    return getDefaultContext();
  }
}

function getDefaultContext(): SimulationContext {
  return {
    annualPointCreepRate: 0.5,
    baseDrawRate: 0.1,
    annualApplicationFee: 50,
    annualPointFee: 50,
    totalApplicants: 500,
    totalTags: 50,
  };
}
