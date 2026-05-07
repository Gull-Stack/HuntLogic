// =============================================================================
// Unique Hunting Opportunities — curated list of overlooked / lottery hunts
// =============================================================================
// Surfaced on /explore as a horizontal carousel above the state/species views.
// Each entry should be a hunt that's NOT obvious to a default hunter — special
// lotteries, regional secrets, NR-friendly OTC pockets, point-poor windows, etc.
//
// Authoritative sources are the linked state agency pages. When changing or
// adding entries, verify the deadline / eligibility against the agency page.
// =============================================================================

export interface UniqueOpportunity {
  /** Stable id for keys + future user-facing favoriting. */
  id: string;
  /** State USPS code, e.g. "KY", "ND". Used for deep-linking. */
  stateCode: string;
  /** Species slug (lowercase, underscore-separated). Used for deep-linking. */
  speciesSlug: string;
  /** Short headline — keep under 60 chars. */
  title: string;
  /** One-line blurb, 1-2 sentences. */
  blurb: string;
  /** Tag access pattern: lottery (random/quota), draw (preference/bonus), otc, leftover. */
  tagAccess: "lottery" | "draw" | "otc" | "leftover";
  /** Approximate residency requirement / quota note. */
  eligibility: string;
  /** Approximate application deadline window (no specific date — rotate annually). */
  applicationWindow: string;
  /** Optional link to the agency page documenting the hunt. */
  agencyUrl?: string;
}

// -----------------------------------------------------------------------------
// Curated opportunities (alphabetical by stateCode)
// -----------------------------------------------------------------------------
export const UNIQUE_OPPORTUNITIES: UniqueOpportunity[] = [
  {
    id: "ky-elk-lottery",
    stateCode: "KY",
    speciesSlug: "elk",
    title: "Kentucky elk lottery — eastern OTC-style draw",
    blurb:
      "Kentucky reintroduced elk in the late 90s and now runs an annual lottery for ~700 tags. NR eligible, no points required, and the elk zone covers ~16 counties of reclaimed mine land with surprisingly strong success rates.",
    tagAccess: "lottery",
    eligibility: "Resident + nonresident; no point system",
    applicationWindow: "Open ~late April, closes ~end of April",
    agencyUrl: "https://fw.ky.gov/Hunt/Pages/Elk.aspx",
  },
  {
    id: "nd-early-teal",
    stateCode: "ND",
    speciesSlug: "waterfowl",
    title: "North Dakota early teal — overlooked September action",
    blurb:
      "First two weeks of September with NR-friendly OTC licensing and a 6-bird daily limit. Pothole country during early migration is the closest thing to volume waterfowl hunting most NRs will see.",
    tagAccess: "otc",
    eligibility: "Nonresident license + HIP; no draw",
    applicationWindow: "OTC — buy any time before the season",
    agencyUrl: "https://gf.nd.gov/regulations/waterfowl-hunting",
  },
  {
    id: "sd-early-canada-goose",
    stateCode: "SD",
    speciesSlug: "waterfowl",
    title: "South Dakota early Canada goose — September unlimited",
    blurb:
      "Resident-leaning but NR licenses available. Early season geese on cut wheat and corn fields are aggressive to decoys — 8 daily / 24 possession in most zones during the September window.",
    tagAccess: "otc",
    eligibility: "Resident + nonresident; HIP required",
    applicationWindow: "OTC — buy before the season",
    agencyUrl:
      "https://gfp.sd.gov/hunting/migratory-bird/canada-goose/",
  },
  {
    id: "az-strip-archery-deer",
    stateCode: "AZ",
    speciesSlug: "mule_deer",
    title: "Arizona Strip archery deer — points-poor giant-mule-deer window",
    blurb:
      "August archery hunts for mule deer on the AZ Strip (units 13A/13B) sometimes leftover after the main draw. NR eligible. Same country that produces the biggest archery mule deer in the country.",
    tagAccess: "leftover",
    eligibility: "Nonresident eligible (10% NR cap)",
    applicationWindow: "Main app February; leftovers ~July",
    agencyUrl: "https://www.azgfd.com/hunting/draw-info/",
  },
  {
    id: "wy-area-124-cow-elk",
    stateCode: "WY",
    speciesSlug: "elk",
    title: "Wyoming Area 124 cow elk — 100% draw at zero points",
    blurb:
      "General license cow tag with ~25% success and a 6-day OTC-style season. NR eligible, ~$336 tag. Best 'just go elk hunting this year' option in the West for a points-poor hunter.",
    tagAccess: "draw",
    eligibility: "Nonresident eligible; preference points used but 100% draw",
    applicationWindow: "Apply by January 31",
    agencyUrl: "https://wgfd.wyo.gov/Hunting/Apply-to-Hunt",
  },
  {
    id: "ky-spring-turkey-resident-quota",
    stateCode: "KY",
    speciesSlug: "turkey",
    title: "Kentucky spring turkey — quota hunts on WMAs",
    blurb:
      "Several state WMAs run separate quota draws for spring turkey on top of the general OTC season. NR eligible; pressure is dramatically lower than general-season public land.",
    tagAccess: "lottery",
    eligibility: "Resident + nonresident; per-WMA quotas",
    applicationWindow: "Late winter, varies by WMA",
    agencyUrl: "https://fw.ky.gov/Hunt/Pages/Quota-Hunt-Drawings.aspx",
  },
  {
    id: "id-otc-archery-elk",
    stateCode: "ID",
    speciesSlug: "elk",
    title: "Idaho OTC archery elk — NR-eligible general tag",
    blurb:
      "One of the few western states still selling true OTC NR archery elk tags (capped, sells out fast). Big public-land country in the Selway, Salmon, and Boise zones.",
    tagAccess: "otc",
    eligibility: "Nonresident; NR cap, sells out early",
    applicationWindow: "Sale opens December 1",
    agencyUrl: "https://idfg.idaho.gov/hunt/big-game",
  },
];
