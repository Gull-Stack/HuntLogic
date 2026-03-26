// =============================================================================
// State Point Systems — Authoritative mapping of how each state's draw works
//
// Sources verified 2026-03-25:
//   - Official state agency pages (azgfd.com, cpw.state.co.us, wgfd.wyo.gov, etc.)
//   - bookyourhunt.com/nonresident-western-hunt-planning-guide (cross-referenced)
//   - hunterpassport.com/guides/western-big-game-hunting-overview
//   - wildlife.ca.gov/Licensing/Hunting/Big-Game (CA preference point rules)
//
// Point type definitions:
//   preference — Max point holders draw first. Guarantees eventual draw.
//   bonus     — More points = more "tickets" in the hat. Random element remains.
//   weighted  — Hybrid: some % to max points, rest random (e.g. CO moose/sheep)
//   none      — Pure random lottery. No points accumulated.
//
// Some states use DIFFERENT systems for different species groups.
// The `speciesOverrides` field handles this.
// =============================================================================

export interface PointSystemInfo {
  /** Primary point type for this state's draw */
  type: "preference" | "bonus" | "weighted" | "none";
  /** Human-readable label for UI display */
  label: string;
  /** Short description of how this state's system works */
  description: string;
  /** If true, points are squared before the draw (exponential advantage) */
  squared?: boolean;
  /** Split ratio if applicable (e.g. WY 75/25, MT 75/25 for combos) */
  splitRatio?: string;
  /** Species-specific overrides when a state uses multiple systems */
  speciesOverrides?: Record<string, {
    type: "preference" | "bonus" | "weighted" | "none";
    label: string;
    description: string;
    squared?: boolean;
    splitRatio?: string;
  }>;
}

/**
 * Point system configuration for every state in our calendar.
 * Key = state code. Only states with active draw programs are included.
 */
