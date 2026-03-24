// =============================================================================
// State-Species Intelligence
//
// Curated rankings of best states per species for the Draw Simulator wizard.
// Based on well-established hunting community consensus from NDOW/CPW/WGFD/DWR
// data, B&C records, GoHunt rankings, Rokslide/HuntTalk community knowledge,
// and tag allocation data.
//
// Scoring key:
//   tier 1 = premier destination, widely considered top 3 in the west
//   tier 2 = excellent option, above average odds or quality
//   tier 3 = solid option worth applying
//
// "reason" is shown to the user as the AI explanation.
//
// VERSION: bump INTELLIGENCE_VERSION when any data changes. Used for cache
// invalidation and A/B testing. INTELLIGENCE_LAST_UPDATED is informational.
// =============================================================================

export const INTELLIGENCE_VERSION = "2026-03-24-v1";
export const INTELLIGENCE_LAST_UPDATED = "2026-03-24";

export interface StateSpeciesRanking {
  stateCode: string;
  tier: 1 | 2 | 3;
  reason: string;
  /** true = almost no-where else worth applying for this species */
  exclusive?: boolean;
}

export interface SpeciesIntelligence {
  /** States to surface when user clicks "Show me the best options" */
  topStates: StateSpeciesRanking[];
  /** Short summary shown in the step 2 header when this species is selected */
  summary: string;
}

export type SpeciesSlug =
  | "caribou" | "moose" | "elk" | "mule_deer" | "pronghorn"
  | "bighorn_sheep" | "mountain_goat" | "black_bear" | "bison"
  | "turkey" | "whitetail" | "pheasant" | "javelina" | "mountain_lion";

export const KNOWN_SPECIES_SLUGS: readonly SpeciesSlug[] = [
  "caribou", "moose", "elk", "mule_deer", "pronghorn",
  "bighorn_sheep", "mountain_goat", "black_bear", "bison",
  "turkey", "whitetail", "pheasant", "javelina", "mountain_lion",
] as const;

