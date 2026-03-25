/**
 * seed-multistate-deadlines.ts
 * 
 * Comprehensive 2026 hunting deadline seed for:
 * - All western draw states (UT, NM, NV, ID, MT, OR, WA, CA, SD, ND)
 * - Eastern special-opportunity states (PA elk, KY elk, VA elk, ME moose,
 *   NH moose, VT moose, MI moose, MN moose, WV elk)
 * 
 * AZ, CO, and WY are already seeded. Run this to fill the rest.
 * 
 * Run: DATABASE_URL=... npx tsx scripts/seed-multistate-deadlines.ts
 */

import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!);

// ── Species IDs (queried at runtime) ─────────────────────────────────────────
// slugs: elk, mule_deer, whitetail, pronghorn, bighorn_sheep, mountain_goat,
//        moose, black_bear, bison, mountain_lion, turkey, pheasant,
//        sandhill_crane, javelina, caribou

type DeadlineInput = {
  title: string;
  species: string | null; // slug
  deadline_date: string;  // YYYY-MM-DD
  deadline_type: string;
  description: string;
  url: string;
};

type StateBlock = {
  code: string;
  deadlines: DeadlineInput[];
};

const STATE_BLOCKS: StateBlock[] = [
  // ============================================================
  // UTAH
  // DWR: https://wildlife.utah.gov/licenses-and-permits/hunting/big-game-drawing.html
  // ============================================================
  {
    code: "UT",
    deadlines: [
      {
        title: "UT Big Game Draw Application Opens",
        species: "elk",
        deadline_date: "2026-01-06",
        deadline_type: "application_open",
        description: "Utah DWR big game draw opens for elk, deer, pronghorn, moose, bison, bighorn sheep, mountain goat, mountain lion, bear",
        url: "https://wildlife.utah.gov/licenses-and-permits/hunting/big-game-drawing.html",
      },
      {
        title: "UT Big Game Draw Application Deadline",
        species: "elk",
        deadline_date: "2026-02-03",
        deadline_type: "application_deadline",
        description: "Utah DWR big game draw application deadline — elk, deer, pronghorn, moose, bison, sheep, goat, bear, cougar",
        url: "https://wildlife.utah.gov/licenses-and-permits/hunting/big-game-drawing.html",
      },
      {
        title: "UT Big Game Draw Results",
        species: "elk",
        deadline_date: "2026-04-22",
        deadline_type: "draw_results",
        description: "Utah DWR big game draw results posted online",
        url: "https://wildlife.utah.gov/licenses-and-permits/hunting/big-game-drawing.html",
      },
      {
        title: "UT Leftover Licenses Go On Sale",
        species: "elk",
        deadline_date: "2026-05-05",
        deadline_type: "application_open",
        description: "Utah leftover licenses available first-come, first-served online",
        url: "https://wildlife.utah.gov/licenses-and-permits/hunting/big-game-drawing.html",
      },
      {
        title: "UT Once-in-a-Lifetime Draw Application Deadline",
        species: "moose",
        deadline_date: "2026-02-03",
        deadline_type: "application_deadline",
        description: "Utah once-in-a-lifetime permits (moose, bison, bighorn sheep, mountain goat, Rocky Mountain goat) — same window as big game draw",
        url: "https://wildlife.utah.gov/licenses-and-permits/hunting/big-game-drawing.html",
      },
      {
        title: "UT Spring Turkey Permit Deadline",
        species: "turkey",
        deadline_date: "2026-02-17",
        deadline_type: "application_deadline",
        description: "Utah spring turkey controlled permit application deadline",
        url: "https://wildlife.utah.gov/licenses-and-permits/hunting/big-game-drawing.html",
      },
    ],
  },

  // ============================================================
  // NEW MEXICO
  // NMDGF: https://www.wildlife.state.nm.us/hunting/draw/
  // ============================================================
  {
    code: "NM",
    deadlines: [
      {
        title: "NM Deer/Elk Draw Application Opens",
        species: "elk",
        deadline_date: "2026-01-05",
        deadline_type: "application_open",
        description: "New Mexico big game draw opens for elk, deer, pronghorn, oryx, ibex, Barbary sheep, black bear, turkey",
        url: "https://www.wildlife.state.nm.us/hunting/draw/",
      },
      {
        title: "NM Big Game Draw Application Deadline",
        species: "elk",
        deadline_date: "2026-02-04",
        deadline_type: "application_deadline",
        description: "New Mexico big game draw application deadline — includes elk, deer, pronghorn",
        url: "https://www.wildlife.state.nm.us/hunting/draw/",
      },
      {
        title: "NM Bighorn Sheep/Oryx/Ibex Draw Deadline",
        species: "bighorn_sheep",
        deadline_date: "2026-02-04",
        deadline_type: "application_deadline",
        description: "New Mexico once-in-a-lifetime species draw deadline — bighorn sheep, oryx, ibex, Barbary sheep",
        url: "https://www.wildlife.state.nm.us/hunting/draw/",
      },
      {
        title: "NM Draw Results Posted",
        species: "elk",
        deadline_date: "2026-04-01",
        deadline_type: "draw_results",
        description: "New Mexico big game draw results available online",
        url: "https://www.wildlife.state.nm.us/hunting/draw/",
      },
      {
        title: "NM Antelope Draw Application Deadline",
        species: "pronghorn",
        deadline_date: "2026-02-04",
        deadline_type: "application_deadline",
        description: "New Mexico pronghorn antelope draw deadline (included in big game draw window)",
        url: "https://www.wildlife.state.nm.us/hunting/draw/",
      },
      {
        title: "NM Turkey Draw Application Deadline",
        species: "turkey",
        deadline_date: "2026-02-04",
        deadline_type: "application_deadline",
        description: "New Mexico spring turkey draw application deadline",
        url: "https://www.wildlife.state.nm.us/hunting/draw/",
      },
      {
        title: "NM Leftover Licenses Available",
        species: "elk",
        deadline_date: "2026-05-01",
        deadline_type: "application_open",
        description: "New Mexico leftover licenses go on sale online — first-come, first-served",
        url: "https://www.wildlife.state.nm.us/hunting/draw/",
      },
    ],
  },

  // ============================================================
  // NEVADA
  // NDOW: https://www.ndow.org/hunting/big-game/
  // ============================================================
  {
    code: "NV",
    deadlines: [
      {
        title: "NV Big Game Draw Application Opens",
        species: "elk",
        deadline_date: "2026-02-01",
        deadline_type: "application_open",
        description: "Nevada NDOW big game draw opens for elk, deer, antelope, bighorn sheep, mountain goat, moose, bison, mountain lion, black bear",
        url: "https://www.ndow.org/hunting/big-game/",
      },
      {
        title: "NV Big Game Draw Application Deadline",
        species: "elk",
        deadline_date: "2026-03-09",
        deadline_type: "application_deadline",
        description: "Nevada big game draw application deadline — all species",
        url: "https://www.ndow.org/hunting/big-game/",
      },
      {
        title: "NV Draw Results Posted",
        species: "elk",
        deadline_date: "2026-06-01",
        deadline_type: "draw_results",
        description: "Nevada big game draw results available online",
        url: "https://www.ndow.org/hunting/big-game/",
      },
      {
        title: "NV Deer Tag Application Deadline",
        species: "mule_deer",
        deadline_date: "2026-03-09",
        deadline_type: "application_deadline",
        description: "Nevada mule deer and white-tailed deer draw deadline (included in big game draw)",
        url: "https://www.ndow.org/hunting/big-game/",
      },
      {
        title: "NV Bonus Point Purchase Deadline",
        species: "elk",
        deadline_date: "2026-03-09",
        deadline_type: "preference_point",
        description: "Nevada bonus point only applications must be submitted by draw deadline",
        url: "https://www.ndow.org/hunting/big-game/",
      },
    ],
  },

  // ============================================================
  // IDAHO
  // IDFG: https://idfg.idaho.gov/hunt/controlled-hunts
  // ============================================================
  {
    code: "ID",
    deadlines: [
      {
        title: "ID Controlled Hunt Application Opens",
        species: "elk",
        deadline_date: "2026-02-01",
        deadline_type: "application_open",
        description: "Idaho Fish & Game controlled hunt application period opens for elk, deer, antelope, bighorn sheep, mountain goat, moose",
        url: "https://idfg.idaho.gov/hunt/controlled-hunts",
      },
      {
        title: "ID Controlled Hunt Application Deadline",
        species: "elk",
        deadline_date: "2026-04-30",
        deadline_type: "application_deadline",
        description: "Idaho controlled hunt application deadline — elk, deer, pronghorn, sheep, goat, moose. Apply online at idfg.idaho.gov",
        url: "https://idfg.idaho.gov/hunt/controlled-hunts",
      },
      {
        title: "ID Controlled Hunt Draw Results",
        species: "elk",
        deadline_date: "2026-06-01",
        deadline_type: "draw_results",
        description: "Idaho controlled hunt draw results posted online",
        url: "https://idfg.idaho.gov/hunt/controlled-hunts",
      },
      {
        title: "ID Deer Controlled Hunt Deadline",
        species: "mule_deer",
        deadline_date: "2026-04-30",
        deadline_type: "application_deadline",
        description: "Idaho deer controlled hunt application deadline (included in main controlled hunt window)",
        url: "https://idfg.idaho.gov/hunt/controlled-hunts",
      },
      {
        title: "ID Moose/Sheep/Goat Draw Deadline",
        species: "moose",
        deadline_date: "2026-04-30",
        deadline_type: "application_deadline",
        description: "Idaho once-in-a-lifetime species draw — moose, bighorn sheep, mountain goat",
        url: "https://idfg.idaho.gov/hunt/controlled-hunts",
      },
      {
        title: "ID Spring Turkey Controlled Hunt Deadline",
        species: "turkey",
        deadline_date: "2026-02-15",
        deadline_type: "application_deadline",
        description: "Idaho spring turkey controlled hunt application deadline",
        url: "https://idfg.idaho.gov/hunt/controlled-hunts",
      },
    ],
  },

  // ============================================================
  // MONTANA
  // FWP: https://fwp.mt.gov/hunting
  // ============================================================
  {
    code: "MT",
    deadlines: [
      {
        title: "MT Combination License / Special Permit Application Opens",
        species: "elk",
        deadline_date: "2026-03-01",
        deadline_type: "application_open",
        description: "Montana FWP combination license sale opens; special permits (elk, deer, antelope, sheep, goat, moose, bison) application period opens",
        url: "https://fwp.mt.gov/hunting/licenses-and-permits/special-licenses",
      },
      {
        title: "MT Special Permit Application Deadline",
        species: "elk",
        deadline_date: "2026-05-01",
        deadline_type: "application_deadline",
        description: "Montana special permit application deadline — elk, deer, antelope, moose, bighorn sheep, mountain goat, bison",
        url: "https://fwp.mt.gov/hunting/licenses-and-permits/special-licenses",
      },
      {
        title: "MT Special Permit Draw Results",
        species: "elk",
        deadline_date: "2026-06-15",
        deadline_type: "draw_results",
        description: "Montana special permit draw results posted online",
        url: "https://fwp.mt.gov/hunting/licenses-and-permits/special-licenses",
      },
      {
        title: "MT Antelope Permit Deadline",
        species: "pronghorn",
        deadline_date: "2026-05-01",
        deadline_type: "application_deadline",
        description: "Montana antelope special permit application deadline (included in main permit window)",
        url: "https://fwp.mt.gov/hunting/licenses-and-permits/special-licenses",
      },
      {
        title: "MT Conservation License Required",
        species: null,
        deadline_date: "2026-03-01",
        deadline_type: "other",
        description: "Montana conservation license required before purchasing hunting licenses or special permits. Available year-round but needed to apply.",
        url: "https://fwp.mt.gov/hunting/licenses-and-permits",
      },
      {
        title: "MT Bighorn Sheep/Mountain Goat Draw Deadline",
        species: "bighorn_sheep",
        deadline_date: "2026-05-01",
        deadline_type: "application_deadline",
        description: "Montana once-in-a-lifetime bighorn sheep and mountain goat permit draw deadline",
        url: "https://fwp.mt.gov/hunting/licenses-and-permits/special-licenses",
      },
    ],
  },

  // ============================================================
  // OREGON
  // ODFW: https://www.dfw.state.or.us/resources/licenses_regs/draw_hunts.asp
  // ============================================================
  {
    code: "OR",
    deadlines: [
      {
        title: "OR Limited Entry Draw Application Opens",
        species: "elk",
        deadline_date: "2026-01-10",
        deadline_type: "application_open",
        description: "Oregon ODFW limited entry draw application period opens for elk, deer, antelope, bighorn sheep, mountain goat, moose, bear, turkey",
        url: "https://www.dfw.state.or.us/resources/licenses_regs/draw_hunts.asp",
      },
      {
        title: "OR Limited Entry Draw Application Deadline",
        species: "elk",
        deadline_date: "2026-03-15",
        deadline_type: "application_deadline",
        description: "Oregon limited entry draw application deadline — elk, deer, antelope, bighorn sheep, mountain goat, moose. Apply online at myodfw.com",
        url: "https://www.dfw.state.or.us/resources/licenses_regs/draw_hunts.asp",
      },
      {
        title: "OR Draw Results Posted",
        species: "elk",
        deadline_date: "2026-05-15",
        deadline_type: "draw_results",
        description: "Oregon limited entry draw results available online",
        url: "https://www.dfw.state.or.us/resources/licenses_regs/draw_hunts.asp",
      },
      {
        title: "OR Preference Point Application Deadline",
        species: "elk",
        deadline_date: "2026-03-15",
        deadline_type: "preference_point",
        description: "Oregon preference point only applications due with limited entry draw deadline",
        url: "https://www.dfw.state.or.us/resources/licenses_regs/draw_hunts.asp",
      },
      {
        title: "OR Controlled Turkey Hunt Deadline",
        species: "turkey",
        deadline_date: "2026-03-15",
        deadline_type: "application_deadline",
        description: "Oregon controlled turkey hunt application deadline (included in main draw window)",
        url: "https://www.dfw.state.or.us/resources/licenses_regs/draw_hunts.asp",
      },
    ],
  },

  // ============================================================
  // WASHINGTON
  // WDFW: https://wdfw.wa.gov/hunting/permits
  // ============================================================
  {
    code: "WA",
    deadlines: [
      {
        title: "WA Special Hunt Permit Application Opens",
        species: "elk",
        deadline_date: "2026-05-01",
        deadline_type: "application_open",
        description: "Washington WDFW special hunt permit application period opens for elk, deer, moose, bighorn sheep, mountain goat, turkey",
        url: "https://wdfw.wa.gov/hunting/permits",
      },
      {
        title: "WA Special Hunt Permit Application Deadline",
        species: "elk",
        deadline_date: "2026-06-15",
        deadline_type: "application_deadline",
        description: "Washington special hunt permit application deadline — elk, deer, moose, bighorn sheep, mountain goat, turkey. Apply at licensing.wdfw.wa.gov",
        url: "https://wdfw.wa.gov/hunting/permits",
      },
      {
        title: "WA Special Hunt Permit Draw Results",
        species: "elk",
        deadline_date: "2026-07-31",
        deadline_type: "draw_results",
        description: "Washington special hunt permit draw results posted online",
        url: "https://wdfw.wa.gov/hunting/permits",
      },
      {
        title: "WA Deer Special Permit Deadline",
        species: "whitetail",
        deadline_date: "2026-06-15",
        deadline_type: "application_deadline",
        description: "Washington deer special hunt permit deadline — mule deer and whitetail (included in main draw window)",
        url: "https://wdfw.wa.gov/hunting/permits",
      },
      {
        title: "WA Moose/Sheep/Goat Draw Deadline",
        species: "moose",
        deadline_date: "2026-06-15",
        deadline_type: "application_deadline",
        description: "Washington once-in-a-lifetime species draw — moose, bighorn sheep, mountain goat",
        url: "https://wdfw.wa.gov/hunting/permits",
      },
    ],
  },

  // ============================================================
  // CALIFORNIA
  // CDFW: https://wildlife.ca.gov/hunting/deer
  // ============================================================
  {
    code: "CA",
    deadlines: [
      {
        title: "CA Deer Tag Application Opens",
        species: "mule_deer",
        deadline_date: "2026-04-01",
        deadline_type: "application_open",
        description: "California CDFW deer tag application period opens for controlled deer zones",
        url: "https://wildlife.ca.gov/hunting/deer",
      },
      {
        title: "CA Deer Tag Application Deadline",
        species: "mule_deer",
        deadline_date: "2026-06-02",
        deadline_type: "application_deadline",
        description: "California deer tag application deadline for controlled deer hunting zones. Apply at wildlife.ca.gov",
        url: "https://wildlife.ca.gov/hunting/deer",
      },
      {
        title: "CA Deer Tag Draw Results",
        species: "mule_deer",
        deadline_date: "2026-08-01",
        deadline_type: "draw_results",
        description: "California deer tag draw results posted online",
        url: "https://wildlife.ca.gov/hunting/deer",
      },
      {
        title: "CA Elk Tag Application Deadline",
        species: "elk",
        deadline_date: "2026-06-02",
        deadline_type: "application_deadline",
        description: "California elk tag application deadline — Roosevelt, tule, and Rocky Mountain elk. Extremely limited tags.",
        url: "https://wildlife.ca.gov/hunting/elk",
      },
      {
        title: "CA Bighorn Sheep Tag Deadline",
        species: "bighorn_sheep",
        deadline_date: "2026-06-02",
        deadline_type: "application_deadline",
        description: "California bighorn sheep tag application deadline — desert and Sierra Nevada bighorn. Very limited; included in main draw window.",
        url: "https://wildlife.ca.gov/hunting/bighorn-sheep",
      },
      {
        title: "CA Bear Tag — License Year Opens",
        species: "black_bear",
        deadline_date: "2026-07-01",
        deadline_type: "application_open",
        description: "California bear season opens July 1; tags available over-the-counter while quotas last",
        url: "https://wildlife.ca.gov/hunting/bear",
      },
    ],
  },

  // ============================================================
  // SOUTH DAKOTA
  // GFP: https://gfp.sd.gov/hunting/
  // ============================================================
  {
    code: "SD",
    deadlines: [
      {
        title: "SD Custer State Park Buffalo Roundup Lottery",
        species: "bison",
        deadline_date: "2026-02-28",
        deadline_type: "application_deadline",
        description: "South Dakota Custer State Park bison hunting lottery application deadline",
        url: "https://gfp.sd.gov/custer-state-park-buffalo-hunt/",
      },
      {
        title: "SD Big Game License Application Opens",
        species: "mule_deer",
        deadline_date: "2026-08-01",
        deadline_type: "application_open",
        description: "South Dakota big game license application period opens for deer, antelope, elk, mountain goat, bighorn sheep",
        url: "https://gfp.sd.gov/hunting/",
      },
      {
        title: "SD Big Game License Application Deadline",
        species: "mule_deer",
        deadline_date: "2026-08-26",
        deadline_type: "application_deadline",
        description: "South Dakota big game license application deadline — deer, pronghorn, elk, bighorn sheep, mountain goat",
        url: "https://gfp.sd.gov/hunting/",
      },
      {
        title: "SD Big Game Draw Results",
        species: "mule_deer",
        deadline_date: "2026-09-15",
        deadline_type: "draw_results",
        description: "South Dakota big game draw results posted online",
        url: "https://gfp.sd.gov/hunting/",
      },
      {
        title: "SD Elk License Application Deadline",
        species: "elk",
        deadline_date: "2026-08-26",
        deadline_type: "application_deadline",
        description: "South Dakota elk license application deadline (included in big game draw window)",
        url: "https://gfp.sd.gov/hunting/",
      },
      {
        title: "SD Antelope License Application Deadline",
        species: "pronghorn",
        deadline_date: "2026-08-26",
        deadline_type: "application_deadline",
        description: "South Dakota antelope license application deadline (included in big game draw window)",
        url: "https://gfp.sd.gov/hunting/",
      },
    ],
  },

  // ============================================================
  // NORTH DAKOTA
  // NDGFD: https://gf.nd.gov/hunting
  // ============================================================
  {
    code: "ND",
    deadlines: [
      {
        title: "ND Big Game Application Opens",
        species: "mule_deer",
        deadline_date: "2026-08-01",
        deadline_type: "application_open",
        description: "North Dakota Game & Fish big game license application period opens for deer, elk, antelope, moose, bighorn sheep, mountain goat",
        url: "https://gf.nd.gov/hunting",
      },
      {
        title: "ND Big Game Application Deadline",
        species: "mule_deer",
        deadline_date: "2026-09-01",
        deadline_type: "application_deadline",
        description: "North Dakota big game license application deadline — deer, elk, pronghorn, moose, bighorn sheep, mountain goat",
        url: "https://gf.nd.gov/hunting",
      },
      {
        title: "ND Big Game Draw Results",
        species: "mule_deer",
        deadline_date: "2026-09-20",
        deadline_type: "draw_results",
        description: "North Dakota big game draw results posted online",
        url: "https://gf.nd.gov/hunting",
      },
      {
        title: "ND Elk License Application Deadline",
        species: "elk",
        deadline_date: "2026-09-01",
        deadline_type: "application_deadline",
        description: "North Dakota elk license application deadline — Rocky Mountain and archery zones (included in big game draw)",
        url: "https://gf.nd.gov/hunting",
      },
    ],
  },

  // ============================================================
  // PENNSYLVANIA — Elk draw (only eastern state with draw elk)
  // PGCA: https://www.pgc.pa.gov/wildlife/elk
  // ============================================================
  {
    code: "PA",
    deadlines: [
      {
        title: "PA Elk License Application Opens",
        species: "elk",
        deadline_date: "2026-06-01",
        deadline_type: "application_open",
        description: "Pennsylvania Game Commission elk license application period opens. PA has one of the premier eastern elk herds; tags are extremely limited and competitive.",
        url: "https://www.pgc.pa.gov/wildlife/elk/pages/elklicensing.aspx",
      },
      {
        title: "PA Elk License Application Deadline",
        species: "elk",
        deadline_date: "2026-06-30",
        deadline_type: "application_deadline",
        description: "Pennsylvania elk license application deadline. Apply online at huntfish.pa.gov. Preference system rewards applicants who have applied in prior years.",
        url: "https://www.pgc.pa.gov/wildlife/elk/pages/elklicensing.aspx",
      },
      {
        title: "PA Elk License Draw Results",
        species: "elk",
        deadline_date: "2026-07-31",
        deadline_type: "draw_results",
        description: "Pennsylvania elk license draw results announced — successful applicants notified",
        url: "https://www.pgc.pa.gov/wildlife/elk/pages/elklicensing.aspx",
      },
    ],
  },

  // ============================================================
  // KENTUCKY — Rocky Mountain Elk draw (reintroduced herd, eastern KY)
  // KDFWR: https://fw.ky.gov/hunt/Pages/Elk.aspx
  // ============================================================
  {
    code: "KY",
    deadlines: [
      {
        title: "KY Elk Application Opens",
        species: "elk",
        deadline_date: "2025-12-01",
        deadline_type: "application_open",
        description: "Kentucky Fish & Wildlife elk application period opens. KY has the largest elk herd east of the Mississippi — nearly 14,000 animals. Draws are conducted in December-January.",
        url: "https://fw.ky.gov/hunt/Pages/Elk.aspx",
      },
      {
        title: "KY Elk Application Deadline",
        species: "elk",
        deadline_date: "2026-01-15",
        deadline_type: "application_deadline",
        description: "Kentucky elk application deadline. Apply at gooutdoorskentucky.com. Lottery-based; applicants can apply for archery, crossbow, and firearm seasons.",
        url: "https://fw.ky.gov/hunt/Pages/Elk.aspx",
      },
      {
        title: "KY Elk Draw Results",
        species: "elk",
        deadline_date: "2026-02-28",
        deadline_type: "draw_results",
        description: "Kentucky elk draw results announced. Seasons run September-January across multiple weapon types.",
        url: "https://fw.ky.gov/hunt/Pages/Elk.aspx",
      },
    ],
  },

  // ============================================================
  // VIRGINIA — Rocky Mountain Elk draw (limited zones in SW VA)
  // VDWR: https://dwr.virginia.gov/hunting/elk/
  // ============================================================
  {
    code: "VA",
    deadlines: [
      {
        title: "VA Elk Application Opens",
        species: "elk",
        deadline_date: "2026-02-01",
        deadline_type: "application_open",
        description: "Virginia DWR elk hunting application period opens. Very limited tags in designated elk zones of southwestern Virginia (Buchanan, Dickenson, Russell, Wise counties).",
        url: "https://dwr.virginia.gov/hunting/elk/",
      },
      {
        title: "VA Elk Application Deadline",
        species: "elk",
        deadline_date: "2026-03-31",
        deadline_type: "application_deadline",
        description: "Virginia elk application deadline. Apply at vdwr.virginia.gov. Extremely limited permits — archery and firearm seasons.",
        url: "https://dwr.virginia.gov/hunting/elk/",
      },
      {
        title: "VA Elk Draw Results",
        species: "elk",
        deadline_date: "2026-05-15",
        deadline_type: "draw_results",
        description: "Virginia elk draw results announced",
        url: "https://dwr.virginia.gov/hunting/elk/",
      },
    ],
  },

  // ============================================================
  // MAINE — Moose lottery (one of the most prized eastern permits)
  // MDIFW: https://www.maine.gov/ifw/hunting-trapping/hunting/moose/index.html
  // ============================================================
  {
    code: "ME",
    deadlines: [
      {
        title: "ME Moose Lottery Application Opens",
        species: "moose",
        deadline_date: "2026-03-01",
        deadline_type: "application_open",
        description: "Maine Department of Inland Fisheries & Wildlife moose permit lottery application period opens. Maine issues ~3,000 moose permits annually — one of the largest moose hunts in the eastern US.",
        url: "https://www.maine.gov/ifw/hunting-trapping/hunting/moose/index.html",
      },
      {
        title: "ME Moose Lottery Application Deadline",
        species: "moose",
        deadline_date: "2026-05-15",
        deadline_type: "application_deadline",
        description: "Maine moose permit lottery application deadline. Apply online at maine.gov/ifw. Bonus point system — each unsuccessful application adds one chance.",
        url: "https://www.maine.gov/ifw/hunting-trapping/hunting/moose/index.html",
      },
      {
        title: "ME Moose Lottery Draw Results",
        species: "moose",
        deadline_date: "2026-06-30",
        deadline_type: "draw_results",
        description: "Maine moose lottery winners drawn and announced — held at a public event",
        url: "https://www.maine.gov/ifw/hunting-trapping/hunting/moose/index.html",
      },
    ],
  },

  // ============================================================
  // NEW HAMPSHIRE — Moose lottery
  // NHFGD: https://www.wildlife.nh.gov/hunting/moose-hunting.html
  // ============================================================
  {
    code: "NH",
    deadlines: [
      {
        title: "NH Moose Permit Application Opens",
        species: "moose",
        deadline_date: "2026-01-15",
        deadline_type: "application_open",
        description: "New Hampshire Fish & Game moose permit application period opens. NH issues roughly 50-75 moose permits per year — very competitive lottery.",
        url: "https://www.wildlife.nh.gov/hunting/moose-hunting.html",
      },
      {
        title: "NH Moose Permit Application Deadline",
        species: "moose",
        deadline_date: "2026-04-15",
        deadline_type: "application_deadline",
        description: "New Hampshire moose permit application deadline. Apply online at nhfishandgame.com.",
        url: "https://www.wildlife.nh.gov/hunting/moose-hunting.html",
      },
      {
        title: "NH Moose Permit Draw Results",
        species: "moose",
        deadline_date: "2026-05-31",
        deadline_type: "draw_results",
        description: "New Hampshire moose permit lottery results announced",
        url: "https://www.wildlife.nh.gov/hunting/moose-hunting.html",
      },
    ],
  },

  // ============================================================
  // VERMONT — Moose lottery
  // VFWD: https://vtfishandwildlife.com/hunt/hunting-opportunities/moose
  // ============================================================
  {
    code: "VT",
    deadlines: [
      {
        title: "VT Moose Permit Application Opens",
        species: "moose",
        deadline_date: "2026-02-01",
        deadline_type: "application_open",
        description: "Vermont Fish & Wildlife moose permit lottery application period opens. VT issues approximately 40-60 moose permits per year.",
        url: "https://vtfishandwildlife.com/hunt/hunting-opportunities/moose",
      },
      {
        title: "VT Moose Permit Application Deadline",
        species: "moose",
        deadline_date: "2026-04-30",
        deadline_type: "application_deadline",
        description: "Vermont moose permit application deadline. Apply online at vtfishandwildlife.com.",
        url: "https://vtfishandwildlife.com/hunt/hunting-opportunities/moose",
      },
      {
        title: "VT Moose Permit Draw Results",
        species: "moose",
        deadline_date: "2026-06-15",
        deadline_type: "draw_results",
        description: "Vermont moose permit lottery results announced",
        url: "https://vtfishandwildlife.com/hunt/hunting-opportunities/moose",
      },
    ],
  },

  // ============================================================
  // MICHIGAN — Moose license lottery (Upper Peninsula)
  // MDNR: https://www.michigan.gov/dnr/managing-resources/wildlife/moose
  // ============================================================
  {
    code: "MI",
    deadlines: [
      {
        title: "MI Moose License Application Opens",
        species: "moose",
        deadline_date: "2026-05-01",
        deadline_type: "application_open",
        description: "Michigan DNR moose license lottery application period opens. Upper Peninsula only — Michigan issues roughly 100 moose licenses per year, one of the larger eastern moose hunts.",
        url: "https://www.michigan.gov/dnr/managing-resources/wildlife/moose",
      },
      {
        title: "MI Moose License Application Deadline",
        species: "moose",
        deadline_date: "2026-06-15",
        deadline_type: "application_deadline",
        description: "Michigan moose license application deadline. Apply at michigan.gov/dnr.",
        url: "https://www.michigan.gov/dnr/managing-resources/wildlife/moose",
      },
      {
        title: "MI Moose License Draw Results",
        species: "moose",
        deadline_date: "2026-07-31",
        deadline_type: "draw_results",
        description: "Michigan moose license lottery results announced — Upper Peninsula zones",
        url: "https://www.michigan.gov/dnr/managing-resources/wildlife/moose",
      },
    ],
  },

  // ============================================================
  // MINNESOTA — Moose and deer lottery
  // MNDNR: https://www.dnr.state.mn.us/hunting/moose/index.html
  // ============================================================
  {
    code: "MN",
    deadlines: [
      {
        title: "MN Moose Permit Application Opens",
        species: "moose",
        deadline_date: "2026-07-01",
        deadline_type: "application_open",
        description: "Minnesota DNR moose hunting permit application period opens. Northeastern MN only — very limited permits, lottery system. Population has declined significantly in recent decades.",
        url: "https://www.dnr.state.mn.us/hunting/moose/index.html",
      },
      {
        title: "MN Moose Permit Application Deadline",
        species: "moose",
        deadline_date: "2026-08-01",
        deadline_type: "application_deadline",
        description: "Minnesota moose permit application deadline. Apply at license.dnr.state.mn.us.",
        url: "https://www.dnr.state.mn.us/hunting/moose/index.html",
      },
      {
        title: "MN Moose Permit Draw Results",
        species: "moose",
        deadline_date: "2026-08-20",
        deadline_type: "draw_results",
        description: "Minnesota moose permit lottery results announced",
        url: "https://www.dnr.state.mn.us/hunting/moose/index.html",
      },
    ],
  },

  // ============================================================
  // WEST VIRGINIA — Rocky Mountain Elk draw (reintroduced herd)
  // WVDNR: https://wvdnr.gov/hunting/elk/
  // ============================================================
  {
    code: "WV",
    deadlines: [
      {
        title: "WV Elk License Application Opens",
        species: "elk",
        deadline_date: "2026-01-15",
        deadline_type: "application_open",
        description: "West Virginia DNR elk license application period opens. WV has one of the newest eastern elk herds — reintroduced in the 1990s and 2010s. Very limited tags in select counties.",
        url: "https://wvdnr.gov/hunting/elk/",
      },
      {
        title: "WV Elk License Application Deadline",
        species: "elk",
        deadline_date: "2026-03-31",
        deadline_type: "application_deadline",
        description: "West Virginia elk license application deadline. Apply at wvhuntingandfish.com. Preference points system.",
        url: "https://wvdnr.gov/hunting/elk/",
      },
      {
        title: "WV Elk License Draw Results",
        species: "elk",
        deadline_date: "2026-05-01",
        deadline_type: "draw_results",
        description: "West Virginia elk license draw results announced",
        url: "https://wvdnr.gov/hunting/elk/",
      },
    ],
  },
];