export const STATE_POINT_SYSTEMS: Record<string, PointSystemInfo> = {
  // ===== WESTERN DRAW STATES =====

  AZ: {
    type: "bonus",
    label: "Bonus Points",
    description:
      "Arizona uses bonus points with randomization. More points = better odds, but no guarantee. Bonus points are squared in the draw, giving long-time applicants exponential advantage.",
    squared: true,
  },

  CO: {
    type: "preference",
    label: "Preference Points",
    description:
      "Colorado uses preference points for deer, elk, pronghorn, and bear — max point holders draw first. Moose, bighorn sheep, and mountain goat use a weighted (hybrid) system.",
    speciesOverrides: {
      moose: {
        type: "weighted",
        label: "Weighted Points",
        description:
          "Colorado moose uses weighted points — a hybrid system where points improve odds but don't guarantee a draw.",
      },
      bighorn_sheep: {
        type: "weighted",
        label: "Weighted Points",
        description:
          "Colorado bighorn sheep uses weighted points — points improve odds but draws include a random element.",
      },
      mountain_goat: {
        type: "weighted",
        label: "Weighted Points",
        description:
          "Colorado mountain goat uses weighted points — hybrid preference/random system.",
      },
    },
  },

  WY: {
    type: "preference",
    label: "Preference Points (75/25)",
    description:
      "Wyoming's 75/25 system: 75% of tags go to max preference point holders, 25% are drawn randomly regardless of points. WARNING: Miss 2 consecutive application years and lose ALL accumulated points.",
    splitRatio: "75/25",
  },

  NV: {
    type: "bonus",
    label: "Bonus Points",
    description:
      "Nevada uses bonus points squared. More points = exponentially better odds, but a random element always remains. Anyone can draw with 0 points — it just gets harder as others accumulate.",
    squared: true,
  },

  MT: {
    type: "bonus",
    label: "Bonus Points (squared)",
    description:
      "Montana uses bonus points squared for special permits (elk, deer, moose, sheep, goat, antelope). Nonresident combination licenses use a separate preference point system (75/25 split).",
    squared: true,
    speciesOverrides: {
      // NR combo licenses use preference points, not bonus
      elk: {
        type: "preference",
        label: "Preference Points (NR Combo)",
        description:
          "Montana NR elk combination licenses: 75% to highest preference points, 25% random among zero-point applicants. Separate from bonus points used for special permits.",
        splitRatio: "75/25",
      },
    },
  },

  OR: {
    type: "preference",
    label: "Preference Points",
    description:
      "Oregon uses preference points for all controlled hunt species. Max point holders draw first. Points never expire.",
  },

  ID: {
    type: "none",
    label: "No Point System",
    description:
      "Idaho uses a pure random draw — no preference or bonus points. Everyone has equal odds each year regardless of application history.",
  },

  UT: {
    type: "bonus",
    label: "Bonus Points",
    description:
      "Utah uses bonus points for most limited-entry and once-in-a-lifetime species. General season draws use a separate preference point system. Points are not squared.",
    speciesOverrides: {
      // General season deer/elk use preference, not bonus
      mule_deer: {
        type: "preference",
        label: "Preference Points (General)",
        description:
          "Utah general-season deer uses preference points — max points draw first. Limited-entry deer uses bonus points.",
      },
      elk: {
        type: "preference",
        label: "Preference Points (General)",
        description:
          "Utah general-season elk uses preference points. Limited-entry and OIAL elk uses bonus points.",
      },
    },
  },

  NM: {
    type: "none",
    label: "No Point System",
    description:
      "New Mexico uses a pure random draw with no preference or bonus points. Everyone has equal odds each year. This makes NM accessible for new applicants but unpredictable.",
  },

  // ===== STATES WITH LIMITED DRAWS =====

  ND: {
    type: "none",
    label: "No Point System (Once-in-a-Lifetime)",
    description:
      "North Dakota elk, moose, and bighorn sheep are once-in-a-lifetime lottery — no point system. If you've drawn a species before, you can never apply for it again.",
  },

  CA: {
    type: "preference",
    label: "Preference Points (Modified)",
    description:
      "California uses a modified preference point system. Premium deer: 90% to highest points, 10% random. Elk, pronghorn, bighorn sheep: 75% preference, 25% random (for quotas of 4+).",
    splitRatio: "90/10 deer, 75/25 elk/sheep/pronghorn",
  },

  SD: {
    type: "preference",
    label: "Preference Points",
    description:
      "South Dakota uses preference points for deer, elk, and antelope draws. Max point holders draw first.",
  },

  WA: {
    type: "none",
    label: "Random Draw",
    description:
      "Washington special hunt permits are awarded by random draw. No preference or bonus point system.",
  },

  KY: {
    type: "none",
    label: "Random Lottery",
    description:
      "Kentucky elk permits are awarded by random computer drawing. No preference or bonus points — pure lottery each year.",
  },

  PA: {
    type: "preference",
    label: "Preference Points",
    description:
      "Pennsylvania elk licenses use a preference point system. Applicants who have applied in prior years have improved odds. Points reward long-term commitment.",
  },

  ME: {
    type: "bonus",
    label: "Bonus Points",
    description:
      "Maine moose lottery uses bonus points — each unsuccessful application adds one chance in future drawings. More applications = more tickets in the hat.",
  },

  NH: {
    type: "none",
    label: "Random Lottery",
    description:
      "New Hampshire moose hunt lottery is a random draw. No preference or bonus point system.",
  },

  MI: {
    type: "preference",
    label: "Weighted Lottery",
    description:
      "Michigan uses a weighted lottery for elk — applicants accumulate preference via years applied. Moose is a separate random lottery.",
    speciesOverrides: {
      moose: {
        type: "none",
        label: "Random Lottery",
        description: "Michigan moose is a random lottery — no preference or bonus points.",
      },
    },
  },

  VA: {
    type: "none",
    label: "Random Lottery",
    description:
      "Virginia elk hunt lottery is random — no preference or bonus point system. 5 antlered elk tags awarded by lottery each year.",
  },
};

// =============================================================================
// Helper: Get the point system for a specific state + species combination
// =============================================================================

export function getPointSystem(
  stateCode: string,
  speciesSlug?: string,
): PointSystemInfo | null {
  const stateSystem = STATE_POINT_SYSTEMS[stateCode];
  if (!stateSystem) return null;

  // Check for species-specific override
  if (speciesSlug && stateSystem.speciesOverrides?.[speciesSlug]) {
    const override = stateSystem.speciesOverrides[speciesSlug];
    return {
      ...stateSystem,
      ...override,
      speciesOverrides: undefined, // don't nest overrides
    };
  }

  return stateSystem;
}

// =============================================================================
// Helper: Get all point types available in a state
// Returns unique types (e.g. CO returns ["preference", "weighted"])
// =============================================================================

export function getPointTypesForState(stateCode: string): string[] {
  const system = STATE_POINT_SYSTEMS[stateCode];
  if (!system) return ["preference"]; // safe default

  const types = new Set<string>([system.type]);
  if (system.speciesOverrides) {
    for (const override of Object.values(system.speciesOverrides)) {
      types.add(override.type);
    }
  }
  // Filter out "none" — if a state has no points, don't show point type selector
  types.delete("none");
  if (types.size === 0) return ["none"];
  return Array.from(types);
}
