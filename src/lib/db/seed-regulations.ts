// =============================================================================
// HuntLogic — State Regulations Seed Script
// =============================================================================
// Usage: npx tsx src/lib/db/seed-regulations.ts
// Idempotent — safe to re-run (uses onConflictDoNothing).
// Seeds regulation document URLs for all 50 US states.
// =============================================================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { states } from "./schema/hunting";
import { stateRegulations } from "./schema/regulations";

// ---------------------------------------------------------------------------
// Connect to database
// ---------------------------------------------------------------------------
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  process.exit(1);
}

const client = postgres(connectionString, { max: 1 });
const db = drizzle(client);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
type RegulationEntry = {
  docType: string;
  title: string;
  url: string;
  format?: string;
  year?: number;
  description?: string;
};

type StateRegulationData = {
  [stateCode: string]: RegulationEntry[];
};

// ---------------------------------------------------------------------------
// 50-State Regulation Data
// ---------------------------------------------------------------------------

const regulationData: StateRegulationData = {
  // =========================================================================
  // WESTERN DRAW STATES (primary focus — most detailed)
  // =========================================================================

  AZ: [
    { docType: "general_hunting", title: "Arizona Hunting Regulations", url: "https://www.azgfd.com/hunting/regulations/", format: "html", year: 2026, description: "Main hunting regulations landing page" },
    { docType: "big_game_field_regs", title: "Arizona Big Game Regulations", url: "https://www.azgfd.com/hunting/regulations/big-game-seasons/", format: "html", year: 2026, description: "Big game season dates, bag limits, and field regulations" },
    { docType: "big_game_application", title: "Arizona Hunt Draw Information", url: "https://www.azgfd.com/hunting/draw-information/", format: "html", year: 2026, description: "Draw application procedures and deadlines" },
    { docType: "admin_rules", title: "Arizona Game & Fish Commission Rules", url: "https://www.azgfd.com/agency/commission/rules/", format: "html", description: "Administrative rules and commission orders" },
    { docType: "turkey", title: "Arizona Turkey Regulations", url: "https://www.azgfd.com/hunting/regulations/turkey/", format: "html", year: 2026, description: "Turkey hunting season and regulations" },
    { docType: "upland_game", title: "Arizona Small Game Regulations", url: "https://www.azgfd.com/hunting/regulations/small-game/", format: "html", year: 2026, description: "Small game and upland bird hunting regulations" },
    { docType: "waterfowl", title: "Arizona Waterfowl Regulations", url: "https://www.azgfd.com/hunting/regulations/waterfowl/", format: "html", year: 2026, description: "Waterfowl and migratory bird regulations" },
  ],

  CO: [
    { docType: "general_hunting", title: "Colorado Hunting Regulations", url: "https://cpw.state.co.us/activities/hunting", format: "html", year: 2026, description: "Main hunting regulations and information" },
    { docType: "big_game_field_regs", title: "Colorado Big Game Brochure", url: "https://cpw.state.co.us/activities/hunting/big-game", format: "html", year: 2026, description: "Big game hunting info with seasons, units, and regulations" },
    { docType: "big_game_application", title: "Colorado Big Game Draw Application", url: "https://cpw.state.co.us/hunting/big-game/primary-draw", format: "html", year: 2026, description: "Big game limited license draw application information" },
    { docType: "admin_rules", title: "Colorado Parks & Wildlife Regulations", url: "https://cpw.state.co.us/rules-and-regulations", format: "html", description: "Administrative rules and regulations" },
    { docType: "turkey", title: "Colorado Turkey Hunting", url: "https://cpw.state.co.us/activities/hunting/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Colorado Small Game Hunting", url: "https://cpw.state.co.us/activities/hunting/small-game", format: "html", year: 2026, description: "Small game and upland bird regulations" },
    { docType: "waterfowl", title: "Colorado Waterfowl Hunting", url: "https://cpw.state.co.us/activities/hunting/waterfowl-hunting", format: "html", year: 2026, description: "Waterfowl and migratory bird regulations" },
  ],

  WY: [
    { docType: "general_hunting", title: "Wyoming Hunting Regulations", url: "https://wgfd.wyo.gov/Hunting", format: "html", year: 2026, description: "Main hunting page with season info and regulations" },
    { docType: "big_game_field_regs", title: "Wyoming Big Game Regulations", url: "https://wgfd.wyo.gov/Regulations/Regulation-PDFs/Hunt-Regulation-PDFs", format: "html", year: 2026, description: "Big game hunting regulation PDFs by species" },
    { docType: "big_game_application", title: "Wyoming Big Game License Application", url: "https://wgfd.wyo.gov/Hunting/Drawing-Applications", format: "html", year: 2026, description: "Drawing application information and deadlines" },
    { docType: "admin_rules", title: "Wyoming Game & Fish Commission Rules", url: "https://wgfd.wyo.gov/Regulations/WGFC-Regulations", format: "html", description: "Commission regulations and administrative rules" },
    { docType: "turkey", title: "Wyoming Turkey Regulations", url: "https://wgfd.wyo.gov/Hunting/Turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Wyoming Upland Game Bird Regulations", url: "https://wgfd.wyo.gov/Hunting/Upland-Game-Birds", format: "html", year: 2026, description: "Upland game bird hunting regulations" },
    { docType: "waterfowl", title: "Wyoming Waterfowl Regulations", url: "https://wgfd.wyo.gov/Hunting/Waterfowl", format: "html", year: 2026, description: "Waterfowl and migratory bird regulations" },
  ],

  MT: [
    { docType: "general_hunting", title: "Montana Hunting Regulations", url: "https://fwp.mt.gov/hunt/regulations", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Montana Big Game Regulations", url: "https://fwp.mt.gov/hunt/regulations/big-game", format: "html", year: 2026, description: "Big game hunting regulations and season dates" },
    { docType: "big_game_application", title: "Montana Hunting Permits & Licenses", url: "https://fwp.mt.gov/hunt/licenses-permits", format: "html", year: 2026, description: "License and permit application information" },
    { docType: "admin_rules", title: "Montana Fish, Wildlife & Parks ARM Rules", url: "https://fwp.mt.gov/aboutfwp/regulations", format: "html", description: "Administrative rules of Montana for FWP" },
    { docType: "turkey", title: "Montana Turkey Regulations", url: "https://fwp.mt.gov/hunt/regulations/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Montana Upland Game Bird Regulations", url: "https://fwp.mt.gov/hunt/regulations/upland-game-bird", format: "html", year: 2026, description: "Upland game bird hunting regulations" },
    { docType: "waterfowl", title: "Montana Waterfowl Regulations", url: "https://fwp.mt.gov/hunt/regulations/waterfowl", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  NM: [
    { docType: "general_hunting", title: "New Mexico Hunting Rules & Info", url: "https://www.wildlife.state.nm.us/hunting/", format: "html", year: 2026, description: "Main hunting information page" },
    { docType: "big_game_field_regs", title: "New Mexico Big Game Rules & Information", url: "https://www.wildlife.state.nm.us/hunting/big-game-rules-and-information/", format: "html", year: 2026, description: "Big game hunting rules, proclamation, and season dates" },
    { docType: "big_game_application", title: "New Mexico Hunting License Application", url: "https://www.wildlife.state.nm.us/hunting/hunting-license-application-information/", format: "html", year: 2026, description: "Draw application info and deadlines" },
    { docType: "admin_rules", title: "New Mexico Game Commission Rules", url: "https://www.wildlife.state.nm.us/commission/", format: "html", description: "Game commission rules and regulations" },
    { docType: "turkey", title: "New Mexico Turkey Rules", url: "https://www.wildlife.state.nm.us/hunting/turkey-rules-and-information/", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "New Mexico Small Game Rules", url: "https://www.wildlife.state.nm.us/hunting/small-game-rules-and-information/", format: "html", year: 2026, description: "Small game and upland bird hunting regulations" },
    { docType: "waterfowl", title: "New Mexico Waterfowl Rules", url: "https://www.wildlife.state.nm.us/hunting/waterfowl-rules-and-information/", format: "html", year: 2026, description: "Waterfowl and migratory bird regulations" },
  ],

  NV: [
    { docType: "general_hunting", title: "Nevada Hunting Regulations", url: "https://www.ndow.org/hunt/", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Nevada Big Game Seasons and Regulations", url: "https://www.ndow.org/hunt/big-game/", format: "html", year: 2026, description: "Big game hunting seasons and regulations" },
    { docType: "big_game_application", title: "Nevada Tag Application Information", url: "https://www.ndow.org/hunt/tag-application/", format: "html", year: 2026, description: "Application procedures for big game tags" },
    { docType: "admin_rules", title: "Nevada Wildlife Commission Regulations", url: "https://www.ndow.org/about/commission/", format: "html", description: "Commission regulations and administrative code" },
    { docType: "upland_game", title: "Nevada Upland Game Regulations", url: "https://www.ndow.org/hunt/upland-game/", format: "html", year: 2026, description: "Upland game and small game hunting regulations" },
    { docType: "waterfowl", title: "Nevada Waterfowl Regulations", url: "https://www.ndow.org/hunt/waterfowl/", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  UT: [
    { docType: "general_hunting", title: "Utah Hunting Regulations", url: "https://wildlife.utah.gov/hunting/hunting-regulation/", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Utah Big Game Field Regulations", url: "https://wildlife.utah.gov/guidebooks/field_regs.pdf", format: "pdf", year: 2026, description: "Big game field regulations guidebook (cliff notes)" },
    { docType: "big_game_application", title: "Utah Big Game Application Guidebook", url: "https://wildlife.utah.gov/guidebooks/biggameapp.pdf", format: "pdf", year: 2026, description: "Big game application guidebook with draw info" },
    { docType: "admin_rules", title: "Utah Administrative Rules", url: "https://wildlife.utah.gov/hunting/hunting-regulation/administrative-rules.html", format: "html", description: "Administrative rules for hunting" },
    { docType: "hunt_planner", title: "Utah Hunt Planner", url: "https://hunt.utah.gov", format: "interactive", year: 2026, description: "Interactive hunt planner tool for Utah" },
    { docType: "turkey", title: "Utah Turkey Guidebook", url: "https://wildlife.utah.gov/guidebooks/turkey.pdf", format: "pdf", year: 2026, description: "Turkey hunting guidebook" },
    { docType: "upland_game", title: "Utah Upland Game & Furbearer Guidebook", url: "https://wildlife.utah.gov/guidebooks/upland_game.pdf", format: "pdf", year: 2026, description: "Upland game and furbearer guidebook" },
    { docType: "waterfowl", title: "Utah Waterfowl Guidebook", url: "https://wildlife.utah.gov/guidebooks/waterfowl.pdf", format: "pdf", year: 2026, description: "Waterfowl hunting guidebook" },
  ],

  ID: [
    { docType: "general_hunting", title: "Idaho Hunting Seasons & Rules", url: "https://idfg.idaho.gov/hunt/rules", format: "html", year: 2026, description: "Main hunting rules and seasons page" },
    { docType: "big_game_field_regs", title: "Idaho Big Game Seasons & Rules", url: "https://idfg.idaho.gov/hunt/rules/big-game", format: "html", year: 2026, description: "Big game hunting seasons, rules, and regulations" },
    { docType: "big_game_application", title: "Idaho Controlled Hunt Application", url: "https://idfg.idaho.gov/hunt/controlled", format: "html", year: 2026, description: "Controlled hunt draw application information" },
    { docType: "admin_rules", title: "Idaho Fish & Game Commission Rules", url: "https://idfg.idaho.gov/about/commission/rules", format: "html", description: "Commission rules and IDAPA regulations" },
    { docType: "turkey", title: "Idaho Turkey Hunting", url: "https://idfg.idaho.gov/hunt/turkey", format: "html", year: 2026, description: "Turkey hunting regulations and seasons" },
    { docType: "upland_game", title: "Idaho Upland Game & Furbearer Rules", url: "https://idfg.idaho.gov/hunt/rules/upland", format: "html", year: 2026, description: "Upland game and furbearer hunting regulations" },
    { docType: "waterfowl", title: "Idaho Waterfowl Regulations", url: "https://idfg.idaho.gov/hunt/rules/waterfowl", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  OR: [
    { docType: "general_hunting", title: "Oregon Hunting Regulations", url: "https://www.dfw.state.or.us/resources/hunting/", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Oregon Big Game Regulations", url: "https://www.dfw.state.or.us/resources/hunting/big_game/", format: "html", year: 2026, description: "Big game hunting regulations and season information" },
    { docType: "big_game_application", title: "Oregon Controlled Hunt Application", url: "https://www.dfw.state.or.us/resources/hunting/big_game/controlled_hunts/", format: "html", year: 2026, description: "Controlled hunt draw application procedures" },
    { docType: "admin_rules", title: "Oregon Fish & Wildlife Commission Rules", url: "https://www.dfw.state.or.us/OARs/", format: "html", description: "Oregon Administrative Rules for hunting" },
    { docType: "turkey", title: "Oregon Turkey Hunting", url: "https://www.dfw.state.or.us/resources/hunting/turkey/", format: "html", year: 2026, description: "Turkey hunting regulations and seasons" },
    { docType: "upland_game", title: "Oregon Upland Game Bird Regulations", url: "https://www.dfw.state.or.us/resources/hunting/upland/", format: "html", year: 2026, description: "Upland game bird hunting regulations" },
    { docType: "waterfowl", title: "Oregon Waterfowl Regulations", url: "https://www.dfw.state.or.us/resources/hunting/waterfowl/", format: "html", year: 2026, description: "Waterfowl and migratory bird regulations" },
  ],

  WA: [
    { docType: "general_hunting", title: "Washington Hunting Regulations", url: "https://wdfw.wa.gov/hunting/regulations", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Washington Big Game Hunting Seasons", url: "https://wdfw.wa.gov/hunting/regulations/big-game", format: "html", year: 2026, description: "Big game hunting season dates and regulations" },
    { docType: "big_game_application", title: "Washington Special Hunt Permits", url: "https://wdfw.wa.gov/hunting/permits/special", format: "html", year: 2026, description: "Special hunt permit application information" },
    { docType: "admin_rules", title: "Washington WAC Hunting Rules", url: "https://wdfw.wa.gov/about/regulations", format: "html", description: "Washington Administrative Code hunting rules" },
    { docType: "turkey", title: "Washington Turkey Hunting", url: "https://wdfw.wa.gov/hunting/regulations/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Washington Upland Bird Regulations", url: "https://wdfw.wa.gov/hunting/regulations/upland-bird", format: "html", year: 2026, description: "Upland bird and small game regulations" },
    { docType: "waterfowl", title: "Washington Waterfowl Regulations", url: "https://wdfw.wa.gov/hunting/regulations/waterfowl", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  SD: [
    { docType: "general_hunting", title: "South Dakota Hunting Regulations", url: "https://gfp.sd.gov/hunting/", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "South Dakota Big Game Handbook", url: "https://gfp.sd.gov/hunting/big-game/", format: "html", year: 2026, description: "Big game hunting handbook and regulations" },
    { docType: "big_game_application", title: "South Dakota License Application", url: "https://gfp.sd.gov/hunting/applications/", format: "html", year: 2026, description: "Hunting license application information" },
    { docType: "admin_rules", title: "South Dakota GFP Administrative Rules", url: "https://gfp.sd.gov/commission/rules/", format: "html", description: "Administrative rules and commission actions" },
    { docType: "turkey", title: "South Dakota Turkey Hunting", url: "https://gfp.sd.gov/hunting/turkey/", format: "html", year: 2026, description: "Turkey hunting regulations and season dates" },
    { docType: "upland_game", title: "South Dakota Upland Game Hunting", url: "https://gfp.sd.gov/hunting/upland/", format: "html", year: 2026, description: "Upland game bird regulations" },
    { docType: "waterfowl", title: "South Dakota Waterfowl Hunting", url: "https://gfp.sd.gov/hunting/waterfowl/", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  KS: [
    { docType: "general_hunting", title: "Kansas Hunting Regulations", url: "https://ksoutdoors.com/Hunting", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Kansas Big Game Regulations", url: "https://ksoutdoors.com/Hunting/Big-Game-Information", format: "html", year: 2026, description: "Big game hunting regulations and season info" },
    { docType: "big_game_application", title: "Kansas Big Game Applications", url: "https://ksoutdoors.com/Hunting/Big-Game-Information/Big-Game-Applications", format: "html", year: 2026, description: "Big game draw application information" },
    { docType: "admin_rules", title: "Kansas Wildlife Regulations", url: "https://ksoutdoors.com/Hunting/Regulations", format: "html", description: "Kansas hunting regulations and commission orders" },
    { docType: "turkey", title: "Kansas Turkey Hunting", url: "https://ksoutdoors.com/Hunting/Turkey-Hunting", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Kansas Upland Bird Hunting", url: "https://ksoutdoors.com/Hunting/Upland-Birds", format: "html", year: 2026, description: "Upland bird and small game regulations" },
    { docType: "waterfowl", title: "Kansas Waterfowl Hunting", url: "https://ksoutdoors.com/Hunting/Waterfowl-Hunting", format: "html", year: 2026, description: "Waterfowl and migratory bird regulations" },
  ],

  // =========================================================================
  // OTHER WESTERN STATES
  // =========================================================================

  AK: [
    { docType: "general_hunting", title: "Alaska Hunting Regulations", url: "https://www.adfg.alaska.gov/index.cfm?adfg=hunting.main", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Alaska Hunting Regulations Book", url: "https://www.adfg.alaska.gov/index.cfm?adfg=hunting.regs", format: "html", year: 2026, description: "Hunting regulations by game management unit" },
    { docType: "admin_rules", title: "Alaska Board of Game Regulations", url: "https://www.adfg.alaska.gov/index.cfm?adfg=gameboard.main", format: "html", description: "Board of Game regulatory actions" },
    { docType: "waterfowl", title: "Alaska Waterfowl Regulations", url: "https://www.adfg.alaska.gov/index.cfm?adfg=waterfowl.main", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  CA: [
    { docType: "general_hunting", title: "California Hunting Regulations", url: "https://wildlife.ca.gov/Hunting/Regulations", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "California Big Game Hunting", url: "https://wildlife.ca.gov/Hunting/Big-Game", format: "html", year: 2026, description: "Big game hunting regulations and information" },
    { docType: "big_game_application", title: "California Big Game Tag Applications", url: "https://wildlife.ca.gov/Hunting/Big-Game/Applications", format: "html", year: 2026, description: "Big game tag draw applications" },
    { docType: "admin_rules", title: "California Fish & Game Commission Regulations", url: "https://wildlife.ca.gov/Regulations", format: "html", description: "Fish and Game Commission regulations" },
    { docType: "upland_game", title: "California Upland Game Regulations", url: "https://wildlife.ca.gov/Hunting/Upland-Game", format: "html", year: 2026, description: "Upland game bird hunting regulations" },
    { docType: "waterfowl", title: "California Waterfowl Regulations", url: "https://wildlife.ca.gov/Hunting/Waterfowl", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  HI: [
    { docType: "general_hunting", title: "Hawaii Hunting Regulations", url: "https://dlnr.hawaii.gov/recreation/hunting/", format: "html", year: 2026, description: "Main hunting regulations and information" },
    { docType: "big_game_field_regs", title: "Hawaii Game Mammal Hunting", url: "https://dlnr.hawaii.gov/recreation/hunting/", format: "html", year: 2026, description: "Game mammal hunting rules and seasons" },
    { docType: "admin_rules", title: "Hawaii DLNR Administrative Rules", url: "https://dlnr.hawaii.gov/recreation/hunting/", format: "html", description: "Hunting administrative rules" },
  ],

  // =========================================================================
  // MIDWEST STATES
  // =========================================================================

  ND: [
    { docType: "general_hunting", title: "North Dakota Hunting Regulations", url: "https://gf.nd.gov/hunting", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "North Dakota Big Game Proclamation", url: "https://gf.nd.gov/hunting/big-game", format: "html", year: 2026, description: "Big game hunting proclamation and regulations" },
    { docType: "big_game_application", title: "North Dakota Lottery Applications", url: "https://gf.nd.gov/hunting/lottery", format: "html", year: 2026, description: "Hunting lottery application information" },
    { docType: "admin_rules", title: "North Dakota Game & Fish Proclamations", url: "https://gf.nd.gov/regulations", format: "html", description: "Governor's proclamations and administrative rules" },
    { docType: "upland_game", title: "North Dakota Upland Game", url: "https://gf.nd.gov/hunting/upland", format: "html", year: 2026, description: "Upland game hunting regulations" },
    { docType: "waterfowl", title: "North Dakota Waterfowl Hunting", url: "https://gf.nd.gov/hunting/waterfowl", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  NE: [
    { docType: "general_hunting", title: "Nebraska Hunting Regulations", url: "https://outdoornebraska.gov/hunting/", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Nebraska Big Game Guide", url: "https://outdoornebraska.gov/hunting/biggame/", format: "html", year: 2026, description: "Big game hunting regulations guide" },
    { docType: "big_game_application", title: "Nebraska Permit Applications", url: "https://outdoornebraska.gov/hunting/permits/", format: "html", year: 2026, description: "Hunting permit application information" },
    { docType: "admin_rules", title: "Nebraska Game & Parks Regulations", url: "https://outdoornebraska.gov/regulations/", format: "html", description: "Hunting regulations and commission orders" },
    { docType: "turkey", title: "Nebraska Turkey Hunting", url: "https://outdoornebraska.gov/hunting/turkey/", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Nebraska Upland Game Hunting", url: "https://outdoornebraska.gov/hunting/uplandgame/", format: "html", year: 2026, description: "Upland game hunting regulations" },
    { docType: "waterfowl", title: "Nebraska Waterfowl Hunting", url: "https://outdoornebraska.gov/hunting/waterfowl/", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  IA: [
    { docType: "general_hunting", title: "Iowa Hunting Regulations", url: "https://www.iowadnr.gov/Hunting", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Iowa Deer Hunting Regulations", url: "https://www.iowadnr.gov/Hunting/Deer-Hunting", format: "html", year: 2026, description: "Deer hunting seasons and regulations" },
    { docType: "big_game_application", title: "Iowa Hunting License Information", url: "https://www.iowadnr.gov/Hunting/Licenses-Laws", format: "html", year: 2026, description: "License and application information" },
    { docType: "admin_rules", title: "Iowa DNR Administrative Rules", url: "https://www.iowadnr.gov/About-DNR/Administrative-Rules", format: "html", description: "Administrative rules for hunting" },
    { docType: "turkey", title: "Iowa Turkey Hunting", url: "https://www.iowadnr.gov/Hunting/Turkey-Hunting", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Iowa Upland Game Hunting", url: "https://www.iowadnr.gov/Hunting/Pheasant-Quail-Hunting", format: "html", year: 2026, description: "Upland game and small game regulations" },
    { docType: "waterfowl", title: "Iowa Waterfowl Hunting", url: "https://www.iowadnr.gov/Hunting/Waterfowl-Hunting", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  MN: [
    { docType: "general_hunting", title: "Minnesota Hunting Regulations", url: "https://www.dnr.state.mn.us/hunting/index.html", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Minnesota Deer Hunting Regulations", url: "https://www.dnr.state.mn.us/hunting/deer/index.html", format: "html", year: 2026, description: "Deer hunting regulations and season information" },
    { docType: "admin_rules", title: "Minnesota DNR Rules", url: "https://www.dnr.state.mn.us/regulations/index.html", format: "html", description: "Administrative rules and regulations" },
    { docType: "turkey", title: "Minnesota Turkey Hunting", url: "https://www.dnr.state.mn.us/hunting/turkey/index.html", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Minnesota Small Game Hunting", url: "https://www.dnr.state.mn.us/hunting/smallgame/index.html", format: "html", year: 2026, description: "Small game and upland bird regulations" },
    { docType: "waterfowl", title: "Minnesota Waterfowl Hunting", url: "https://www.dnr.state.mn.us/hunting/waterfowl/index.html", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  MO: [
    { docType: "general_hunting", title: "Missouri Hunting Regulations", url: "https://mdc.mo.gov/hunting-trapping", format: "html", year: 2026, description: "Main hunting and trapping page" },
    { docType: "big_game_field_regs", title: "Missouri Deer & Turkey Hunting", url: "https://mdc.mo.gov/hunting-trapping/species/deer", format: "html", year: 2026, description: "Deer hunting regulations and season information" },
    { docType: "admin_rules", title: "Missouri Wildlife Code", url: "https://mdc.mo.gov/about-regulations/wildlife-code", format: "html", description: "Wildlife code of Missouri regulations" },
    { docType: "turkey", title: "Missouri Turkey Hunting", url: "https://mdc.mo.gov/hunting-trapping/species/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Missouri Small Game Hunting", url: "https://mdc.mo.gov/hunting-trapping/species", format: "html", year: 2026, description: "Small game and upland bird hunting" },
    { docType: "waterfowl", title: "Missouri Waterfowl Hunting", url: "https://mdc.mo.gov/hunting-trapping/species/waterfowl", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  WI: [
    { docType: "general_hunting", title: "Wisconsin Hunting Regulations", url: "https://dnr.wisconsin.gov/topic/Hunt", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Wisconsin Deer Hunting Regulations", url: "https://dnr.wisconsin.gov/topic/Hunt/deer", format: "html", year: 2026, description: "Deer hunting regulations and season dates" },
    { docType: "big_game_application", title: "Wisconsin Hunting Permits", url: "https://dnr.wisconsin.gov/permits/hunting", format: "html", year: 2026, description: "Hunting permit and license information" },
    { docType: "admin_rules", title: "Wisconsin DNR Administrative Code", url: "https://dnr.wisconsin.gov/topic/Regulations", format: "html", description: "Natural Resources administrative code" },
    { docType: "turkey", title: "Wisconsin Turkey Hunting", url: "https://dnr.wisconsin.gov/topic/Hunt/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Wisconsin Small Game Hunting", url: "https://dnr.wisconsin.gov/topic/Hunt/smallgame", format: "html", year: 2026, description: "Small game and upland bird regulations" },
    { docType: "waterfowl", title: "Wisconsin Waterfowl Hunting", url: "https://dnr.wisconsin.gov/topic/Hunt/waterfowl", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  MI: [
    { docType: "general_hunting", title: "Michigan Hunting Regulations", url: "https://www.michigan.gov/dnr/things-to-do/hunting", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Michigan Deer Hunting Digest", url: "https://www.michigan.gov/dnr/things-to-do/hunting/deer", format: "html", year: 2026, description: "Deer hunting digest and regulations" },
    { docType: "admin_rules", title: "Michigan Wildlife Conservation Orders", url: "https://www.michigan.gov/dnr/managing-resources/wildlife/regulations", format: "html", description: "Wildlife conservation orders and regulations" },
    { docType: "turkey", title: "Michigan Turkey Hunting", url: "https://www.michigan.gov/dnr/things-to-do/hunting/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Michigan Small Game Hunting", url: "https://www.michigan.gov/dnr/things-to-do/hunting/small-game", format: "html", year: 2026, description: "Small game hunting regulations" },
    { docType: "waterfowl", title: "Michigan Waterfowl Hunting", url: "https://www.michigan.gov/dnr/things-to-do/hunting/waterfowl", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  IL: [
    { docType: "general_hunting", title: "Illinois Hunting Regulations", url: "https://www2.illinois.gov/dnr/hunting/Pages/default.aspx", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Illinois Deer Hunting", url: "https://www2.illinois.gov/dnr/hunting/Pages/DeerHunting.aspx", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "Illinois DNR Administrative Rules", url: "https://www2.illinois.gov/dnr/LawsRulesRegs/Pages/default.aspx", format: "html", description: "Administrative rules and regulations" },
    { docType: "turkey", title: "Illinois Turkey Hunting", url: "https://www2.illinois.gov/dnr/hunting/Pages/TurkeyHunting.aspx", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Illinois Upland Game Hunting", url: "https://www2.illinois.gov/dnr/hunting/Pages/UplandGame.aspx", format: "html", year: 2026, description: "Upland game hunting regulations" },
    { docType: "waterfowl", title: "Illinois Waterfowl Hunting", url: "https://www2.illinois.gov/dnr/hunting/Pages/Waterfowl.aspx", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  IN: [
    { docType: "general_hunting", title: "Indiana Hunting Regulations", url: "https://www.in.gov/dnr/fish-and-wildlife/hunting-and-trapping/", format: "html", year: 2026, description: "Main hunting and trapping page" },
    { docType: "big_game_field_regs", title: "Indiana Deer Hunting Regulations", url: "https://www.in.gov/dnr/fish-and-wildlife/hunting-and-trapping/deer-hunting/", format: "html", year: 2026, description: "Deer hunting regulations and season info" },
    { docType: "admin_rules", title: "Indiana DNR Rules", url: "https://www.in.gov/dnr/rules-and-regulations/", format: "html", description: "Administrative rules and regulations" },
    { docType: "turkey", title: "Indiana Turkey Hunting", url: "https://www.in.gov/dnr/fish-and-wildlife/hunting-and-trapping/turkey-hunting/", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Indiana Waterfowl Hunting", url: "https://www.in.gov/dnr/fish-and-wildlife/hunting-and-trapping/waterfowl-hunting/", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  OH: [
    { docType: "general_hunting", title: "Ohio Hunting Regulations", url: "https://ohiodnr.gov/hunting-fishing-boating/hunting-resources", format: "html", year: 2026, description: "Main hunting resources page" },
    { docType: "big_game_field_regs", title: "Ohio Deer Hunting Regulations", url: "https://ohiodnr.gov/hunting-fishing-boating/hunting-resources/deer-hunting", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "Ohio DNR Administrative Rules", url: "https://ohiodnr.gov/about/laws-rules", format: "html", description: "Administrative rules and regulations" },
    { docType: "turkey", title: "Ohio Turkey Hunting", url: "https://ohiodnr.gov/hunting-fishing-boating/hunting-resources/turkey-hunting", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Ohio Waterfowl Hunting", url: "https://ohiodnr.gov/hunting-fishing-boating/hunting-resources/waterfowl-hunting", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  OK: [
    { docType: "general_hunting", title: "Oklahoma Hunting Regulations", url: "https://www.wildlifedepartment.com/hunting", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Oklahoma Deer Hunting Regulations", url: "https://www.wildlifedepartment.com/hunting/deer", format: "html", year: 2026, description: "Deer hunting regulations and season dates" },
    { docType: "big_game_application", title: "Oklahoma Controlled Hunt Application", url: "https://www.wildlifedepartment.com/hunting/controlled-hunts", format: "html", year: 2026, description: "Controlled hunt application info" },
    { docType: "admin_rules", title: "Oklahoma Wildlife Department Rules", url: "https://www.wildlifedepartment.com/law/regulations", format: "html", description: "Hunting regulations and department rules" },
    { docType: "turkey", title: "Oklahoma Turkey Hunting", url: "https://www.wildlifedepartment.com/hunting/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Oklahoma Upland Game", url: "https://www.wildlifedepartment.com/hunting/upland", format: "html", year: 2026, description: "Upland game bird regulations" },
    { docType: "waterfowl", title: "Oklahoma Waterfowl Hunting", url: "https://www.wildlifedepartment.com/hunting/waterfowl", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  // =========================================================================
  // SOUTHERN STATES
  // =========================================================================

  TX: [
    { docType: "general_hunting", title: "Texas Hunting Regulations", url: "https://tpwd.texas.gov/regulations/outdoor-annual/hunting", format: "html", year: 2026, description: "Outdoor Annual — hunting regulations" },
    { docType: "big_game_field_regs", title: "Texas White-tailed Deer Regulations", url: "https://tpwd.texas.gov/regulations/outdoor-annual/hunting/general-regulations/deer", format: "html", year: 2026, description: "Deer hunting regulations and season dates" },
    { docType: "admin_rules", title: "Texas Parks & Wildlife Regulations", url: "https://tpwd.texas.gov/regulations/", format: "html", description: "TPWD regulations and code" },
    { docType: "turkey", title: "Texas Turkey Regulations", url: "https://tpwd.texas.gov/regulations/outdoor-annual/hunting/general-regulations/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "upland_game", title: "Texas Upland Game Bird Regulations", url: "https://tpwd.texas.gov/regulations/outdoor-annual/hunting/general-regulations/upland-game-birds", format: "html", year: 2026, description: "Upland game bird regulations" },
    { docType: "waterfowl", title: "Texas Waterfowl Regulations", url: "https://tpwd.texas.gov/regulations/outdoor-annual/hunting/migratory-game-bird-regulations/waterfowl", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  AR: [
    { docType: "general_hunting", title: "Arkansas Hunting Regulations", url: "https://www.agfc.com/hunting/", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Arkansas Deer Hunting", url: "https://www.agfc.com/hunting/deer/", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "Arkansas GFC Regulations", url: "https://www.agfc.com/regulations/", format: "html", description: "Arkansas Game & Fish Commission regulations" },
    { docType: "turkey", title: "Arkansas Turkey Hunting", url: "https://www.agfc.com/hunting/turkey/", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Arkansas Waterfowl Hunting", url: "https://www.agfc.com/hunting/waterfowl/", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  LA: [
    { docType: "general_hunting", title: "Louisiana Hunting Regulations", url: "https://www.wlf.louisiana.gov/page/hunting", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Louisiana Deer Hunting Regulations", url: "https://www.wlf.louisiana.gov/page/deer-hunting", format: "html", year: 2026, description: "Deer hunting regulations and season dates" },
    { docType: "admin_rules", title: "Louisiana WLF Rules", url: "https://www.wlf.louisiana.gov/page/rules-and-regulations", format: "html", description: "Wildlife and Fisheries rules and regulations" },
    { docType: "turkey", title: "Louisiana Turkey Hunting", url: "https://www.wlf.louisiana.gov/page/turkey-hunting", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Louisiana Waterfowl Hunting", url: "https://www.wlf.louisiana.gov/page/waterfowl-hunting", format: "html", year: 2026, description: "Waterfowl hunting regulations" },
  ],

  MS: [
    { docType: "general_hunting", title: "Mississippi Hunting Regulations", url: "https://www.mdwfp.com/hunting-trapping/", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Mississippi Deer Hunting", url: "https://www.mdwfp.com/hunting-trapping/deer/", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "Mississippi DWFP Rules", url: "https://www.mdwfp.com/law-enforcement/regulations/", format: "html", description: "Wildlife regulations" },
    { docType: "turkey", title: "Mississippi Turkey Hunting", url: "https://www.mdwfp.com/hunting-trapping/turkey/", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Mississippi Waterfowl Hunting", url: "https://www.mdwfp.com/hunting-trapping/waterfowl/", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  AL: [
    { docType: "general_hunting", title: "Alabama Hunting Regulations", url: "https://www.outdooralabama.com/hunting", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Alabama Deer Hunting", url: "https://www.outdooralabama.com/deer-hunting", format: "html", year: 2026, description: "Deer hunting regulations and season info" },
    { docType: "admin_rules", title: "Alabama DCNR Regulations", url: "https://www.outdooralabama.com/hunting-regulations", format: "html", description: "Hunting regulations and laws" },
    { docType: "turkey", title: "Alabama Turkey Hunting", url: "https://www.outdooralabama.com/turkey-hunting", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Alabama Waterfowl Hunting", url: "https://www.outdooralabama.com/waterfowl-hunting", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  TN: [
    { docType: "general_hunting", title: "Tennessee Hunting Regulations", url: "https://www.tn.gov/twra/hunting.html", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Tennessee Deer Hunting Guide", url: "https://www.tn.gov/twra/hunting/big-game/deer.html", format: "html", year: 2026, description: "Deer hunting regulations and information" },
    { docType: "admin_rules", title: "Tennessee TWRA Proclamations", url: "https://www.tn.gov/twra/law-enforcement/rules-regulations.html", format: "html", description: "Hunting proclamations and regulations" },
    { docType: "turkey", title: "Tennessee Turkey Hunting", url: "https://www.tn.gov/twra/hunting/big-game/turkey.html", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Tennessee Waterfowl Hunting", url: "https://www.tn.gov/twra/hunting/waterfowl.html", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  KY: [
    { docType: "general_hunting", title: "Kentucky Hunting Regulations", url: "https://fw.ky.gov/Hunt/Pages/default.aspx", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Kentucky Deer Hunting Regulations", url: "https://fw.ky.gov/Hunt/Pages/Deer-Hunting.aspx", format: "html", year: 2026, description: "Deer hunting regulations and season info" },
    { docType: "admin_rules", title: "Kentucky Fish & Wildlife Regulations", url: "https://fw.ky.gov/Hunt/Pages/Hunting-Regulations.aspx", format: "html", description: "Hunting regulations" },
    { docType: "turkey", title: "Kentucky Turkey Hunting", url: "https://fw.ky.gov/Hunt/Pages/Turkey-Hunting.aspx", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Kentucky Waterfowl Hunting", url: "https://fw.ky.gov/Hunt/Pages/Waterfowl-Hunting.aspx", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  GA: [
    { docType: "general_hunting", title: "Georgia Hunting Regulations", url: "https://gadnr.org/hunting", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Georgia Deer Hunting Regulations", url: "https://gadnr.org/hunting/deer", format: "html", year: 2026, description: "Deer hunting regulations and season dates" },
    { docType: "admin_rules", title: "Georgia DNR Hunting Regulations", url: "https://gadnr.org/hunting/regulations", format: "html", description: "Hunting regulations and commission rules" },
    { docType: "turkey", title: "Georgia Turkey Hunting", url: "https://gadnr.org/hunting/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Georgia Waterfowl Hunting", url: "https://gadnr.org/hunting/waterfowl", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  FL: [
    { docType: "general_hunting", title: "Florida Hunting Regulations", url: "https://myfwc.com/hunting/", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Florida Deer Hunting Regulations", url: "https://myfwc.com/hunting/deer/", format: "html", year: 2026, description: "Deer hunting regulations and season dates" },
    { docType: "big_game_application", title: "Florida Quota Permit Information", url: "https://myfwc.com/hunting/quota-permits/", format: "html", year: 2026, description: "Quota permit application info" },
    { docType: "admin_rules", title: "Florida FWC Rules", url: "https://myfwc.com/about/rules-regulations/", format: "html", description: "FWC rules and regulations" },
    { docType: "turkey", title: "Florida Turkey Hunting", url: "https://myfwc.com/hunting/turkey/", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Florida Waterfowl Hunting", url: "https://myfwc.com/hunting/waterfowl/", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  SC: [
    { docType: "general_hunting", title: "South Carolina Hunting Regulations", url: "https://www.dnr.sc.gov/hunting.html", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "South Carolina Deer Hunting", url: "https://www.dnr.sc.gov/hunting/deer.html", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "South Carolina DNR Regulations", url: "https://www.dnr.sc.gov/regulations.html", format: "html", description: "Hunting regulations and laws" },
    { docType: "turkey", title: "South Carolina Turkey Hunting", url: "https://www.dnr.sc.gov/hunting/turkey.html", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "South Carolina Waterfowl Hunting", url: "https://www.dnr.sc.gov/hunting/waterfowl.html", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  NC: [
    { docType: "general_hunting", title: "North Carolina Hunting Regulations", url: "https://www.ncwildlife.org/Hunting", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "North Carolina Deer Hunting", url: "https://www.ncwildlife.org/Hunting/Deer", format: "html", year: 2026, description: "Deer hunting regulations and season dates" },
    { docType: "admin_rules", title: "North Carolina WRC Regulations", url: "https://www.ncwildlife.org/Hunting/Regulations", format: "html", description: "Hunting regulations" },
    { docType: "turkey", title: "North Carolina Turkey Hunting", url: "https://www.ncwildlife.org/Hunting/Turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "North Carolina Waterfowl Hunting", url: "https://www.ncwildlife.org/Hunting/Waterfowl", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  VA: [
    { docType: "general_hunting", title: "Virginia Hunting Regulations", url: "https://dwr.virginia.gov/hunting/regulations/", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "Virginia Deer Hunting Regulations", url: "https://dwr.virginia.gov/hunting/deer/", format: "html", year: 2026, description: "Deer hunting regulations and season dates" },
    { docType: "admin_rules", title: "Virginia DWR Regulations", url: "https://dwr.virginia.gov/hunting/regulations/", format: "html", description: "Hunting regulations and laws" },
    { docType: "turkey", title: "Virginia Turkey Hunting", url: "https://dwr.virginia.gov/hunting/turkey/", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Virginia Waterfowl Hunting", url: "https://dwr.virginia.gov/hunting/waterfowl/", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  WV: [
    { docType: "general_hunting", title: "West Virginia Hunting Regulations", url: "https://wvdnr.gov/hunting/", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "West Virginia Deer Hunting", url: "https://wvdnr.gov/hunting/deer-hunting/", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "West Virginia DNR Regulations", url: "https://wvdnr.gov/hunting/regulations/", format: "html", description: "Hunting regulations" },
    { docType: "turkey", title: "West Virginia Turkey Hunting", url: "https://wvdnr.gov/hunting/turkey-hunting/", format: "html", year: 2026, description: "Turkey hunting regulations" },
  ],

  // =========================================================================
  // EASTERN / NORTHEASTERN STATES
  // =========================================================================

  PA: [
    { docType: "general_hunting", title: "Pennsylvania Hunting Regulations", url: "https://www.pgc.pa.gov/Hunt/Pages/default.aspx", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Pennsylvania Hunting & Trapping Digest", url: "https://www.pgc.pa.gov/Hunt/Pages/HuntingDigest.aspx", format: "html", year: 2026, description: "Hunting and trapping digest with seasons and regulations" },
    { docType: "admin_rules", title: "Pennsylvania Game Commission Regulations", url: "https://www.pgc.pa.gov/InformationResources/Pages/Regulations.aspx", format: "html", description: "Game Commission regulations" },
    { docType: "turkey", title: "Pennsylvania Turkey Hunting", url: "https://www.pgc.pa.gov/Hunt/TurkeyHunting/Pages/default.aspx", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Pennsylvania Waterfowl Hunting", url: "https://www.pgc.pa.gov/Hunt/WaterfowlMigratoryBirds/Pages/default.aspx", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  NY: [
    { docType: "general_hunting", title: "New York Hunting Regulations", url: "https://www.dec.ny.gov/outdoor/hunting.html", format: "html", year: 2026, description: "Main hunting regulations page" },
    { docType: "big_game_field_regs", title: "New York Deer Hunting", url: "https://www.dec.ny.gov/outdoor/deer.html", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "New York DEC Hunting Regulations Guide", url: "https://www.dec.ny.gov/outdoor/hunting-regulations.html", format: "html", description: "Hunting regulations guide" },
    { docType: "turkey", title: "New York Turkey Hunting", url: "https://www.dec.ny.gov/outdoor/turkey.html", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "New York Waterfowl Hunting", url: "https://www.dec.ny.gov/outdoor/waterfowl.html", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  ME: [
    { docType: "general_hunting", title: "Maine Hunting Regulations", url: "https://www.maine.gov/ifw/hunting-trapping/index.html", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Maine Deer Hunting", url: "https://www.maine.gov/ifw/hunting-trapping/hunting/deer/index.html", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "big_game_application", title: "Maine Moose Lottery", url: "https://www.maine.gov/ifw/hunting-trapping/hunting/moose/index.html", format: "html", year: 2026, description: "Moose hunt lottery information" },
    { docType: "admin_rules", title: "Maine IFW Rules & Regulations", url: "https://www.maine.gov/ifw/laws-rules/index.html", format: "html", description: "Laws, rules, and regulations" },
    { docType: "turkey", title: "Maine Turkey Hunting", url: "https://www.maine.gov/ifw/hunting-trapping/hunting/turkey/index.html", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Maine Waterfowl Hunting", url: "https://www.maine.gov/ifw/hunting-trapping/hunting/migratory-birds/index.html", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  VT: [
    { docType: "general_hunting", title: "Vermont Hunting Regulations", url: "https://vtfishandwildlife.com/hunt", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Vermont Deer Hunting", url: "https://vtfishandwildlife.com/hunt/deer", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "Vermont Fish & Wildlife Regulations", url: "https://vtfishandwildlife.com/about-us/regulations", format: "html", description: "Hunting regulations" },
    { docType: "turkey", title: "Vermont Turkey Hunting", url: "https://vtfishandwildlife.com/hunt/turkey", format: "html", year: 2026, description: "Turkey hunting regulations" },
  ],

  NH: [
    { docType: "general_hunting", title: "New Hampshire Hunting Regulations", url: "https://www.wildlife.state.nh.us/hunting/", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "New Hampshire Deer Hunting", url: "https://www.wildlife.state.nh.us/hunting/deer.html", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "New Hampshire Fish & Game Rules", url: "https://www.wildlife.state.nh.us/legislation/", format: "html", description: "Hunting rules and legislation" },
    { docType: "turkey", title: "New Hampshire Turkey Hunting", url: "https://www.wildlife.state.nh.us/hunting/turkey.html", format: "html", year: 2026, description: "Turkey hunting regulations" },
  ],

  MA: [
    { docType: "general_hunting", title: "Massachusetts Hunting Regulations", url: "https://www.mass.gov/hunting-in-massachusetts", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Massachusetts Deer Hunting", url: "https://www.mass.gov/info-details/deer-hunting-in-massachusetts", format: "html", year: 2026, description: "Deer hunting regulations and season info" },
    { docType: "admin_rules", title: "Massachusetts MassWildlife Regulations", url: "https://www.mass.gov/orgs/division-of-fisheries-and-wildlife", format: "html", description: "Hunting regulations" },
    { docType: "turkey", title: "Massachusetts Turkey Hunting", url: "https://www.mass.gov/info-details/turkey-hunting-in-massachusetts", format: "html", year: 2026, description: "Turkey hunting regulations" },
  ],

  CT: [
    { docType: "general_hunting", title: "Connecticut Hunting Regulations", url: "https://portal.ct.gov/deep/hunting/hunting-main-page", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Connecticut Deer Hunting", url: "https://portal.ct.gov/deep/hunting/deer-hunting", format: "html", year: 2026, description: "Deer hunting regulations" },
    { docType: "admin_rules", title: "Connecticut DEEP Regulations", url: "https://portal.ct.gov/deep/hunting/hunting-regulations", format: "html", description: "Hunting regulations" },
    { docType: "turkey", title: "Connecticut Turkey Hunting", url: "https://portal.ct.gov/deep/hunting/turkey-hunting", format: "html", year: 2026, description: "Turkey hunting regulations" },
  ],

  RI: [
    { docType: "general_hunting", title: "Rhode Island Hunting Regulations", url: "https://dem.ri.gov/natural-resources-bureau/fish-wildlife/wildlife-hunting", format: "html", year: 2026, description: "Main hunting info page" },
    { docType: "big_game_field_regs", title: "Rhode Island Deer Hunting", url: "https://www.eregulations.com/rhodeisland/hunting", format: "html", year: 2026, description: "Deer and game hunting regulations via eRegulations" },
    { docType: "admin_rules", title: "Rhode Island DEM Fish & Wildlife", url: "https://dem.ri.gov/huntfish", format: "html", description: "Hunting and fishing regulations portal" },
  ],

  NJ: [
    { docType: "general_hunting", title: "New Jersey Hunting Regulations", url: "https://www.nj.gov/dep/fgw/hunting.htm", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "New Jersey Deer Hunting Digest", url: "https://www.nj.gov/dep/fgw/deerart.htm", format: "html", year: 2026, description: "Deer hunting digest and regulations" },
    { docType: "admin_rules", title: "New Jersey Fish & Wildlife Regulations", url: "https://www.nj.gov/dep/fgw/rules.htm", format: "html", description: "Hunting regulations and game code" },
    { docType: "turkey", title: "New Jersey Turkey Hunting", url: "https://www.nj.gov/dep/fgw/turkey.htm", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "New Jersey Waterfowl Hunting", url: "https://www.nj.gov/dep/fgw/waterfowl.htm", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],

  DE: [
    { docType: "general_hunting", title: "Delaware Hunting Regulations", url: "https://dnrec.delaware.gov/fish-wildlife/hunting/", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Delaware Deer Hunting", url: "https://dnrec.delaware.gov/fish-wildlife/hunting/deer-hunting/", format: "html", year: 2026, description: "Deer hunting regulations" },
    { docType: "admin_rules", title: "Delaware Fish & Wildlife Regulations", url: "https://dnrec.delaware.gov/fish-wildlife/regulations/", format: "html", description: "Hunting regulations" },
  ],

  MD: [
    { docType: "general_hunting", title: "Maryland Hunting Regulations", url: "https://dnr.maryland.gov/wildlife/Pages/hunt_trap/hunting.aspx", format: "html", year: 2026, description: "Main hunting page" },
    { docType: "big_game_field_regs", title: "Maryland Deer Hunting Guide", url: "https://dnr.maryland.gov/wildlife/Pages/hunt_trap/deerhunting.aspx", format: "html", year: 2026, description: "Deer hunting regulations and seasons" },
    { docType: "admin_rules", title: "Maryland DNR Regulations", url: "https://dnr.maryland.gov/wildlife/Pages/hunt_trap/regulations.aspx", format: "html", description: "Hunting regulations" },
    { docType: "turkey", title: "Maryland Turkey Hunting", url: "https://dnr.maryland.gov/wildlife/Pages/hunt_trap/turkeyhunting.aspx", format: "html", year: 2026, description: "Turkey hunting regulations" },
    { docType: "waterfowl", title: "Maryland Waterfowl Hunting", url: "https://dnr.maryland.gov/wildlife/Pages/hunt_trap/waterfowl.aspx", format: "html", year: 2026, description: "Waterfowl regulations" },
  ],
};

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------
async function seedRegulations() {
  console.log("=== HuntLogic Regulations Seed ===\n");

  // Fetch all states and build lookup map
  const allStates = await db.select().from(states);
  const stateMap = new Map<string, string>();
  for (const s of allStates) {
    stateMap.set(s.code, s.id);
  }
  console.log(`Found ${allStates.length} states in database.\n`);

  let totalInserted = 0;
  let totalSkipped = 0;

  const stateCodes = Object.keys(regulationData);

  for (const code of stateCodes) {
    const stateId = stateMap.get(code);
    const regs = regulationData[code]!;
    if (!stateId) {
      console.log(`  [SKIP] State ${code} not found in database`);
      totalSkipped += regs.length;
      continue;
    }

    const entries = regs.map((entry) => ({
      stateId,
      docType: entry.docType,
      title: entry.title,
      url: entry.url,
      format: entry.format ?? null,
      year: entry.year ?? null,
      description: entry.description ?? null,
      enabled: true,
    }));

    const inserted = await db
      .insert(stateRegulations)
      .values(entries)
      .onConflictDoNothing()
      .returning();

    totalInserted += inserted.length;
    const skipped = entries.length - inserted.length;
    totalSkipped += skipped;
    console.log(
      `  [${code}] ${inserted.length} inserted, ${skipped} skipped (${entries.length} total)`
    );
  }

  console.log(
    `\n=== Done: ${totalInserted} regulations inserted, ${totalSkipped} skipped across ${stateCodes.length} states ===`
  );
}

// ---------------------------------------------------------------------------
// Run
// ---------------------------------------------------------------------------
seedRegulations()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error("Seed error:", err);
    process.exit(1);
  });