// =============================================================================
// Main
// =============================================================================

async function main() {
  console.log("=== Multi-State Deadline Seed ===\n");

  // Fetch state IDs
  const stateRows = await sql`SELECT id, code FROM states`;
  const stateMap: Record<string, string> = {};
  for (const s of stateRows) stateMap[s.code] = s.id;

  // Fetch species IDs
  const speciesRows = await sql`SELECT id, slug FROM species`;
  const speciesMap: Record<string, string> = {};
  for (const s of speciesRows) speciesMap[s.slug] = s.id;

  console.log("States in DB:", Object.keys(stateMap).sort().join(", "));
  console.log("Species in DB:", Object.keys(speciesMap).sort().join(", "));
  console.log();

  let totalInserted = 0;
  let totalSkipped = 0;
  const stateSummary: Record<string, number> = {};

  for (const block of STATE_BLOCKS) {
    const stateId = stateMap[block.code];
    if (!stateId) {
      console.warn(`⚠️  State ${block.code} not found in DB — skipping`);
      continue;
    }

    console.log(`\n── ${block.code} (${block.deadlines.length} deadlines) ──`);
    let inserted = 0;

    for (const d of block.deadlines) {
      const speciesId = d.species ? (speciesMap[d.species] ?? null) : null;
      if (d.species && !speciesId) {
        console.warn(`  ⚠️  Species "${d.species}" not found — inserting without species`);
      }

      const year = parseInt(d.deadline_date.slice(0, 4), 10);

      try {
        const result = await sql`
          INSERT INTO deadlines (
            state_id, species_id, title, deadline_date,
            deadline_type, description, year, url, created_at
          )
          VALUES (
            ${stateId},
            ${speciesId},
            ${d.title},
            ${d.deadline_date},
            ${d.deadline_type},
            ${d.description},
            ${year},
            ${d.url},
            NOW()
          )
          ON CONFLICT DO NOTHING
          RETURNING id
        `;

        if (result.length > 0) {
          console.log(`  ✓ ${d.title} (${d.deadline_date})`);
          inserted++;
        } else {
          console.log(`  · already exists: ${d.title}`);
          totalSkipped++;
        }
      } catch (err: any) {
        console.error(`  ✗ ${d.title}: ${err.message}`);
      }
    }

    stateSummary[block.code] = inserted;
    totalInserted += inserted;
  }

  // Summary
  console.log("\n=== Summary ===");
  for (const [code, count] of Object.entries(stateSummary)) {
    console.log(`  ${code}: +${count} inserted`);
  }
  console.log(`\nTotal inserted: ${totalInserted}`);
  console.log(`Already existed (skipped): ${totalSkipped}`);

  // Full DB count
  const allCounts = await sql`
    SELECT s.code, COUNT(*) as cnt
    FROM deadlines d
    JOIN states s ON d.state_id = s.id
    GROUP BY s.code
    ORDER BY s.code
  `;
  console.log("\n=== All Deadlines by State (DB total) ===");
  for (const r of allCounts) {
    console.log(`  ${r.code}: ${r.cnt}`);
  }

  await sql.end();
  console.log("\n✅ Done");
}

main().catch((err) => {
  console.error("❌ Fatal:", err.message);
  console.error(err.stack);
  process.exit(1);
});