export const STATE_SPECIES_INTELLIGENCE: Record<SpeciesSlug, SpeciesIntelligence> = {
  // ---------------------------------------------------------------------------
  // CARIBOU — Alaska only meaningful option for US hunters
  // ---------------------------------------------------------------------------
  caribou: {
    summary: "Caribou hunting in the US is almost exclusively an Alaska pursuit. No other state offers huntable populations.",
    topStates: [
      {
        stateCode: "AK",
        tier: 1,
        exclusive: true,
        reason: "Alaska is the only US state with huntable caribou herds. Multiple herds (Western Arctic, Central Arctic, Mulchatna) with OTC and draw options depending on unit.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // MOOSE — Alaska #1 by a wide margin, then WY/UT/ID/CO/MT limited
  // ---------------------------------------------------------------------------
  moose: {
    summary: "Alaska dominates moose hunting. Lower-48 options exist but tags are extremely limited — Wyoming and Utah issue the most NR tags.",
    topStates: [
      {
        stateCode: "AK",
        tier: 1,
        reason: "World's largest moose. OTC options available in many units. Best combination of quality and access for NR hunters.",
      },
      {
        stateCode: "WY",
        tier: 2,
        reason: "Highest NR moose tag allocation in the lower-48. Point system — plan on 5-10 years to draw premium units.",
      },
      {
        stateCode: "UT",
        tier: 2,
        reason: "Limited tags but quality bulls. Preference point system — expect 8-15 years for top units.",
      },
      {
        stateCode: "ID",
        tier: 3,
        reason: "Lottery draw with no point system. Low odds annually but worth applying every year.",
      },
      {
        stateCode: "MT",
        tier: 3,
        reason: "Limited districts open to NR. Bonus point system — long odds but legitimate quality moose.",
      },
      {
        stateCode: "CO",
        tier: 3,
        reason: "Growing moose population. Preference points — remote western units have solid bulls.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // ELK — Colorado, Montana, Idaho, Wyoming lead for NR hunters
  // ---------------------------------------------------------------------------
  elk: {
    summary: "Colorado and Montana lead for NR elk odds. Idaho has OTC options. Wyoming and New Mexico offer trophy potential with points. Nevada and Utah have limited but quality tags.",
    topStates: [
      {
        stateCode: "CO",
        tier: 1,
        reason: "Largest elk population in North America (~280K animals). Preference point system — many units draw in 3-7 years NR. Good OTC options in some units.",
      },
      {
        stateCode: "MT",
        tier: 1,
        reason: "Huge public land elk hunting with OTC general season tags in most districts. NR draw units offer trophy quality.",
      },
      {
        stateCode: "ID",
        tier: 1,
        reason: "Largest OTC elk hunting in the west. Over-the-counter tags available statewide — no draw required for general season.",
      },
      {
        stateCode: "WY",
        tier: 2,
        reason: "Premium elk with preference points. Units like 7 and 104 are legendary. Plan 3-8 years for top NR draw units.",
      },
      {
        stateCode: "NM",
        tier: 2,
        reason: "Quality Boone & Crockett bulls. Private land draw vs public. Expect 5-10 years NR for premium units.",
      },
      {
        stateCode: "AZ",
        tier: 2,
        reason: "World-class bulls in units 9, 10, 27. NR odds are very low but once drawn it's a bucket-list hunt.",
      },
      {
        stateCode: "OR",
        tier: 2,
        reason: "Good OTC general season elk. Some draw units (Starkey, Wenaha) are premium trophy opportunities.",
      },
      {
        stateCode: "NV",
        tier: 3,
        reason: "High-quality bulls but very limited tags. Plan 8-15+ years for top units. Worth applying every year.",
      },
      {
        stateCode: "UT",
        tier: 3,
        reason: "Quality bulls with preference points. Many good OTC spike/cow options. Premium units take 5-15 years.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // MULE DEER — Utah, Nevada, Wyoming, Colorado lead
  // ---------------------------------------------------------------------------
  mule_deer: {
    summary: "Utah, Nevada, and Wyoming are the premier trophy mule deer destinations. Colorado has higher odds with points. Idaho and Montana offer OTC options.",
    topStates: [
      {
        stateCode: "UT",
        tier: 1,
        reason: "Consistently produces Boone & Crockett bucks. Premium units (Book Cliffs, Henry Mtns) require 10-20 years NR but are world-class.",
      },
      {
        stateCode: "NV",
        tier: 1,
        reason: "Well-managed with quality genetics. Many units draw in 0-3 years. Best combination of quality and accessibility for NR mule deer.",
      },
      {
        stateCode: "WY",
        tier: 1,
        reason: "Stellar trophy potential in areas like the Red Desert and Wyoming Range. Preference points — plan 3-8 years for premium NR units.",
      },
      {
        stateCode: "CO",
        tier: 2,
        reason: "Large deer population. OTC licenses available plus premium draw units. Good entry-level option for NR hunters.",
      },
      {
        stateCode: "AZ",
        tier: 2,
        reason: "Desert mule deer in units 22, 23 are among the best in the country. Expect 8-15 years NR wait.",
      },
      {
        stateCode: "ID",
        tier: 2,
        reason: "OTC general season available. Frank Church wilderness units offer big deer with minimal crowds.",
      },
      {
        stateCode: "MT",
        tier: 2,
        reason: "Large body deer with OTC options. Missouri Breaks and eastern MT produce notable bucks.",
      },
      {
        stateCode: "OR",
        tier: 3,
        reason: "Eastern Oregon draw units offer quality mule deer. Limited NR tags but worth applying.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // PRONGHORN — Wyoming #1 by far, then Nevada, Oregon, Montana
  // ---------------------------------------------------------------------------
  pronghorn: {
    summary: "Wyoming has the world's largest pronghorn population and most available tags. Nevada, Montana, and Oregon round out the top options.",
    topStates: [
      {
        stateCode: "WY",
        tier: 1,
        reason: "More pronghorn than any other state (~500K animals). Many units draw in 1-4 years NR. Best overall odds and quality combination.",
      },
      {
        stateCode: "NV",
        tier: 1,
        reason: "Quality pronghorn with reasonable NR odds in many units. Some units are 0-point draws with good success rates.",
      },
      {
        stateCode: "MT",
        tier: 2,
        reason: "Large population in eastern MT. Bonus point system — many units draw with low points. Great value NR hunt.",
      },
      {
        stateCode: "OR",
        tier: 2,
        reason: "Southeastern Oregon pronghorn with limited NR tags. Draw system — moderate wait times.",
      },
      {
        stateCode: "CO",
        tier: 2,
        reason: "Good population with preference points. Some units draw quickly for NR — solid option especially in NW Colorado.",
      },
      {
        stateCode: "AZ",
        tier: 3,
        reason: "Limited tags, long wait, but desert pronghorn quality is exceptional. Once-in-a-lifetime caliber hunt.",
      },
      {
        stateCode: "NM",
        tier: 3,
        reason: "Good population especially in eastern NM. Draw odds reasonable for NR in some units.",
      },
      {
        stateCode: "ID",
        tier: 3,
        reason: "Limited pronghorn but southern Idaho Snake River Plain units are worth applying for.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // BIGHORN SHEEP — Nevada leads in tag numbers; AZ/UT/WY/CO/MT/ID all premium
  // ---------------------------------------------------------------------------
  bighorn_sheep: {
    summary: "Nevada issues more bighorn sheep tags than any other state. All sheep states are once-in-a-lifetime caliber hunts — expect 10-25+ year waits everywhere.",
    topStates: [
      {
        stateCode: "NV",
        tier: 1,
        reason: "Issues more Rocky and Desert bighorn tags than any other state (~500+ annually). Best overall NR odds — still expect 8-20 years but better than most.",
      },
      {
        stateCode: "AZ",
        tier: 1,
        reason: "Desert bighorn in units 22, 23, 45A are legendary. Expect 15-25 years NR. Once drawn, one of the world's best sheep hunts.",
      },
      {
        stateCode: "WY",
        tier: 1,
        reason: "Rocky Mountain bighorn — units 1-3 (Whiskey Basin area) hold record-class rams. Preference points — 10-20+ years NR.",
      },
      {
        stateCode: "CO",
        tier: 2,
        reason: "Growing herd. Preference points — premium units take 15-25 years. Some limited units draw in 8-12 years.",
      },
      {
        stateCode: "MT",
        tier: 2,
        reason: "Quality Rocky Mountain bighorn. Bonus points — some districts draw in 10-15 years NR.",
      },
      {
        stateCode: "UT",
        tier: 2,
        reason: "Desert and Rocky Mountain bighorn. Preference points — premium units (Book Cliffs, La Sal) are 20+ year waits.",
      },
      {
        stateCode: "ID",
        tier: 2,
        reason: "Rocky Mountain bighorn in central ID wilderness. No point system — pure lottery. Apply every year.",
      },
      {
        stateCode: "NM",
        tier: 3,
        reason: "Desert bighorn in southern NM. Limited NR tags — long odds but worth the annual application.",
      },
      {
        stateCode: "OR",
        tier: 3,
        reason: "Rocky Mountain bighorn in Hells Canyon and eastern OR. Limited tags — apply every year.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // MOUNTAIN GOAT — Montana, Idaho, Washington, Wyoming lead
  // ---------------------------------------------------------------------------
  mountain_goat: {
    summary: "Mountain goat tags are among the rarest in the west. Alaska has OTC options. Montana and Washington have the most available lower-48 tags.",
    topStates: [
      {
        stateCode: "AK",
        tier: 1,
        reason: "Only state with any OTC mountain goat options. Southeast and Southcentral Alaska have huntable populations. Best overall access.",
      },
      {
        stateCode: "MT",
        tier: 1,
        reason: "Most mountain goat tags of any lower-48 state. Bonus point system — expect 8-15 years NR. Quality billies in rocky northern units.",
      },
      {
        stateCode: "WA",
        tier: 2,
        reason: "North Cascades and Selkirks goat hunts. Very limited tags — expect long odds but extraordinary scenery.",
      },
      {
        stateCode: "ID",
        tier: 2,
        reason: "Central ID wilderness goat hunts. No point system — annual lottery. Worth applying every year.",
      },
      {
        stateCode: "WY",
        tier: 2,
        reason: "Preference points — premium goat units take 15-25 years NR. Once drawn, exceptional hunt.",
      },
      {
        stateCode: "CO",
        tier: 3,
        reason: "Limited tags in Gore Range and Never Summer areas. Preference points — 15-25 years for premium units.",
      },
      {
        stateCode: "NV",
        tier: 3,
        reason: "Very limited mountain goat — a handful of tags annually. Worth applying for the rare draw opportunity.",
      },
      {
        stateCode: "OR",
        tier: 3,
        reason: "Wallowa Mountains goat hunts. Extremely limited — apply every year and hope for a bonus point draw.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // BLACK BEAR — widespread, many states; ID/MT/OR/WA lead for quantity
  // ---------------------------------------------------------------------------
  black_bear: {
    summary: "Black bear hunting is available in many western states. Idaho, Montana, and Oregon offer the most accessible NR opportunities including OTC options.",
    topStates: [
      {
        stateCode: "ID",
        tier: 1,
        reason: "OTC black bear tags available statewide spring and fall. Large population — one of the best NR value bear hunts in the west.",
      },
      {
        stateCode: "MT",
        tier: 1,
        reason: "OTC spring and fall bear tags in most districts. Dense population in western MT — archery and rifle options.",
      },
      {
        stateCode: "OR",
        tier: 1,
        reason: "OTC tags available. Cascade Range and coastal ranges hold good populations — accessible NR hunt.",
      },
      {
        stateCode: "WA",
        tier: 2,
        reason: "OTC tags in most units. North Cascades and Olympic Peninsula have solid bear populations.",
      },
      {
        stateCode: "CO",
        tier: 2,
        reason: "OTC archery/rifle bear tags available. Large population — western slope and mountains hold good numbers.",
      },
      {
        stateCode: "WY",
        tier: 2,
        reason: "Limited draw in some areas but reasonable NR odds. Grizzly country overlap adds unique experience.",
      },
      {
        stateCode: "AK",
        tier: 2,
        reason: "Black bear plus brown/grizzly options. Remote access adds cost but unmatched quality.",
      },
      {
        stateCode: "NM",
        tier: 3,
        reason: "Southern Rocky Mountain black bear. Draw required — moderate odds for NR.",
      },
      {
        stateCode: "NV",
        tier: 3,
        reason: "Very limited population — a handful of tags in the Ruby Mountains area annually.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // BISON — extremely limited; Montana and Utah have most NR tags
  // ---------------------------------------------------------------------------
  bison: {
    summary: "Bison tags are among the rarest hunting opportunities in North America. Utah and Montana offer the most legitimate NR bison hunts.",
    topStates: [
      {
        stateCode: "UT",
        tier: 1,
        reason: "Henry Mountains free-roaming bison herd — most accessible NR bison hunt in the lower-48. Preference points required; expect 5-15 years.",
      },
      {
        stateCode: "MT",
        tier: 1,
        reason: "Yellowstone border hunts and tribal cooperatives. Limited but legitimate free-range bison opportunity.",
      },
      {
        stateCode: "AK",
        tier: 2,
        reason: "Delta Junction bison herd. Draw required — small herd but legitimate free-range hunt.",
      },
      {
        stateCode: "WY",
        tier: 2,
        reason: "Grand Teton National Park hunt — lottery only. Once in a lifetime opportunity if drawn.",
      },
      {
        stateCode: "AZ",
        tier: 3,
        reason: "House Rock Valley bison on Kaibab Plateau. Very limited tags — long odds but quality animals.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // TURKEY — widespread; many states offer good NR opportunities
  // ---------------------------------------------------------------------------
  turkey: {
    summary: "Turkey hunting is available across much of the country. Rio Grande subspecies dominate the west; Merriam's are found in the Rockies.",
    topStates: [
      {
        stateCode: "KS",
        tier: 1,
        reason: "Kansas is considered the #1 state for Rio Grande turkey. OTC licenses, huge birds, and landowner access.",
      },
      {
        stateCode: "OK",
        tier: 1,
        reason: "Rio Grande and Eastern hybrids. OTC hunting on public land — excellent spring gobbler action.",
      },
      {
        stateCode: "CO",
        tier: 1,
        reason: "Merriam's turkey in the Rocky Mountain foothills. OTC licenses — great public land opportunity.",
      },
      {
        stateCode: "SD",
        tier: 2,
        reason: "Black Hills Merriam's turkey — classic western turkey hunt with scenic backdrop.",
      },
      {
        stateCode: "WY",
        tier: 2,
        reason: "Merriam's turkey in eastern WY and Black Hills area. Affordable OTC licenses.",
      },
      {
        stateCode: "NM",
        tier: 2,
        reason: "Merriam's and Rio Grande in mountain ranges. Draw system with reasonable NR odds.",
      },
      {
        stateCode: "TX",
        tier: 2,
        reason: "Rio Grande turkey — private land focused but outstanding quality and huntable populations.",
      },
      {
        stateCode: "MT",
        tier: 3,
        reason: "Merriam's turkey in southeastern MT. OTC options — combine with spring bear for a great western trip.",
      },
      {
        stateCode: "ID",
        tier: 3,
        reason: "Merriam's turkey in southern ID. OTC spring license available for NR.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // WHITETAIL — Midwest leads; limited western options
  // ---------------------------------------------------------------------------
  whitetail: {
    summary: "Whitetail hunting is dominated by the Midwest and Southeast. Kansas, Iowa, Missouri, and Illinois produce the largest bucks consistently.",
    topStates: [
      {
        stateCode: "KS",
        tier: 1,
        reason: "Consistently produces B&C whitetails. Managed harvest with OTC licenses — private land focused but world-class deer.",
      },
      {
        stateCode: "IA",
        tier: 1,
        reason: "Trophy whitetail capital of the Midwest. Archery NR license — limited but exceptional quality.",
      },
      {
        stateCode: "IL",
        tier: 1,
        reason: "Agriculture-dominated habitat = giant bucks. NR archery and firearm licenses available.",
      },
      {
        stateCode: "MO",
        tier: 2,
        reason: "Large deer herd with quality genetics. OTC licenses — great public land on Mark Twain NF.",
      },
      {
        stateCode: "WI",
        tier: 2,
        reason: "Huge deer numbers — north woods and agriculture mix. Good value NR hunt.",
      },
      {
        stateCode: "TX",
        tier: 2,
        reason: "Largest whitetail population in the country — heavily private land. Hill Country and South Texas are world class.",
      },
      {
        stateCode: "OH",
        tier: 2,
        reason: "Proven trophy producer. OTC licenses — southeastern Ohio public land holds good deer.",
      },
      {
        stateCode: "MT",
        tier: 3,
        reason: "Eastern MT river bottoms have whitetail — combine with mule deer for a great western combo hunt.",
      },
      {
        stateCode: "ID",
        tier: 3,
        reason: "Northern ID panhandle whitetail — OTC tags available, underrated destination.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // PHEASANT — South Dakota #1 by a wide margin
  // ---------------------------------------------------------------------------
  pheasant: {
    summary: "South Dakota is the undisputed pheasant capital of the world. Kansas and Iowa round out the top tier.",
    topStates: [
      {
        stateCode: "SD",
        tier: 1,
        reason: "More pheasants than anywhere on earth. Wall, Pierre, and the Missouri River breaks — the world standard for rooster hunting.",
      },
      {
        stateCode: "KS",
        tier: 2,
        reason: "Northwestern Kansas produces excellent bird numbers. Public walk-in hunting available on WIHA program.",
      },
      {
        stateCode: "IA",
        tier: 2,
        reason: "Good pheasant numbers with CRP ground. NW Iowa is the hotspot — strong local tradition.",
      },
      {
        stateCode: "NE",
        tier: 2,
        reason: "Sand Hills pheasant hunting is underrated. Public land hunting available through Game and Parks.",
      },
      {
        stateCode: "MT",
        tier: 3,
        reason: "Eastern MT river drainages hold pheasants — combine with deer/elk for a multi-species trip.",
      },
      {
        stateCode: "ID",
        tier: 3,
        reason: "Snake River Plain and Magic Valley — solid pheasant hunting, less pressure than SD.",
      },
      {
        stateCode: "CO",
        tier: 3,
        reason: "Eastern plains pheasant — combine with pronghorn for a fall plains combo.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // JAVELINA — Arizona and Texas only
  // ---------------------------------------------------------------------------
  javelina: {
    summary: "Javelina hunting is limited to the southwestern US. Arizona and Texas are the only meaningful destinations.",
    topStates: [
      {
        stateCode: "AZ",
        tier: 1,
        exclusive: true,
        reason: "Best javelina hunting in the US. Draw system — moderate odds (30-80% depending on unit). Classic desert hunt.",
      },
      {
        stateCode: "TX",
        tier: 2,
        reason: "Year-round javelina hunting on private land in South Texas and Trans-Pecos. No draw required — land access is the challenge.",
      },
      {
        stateCode: "NM",
        tier: 3,
        reason: "Limited javelina in southern NM desert. Draw required — small population but legitimate hunt.",
      },
    ],
  },

  // ---------------------------------------------------------------------------
  // MOUNTAIN LION — many western states; AZ, CO, ID, MT, UT lead
  // ---------------------------------------------------------------------------
  mountain_lion: {
    summary: "Mountain lion hunting is legal in most western states. Arizona, Idaho, Montana, and Utah are consistently top producers.",
    topStates: [
      {
        stateCode: "AZ",
        tier: 1,
        reason: "Excellent mountain lion hunting with OTC tags. High density in Mogollon Rim country — top destination for hound hunters.",
      },
      {
        stateCode: "ID",
        tier: 1,
        reason: "Strong population. OTC tags in most units — good combination of access and lion numbers.",
      },
      {
        stateCode: "MT",
        tier: 1,
        reason: "Quality mountain lions in western MT. Quota hunts with OTC tags until quota filled.",
      },
      {
        stateCode: "UT",
        tier: 2,
        reason: "Year-round season in some units. Controlled harvest with reasonable NR odds.",
      },
      {
        stateCode: "CO",
        tier: 2,
        reason: "Quota-based season. Good density in western slope foothills — solid value NR hunt.",
      },
      {
        stateCode: "WY",
        tier: 2,
        reason: "Limited season in specific drainages. Draw and OTC options depending on area.",
      },
      {
        stateCode: "NV",
        tier: 3,
        reason: "Growing mountain lion population. OTC tags available — underrated destination.",
      },
      {
        stateCode: "NM",
        tier: 3,
        reason: "Year-round season with bag limit. Southern NM desert ranges have good lion numbers.",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Helper: get best states for a set of selected species
// ---------------------------------------------------------------------------

/**
 * Type-safe lookup for STATE_SPECIES_INTELLIGENCE by runtime string slug.
 * Returns undefined for unknown slugs without unsafe casting.
 */
export function getIntelligence(slug: string): SpeciesIntelligence | undefined {
  return STATE_SPECIES_INTELLIGENCE[slug as SpeciesSlug];
}

/**
 * Returns a deduplicated, ranked list of state codes that are top destinations
 * for the given species selection. States that are tier-1 for ANY selected
 * species rank highest. Exclusive species (caribou, javelina) constrain the
 * entire list when selected.
 */
export function getBestStatesForSpecies(speciesSlugs: string[]): {
  code: string;
  tier: 1 | 2 | 3;
  reasons: string[];
}[] {
  // Check for exclusive species first
  const exclusiveSpecies = speciesSlugs.filter((slug) => {
    const intel = getIntelligence(slug);
    return intel?.topStates.some((s) => s.exclusive);
  });

  // If any exclusive species selected, only return states that serve ALL selected species
  // (practically: return intersection of exclusive states + states that have all other species)
  const stateScores = new Map<string, { tier: 1 | 2 | 3; reasons: string[]; speciesCovered: Set<string> }>();

  for (const slug of speciesSlugs) {
    const intel = getIntelligence(slug);
    if (!intel) continue;

    for (const ranking of intel.topStates) {
      const existing = stateScores.get(ranking.stateCode);
      if (!existing) {
        stateScores.set(ranking.stateCode, {
          tier: ranking.tier,
          reasons: [`${slug}: ${ranking.reason}`],
          speciesCovered: new Set([slug]),
        });
      } else {
        existing.reasons.push(`${slug}: ${ranking.reason}`);
        existing.speciesCovered.add(slug);
        // Upgrade tier if this species ranks this state higher
        if (ranking.tier < existing.tier) {
          existing.tier = ranking.tier;
        }
      }
    }
  }

  // If exclusive species are in the mix, filter to only states that cover the exclusive species
  let results = [...stateScores.entries()];

  if (exclusiveSpecies.length > 0) {
    results = results.filter(([, v]) =>
      exclusiveSpecies.every((slug) => v.speciesCovered.has(slug))
    );
  }

  // Sort: tier 1 first, then by number of species covered (descending), then tier
  results.sort((a, b) => {
    const [, av] = a;
    const [, bv] = b;
    if (av.tier !== bv.tier) return av.tier - bv.tier;
    return bv.speciesCovered.size - av.speciesCovered.size;
  });

  return results.map(([code, v]) => ({
    code,
    tier: v.tier,
    reasons: v.reasons,
  }));
}

/**
 * Returns a brief context blurb for the step 2 header when specific species are selected.
 */
export function getSpeciesStateContext(speciesSlugs: string[]): string {
  if (speciesSlugs.length === 0) return "";

  const exclusives = speciesSlugs.filter((slug) =>
    getIntelligence(slug)?.topStates.some((s) => s.exclusive)
  );

  if (exclusives.length > 0) {
    const names = exclusives.map((s) => getIntelligence(s)?.summary ?? s);
    return names[0] ?? "";
  }

  if (speciesSlugs.length === 1) {
    const slug = speciesSlugs[0]!;
    return getIntelligence(slug)?.summary ?? "";
  }

  return "Showing states that offer strong opportunities for your selected species.";
}

// =============================================================================
// Curated Hunt Suggestions — single source of truth
//
// These are imported by /api/v1/inspire-me as DB fallbacks AND by the Draw
// Simulator client for the Inspire Me flow. Previously duplicated in both
// places — now lives here only.
// =============================================================================

export type InspireMotivation = "freezer" | "trophy" | "lifetime" | "balanced";

export interface CuratedHuntSuggestion {
  species: string;
  state: string;
  tagline: string;
  difficulty: string;
  unitCode?: string;
  drawRate?: number | null;
  successRate?: number | null;
  yearsToExpect?: string;
  hook?: string;
}

export type RegionKey =
  | "southeast" | "south" | "midwest" | "west"
  | "northwest" | "southwest" | "mountain" | "northeast";

export const REGIONAL_OTC_HUNTS: Record<RegionKey, CuratedHuntSuggestion> = {
  southeast: { species: "White-tailed Deer", state: "Georgia", tagline: "Some of the best whitetail hunting in the Southeast. OTC license, 750K+ acres of public land.", difficulty: "otc" },
  south:     { species: "White-tailed Deer", state: "Texas",   tagline: "More whitetail than anywhere on earth. Private land leases are accessible and affordable.", difficulty: "otc" },
  midwest:   { species: "Pheasant",          state: "South Dakota", tagline: "The pheasant capital of the world. Incredible bird numbers and walk-in access.", difficulty: "otc" },
  west:      { species: "Elk",               state: "Idaho",   tagline: "OTC bull elk tags in the Frank Church Wilderness. No draw, no points — just buy the license.", difficulty: "otc" },
  northwest: { species: "Black Bear",        state: "Montana", tagline: "OTC spring bear tags in western Montana. High density, big public land.", difficulty: "otc" },
  southwest: { species: "Mule Deer",         state: "Nevada",  tagline: "Nevada issues more big game tags than most states. Some mule deer units draw with 0 points.", difficulty: "easy_draw" },
  mountain:  { species: "Pronghorn",         state: "Wyoming", tagline: "Wyoming has more pronghorn than anywhere on earth. Many units draw in 1-2 years NR.", difficulty: "easy_draw" },
  northeast: { species: "White-tailed Deer", state: "Pennsylvania", tagline: "Pennsylvania has one of the largest whitetail herds in the country. OTC license, huge public land.", difficulty: "otc" },
};

export const STATE_TO_REGION: Record<string, RegionKey> = {
  GA: "southeast", FL: "southeast", SC: "southeast", NC: "southeast", AL: "southeast",
  MS: "southeast", TN: "southeast", VA: "southeast", AR: "southeast",
  TX: "south", OK: "south", LA: "south", KY: "south",
  SD: "midwest", ND: "midwest", NE: "midwest", KS: "midwest", IA: "midwest",
  MO: "midwest", MN: "midwest", WI: "midwest", IL: "midwest", IN: "midwest",
  OH: "midwest", MI: "midwest",
  ID: "west", OR: "west", CA: "west",
  WA: "northwest", MT: "northwest", AK: "northwest",
  NV: "southwest", AZ: "southwest", NM: "southwest", UT: "southwest",
  WY: "mountain", CO: "mountain",
  NY: "northeast", PA: "northeast", VT: "northeast", NH: "northeast", ME: "northeast",
  MA: "northeast", CT: "northeast", RI: "northeast", NJ: "northeast",
  DE: "northeast", MD: "northeast", WV: "northeast",
};

export const ASPIRATIONAL_HUNTS: Record<InspireMotivation, CuratedHuntSuggestion> = {
  freezer:  { species: "Rocky Mountain Elk",       state: "Idaho",    tagline: "OTC bull elk tags available statewide — no draw, no points. A 5-day camp in the Frank Church Wilderness.", difficulty: "otc",  yearsToExpect: "This year",   hook: "Over-the-counter. No waiting. Just buy the license and go." },
  trophy:   { species: "Rocky Mountain Bighorn Sheep", state: "Nevada",tagline: "Nevada issues more bighorn sheep tags than any other state. A true once-in-a-lifetime trophy hunt.", difficulty: "draw", yearsToExpect: "8-15 years",  hook: "Start your points today. Nevada is the best NR sheep state in the country." },
  lifetime: { species: "Desert Bighorn Sheep",     state: "Arizona",  tagline: "Arizona bighorn sheep is the pinnacle of North American big game hunting. Record-class rams in the Sonoran Desert.", difficulty: "draw", yearsToExpect: "15-25 years", hook: "Apply every year. When you draw, it'll be the hunt of your life." },
  balanced: { species: "Bull Elk",                 state: "Colorado", tagline: "Colorado has the largest elk population on earth. Preference points grow value every year — many units draw in 5-7 years.", difficulty: "draw", yearsToExpect: "3-7 years",   hook: "Best ROI in western big game. Start accumulating points now." },
};
