// =============================================================================
// HuntLogic — Database Seed Script
// =============================================================================
// Usage: npx tsx src/lib/db/seed.ts
// Idempotent — safe to re-run (uses onConflictDoNothing).
// =============================================================================

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  states,
  species,
  stateSpecies,
  dataSources,
  aiPrompts,
  appConfig,
} from "./schema";
import { seedFeeSchedules } from "./seeds/fee-schedules";
import { seedServiceFees } from "./seeds/service-fees";
import { seedFormConfigs } from "./seeds/form-configs";

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
// Seed data
// ---------------------------------------------------------------------------

async function seed() {
  console.log("=== HuntLogic Database Seed ===\n");

  // --------------------------------------------------------------------------
  // 1. STATES — All 50 US states
  // --------------------------------------------------------------------------
  console.log("[1/9] Seeding states...");

  const allStates = [
    // Western draw states (primary focus)
    { code: "AZ", name: "Arizona", region: "west", hasDrawSystem: true, hasPointSystem: true, agencyName: "Arizona Game and Fish Department", agencyUrl: "https://www.azgfd.com", config: { tagCost: 300, licenseCost: 160, pointCost: 15 }, enabled: true },
    { code: "CO", name: "Colorado", region: "west", hasDrawSystem: true, hasPointSystem: true, agencyName: "Colorado Parks and Wildlife", agencyUrl: "https://cpw.state.co.us", config: { tagCost: 660, licenseCost: 100, pointCost: 40 }, enabled: true },
    { code: "WY", name: "Wyoming", region: "west", hasDrawSystem: true, hasPointSystem: true, agencyName: "Wyoming Game and Fish Department", agencyUrl: "https://wgfd.wyo.gov", config: { tagCost: 600, licenseCost: 100, pointCost: 50 }, enabled: true },
    { code: "MT", name: "Montana", region: "west", hasDrawSystem: true, hasPointSystem: true, agencyName: "Montana Fish, Wildlife & Parks", agencyUrl: "https://fwp.mt.gov", config: { tagCost: 900, licenseCost: 200, pointCost: 50 }, enabled: true },
    { code: "NM", name: "New Mexico", region: "west", hasDrawSystem: true, hasPointSystem: false, agencyName: "New Mexico Department of Game and Fish", agencyUrl: "https://www.wildlife.state.nm.us", config: { tagCost: 550, licenseCost: 65, pointCost: 0 }, enabled: true },
    { code: "NV", name: "Nevada", region: "west", hasDrawSystem: true, hasPointSystem: true, agencyName: "Nevada Department of Wildlife", agencyUrl: "https://www.ndow.org", config: { tagCost: 400, licenseCost: 142, pointCost: 10 }, enabled: true },
    { code: "UT", name: "Utah", region: "west", hasDrawSystem: true, hasPointSystem: true, agencyName: "Utah Division of Wildlife Resources", agencyUrl: "https://wildlife.utah.gov", config: { tagCost: 400, licenseCost: 65, pointCost: 10 }, enabled: true },
    { code: "ID", name: "Idaho", region: "west", hasDrawSystem: true, hasPointSystem: false, agencyName: "Idaho Fish and Game", agencyUrl: "https://idfg.idaho.gov", config: { tagCost: 550, licenseCost: 155, pointCost: 0 }, enabled: true },
    { code: "OR", name: "Oregon", region: "west", hasDrawSystem: true, hasPointSystem: true, agencyName: "Oregon Department of Fish and Wildlife", agencyUrl: "https://www.dfw.state.or.us", config: { tagCost: 500, licenseCost: 165, pointCost: 8 }, enabled: true },
    { code: "WA", name: "Washington", region: "west", hasDrawSystem: true, hasPointSystem: false, agencyName: "Washington Department of Fish and Wildlife", agencyUrl: "https://wdfw.wa.gov", config: { tagCost: 500, licenseCost: 150, pointCost: 0 }, enabled: true },
    { code: "SD", name: "South Dakota", region: "midwest", hasDrawSystem: true, hasPointSystem: true, agencyName: "South Dakota Game, Fish and Parks", agencyUrl: "https://gfp.sd.gov", config: { tagCost: 280, licenseCost: 110, pointCost: 0 }, enabled: true },
    { code: "KS", name: "Kansas", region: "midwest", hasDrawSystem: true, hasPointSystem: true, agencyName: "Kansas Department of Wildlife and Parks", agencyUrl: "https://ksoutdoors.com", config: { tagCost: 400, licenseCost: 80, pointCost: 0 }, enabled: true },
    // Other western
    { code: "AK", name: "Alaska", region: "west", hasDrawSystem: true, hasPointSystem: false, agencyName: "Alaska Department of Fish and Game", agencyUrl: "https://www.adfg.alaska.gov", config: {}, enabled: true },
    { code: "CA", name: "California", region: "west", hasDrawSystem: true, hasPointSystem: true, agencyName: "California Department of Fish and Wildlife", agencyUrl: "https://wildlife.ca.gov", config: {}, enabled: true },
    { code: "HI", name: "Hawaii", region: "west", hasDrawSystem: false, hasPointSystem: false, agencyName: "Hawaii Department of Land and Natural Resources", agencyUrl: "https://dlnr.hawaii.gov", config: {}, enabled: false },
    // Midwest
    { code: "ND", name: "North Dakota", region: "midwest", hasDrawSystem: true, hasPointSystem: false, agencyName: "North Dakota Game and Fish Department", agencyUrl: "https://gf.nd.gov", config: {}, enabled: true },
    { code: "NE", name: "Nebraska", region: "midwest", hasDrawSystem: true, hasPointSystem: true, agencyName: "Nebraska Game and Parks Commission", agencyUrl: "https://outdoornebraska.gov", config: { tagCost: 250, licenseCost: 100, pointCost: 0 }, enabled: true },
    { code: "IA", name: "Iowa", region: "midwest", hasDrawSystem: true, hasPointSystem: true, agencyName: "Iowa Department of Natural Resources", agencyUrl: "https://www.iowadnr.gov", config: {}, enabled: true },
    { code: "MN", name: "Minnesota", region: "midwest", hasDrawSystem: true, hasPointSystem: false, agencyName: "Minnesota Department of Natural Resources", agencyUrl: "https://www.dnr.state.mn.us", config: {}, enabled: true },
    { code: "MO", name: "Missouri", region: "midwest", hasDrawSystem: true, hasPointSystem: false, agencyName: "Missouri Department of Conservation", agencyUrl: "https://mdc.mo.gov", config: {}, enabled: true },
    { code: "WI", name: "Wisconsin", region: "midwest", hasDrawSystem: true, hasPointSystem: true, agencyName: "Wisconsin Department of Natural Resources", agencyUrl: "https://dnr.wisconsin.gov", config: {}, enabled: true },
    { code: "MI", name: "Michigan", region: "midwest", hasDrawSystem: true, hasPointSystem: false, agencyName: "Michigan Department of Natural Resources", agencyUrl: "https://www.michigan.gov/dnr", config: {}, enabled: true },
    { code: "IL", name: "Illinois", region: "midwest", hasDrawSystem: true, hasPointSystem: false, agencyName: "Illinois Department of Natural Resources", agencyUrl: "https://www2.illinois.gov/dnr", config: {}, enabled: true },
    { code: "IN", name: "Indiana", region: "midwest", hasDrawSystem: false, hasPointSystem: false, agencyName: "Indiana Department of Natural Resources", agencyUrl: "https://www.in.gov/dnr", config: {}, enabled: true },
    { code: "OH", name: "Ohio", region: "midwest", hasDrawSystem: false, hasPointSystem: false, agencyName: "Ohio Department of Natural Resources", agencyUrl: "https://ohiodnr.gov", config: {}, enabled: true },
    { code: "OK", name: "Oklahoma", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "Oklahoma Department of Wildlife Conservation", agencyUrl: "https://www.wildlifedepartment.com", config: {}, enabled: true },
    // South
    { code: "TX", name: "Texas", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "Texas Parks and Wildlife Department", agencyUrl: "https://tpwd.texas.gov", config: {}, enabled: true },
    { code: "AR", name: "Arkansas", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "Arkansas Game and Fish Commission", agencyUrl: "https://www.agfc.com", config: {}, enabled: true },
    { code: "LA", name: "Louisiana", region: "south", hasDrawSystem: false, hasPointSystem: false, agencyName: "Louisiana Department of Wildlife and Fisheries", agencyUrl: "https://www.wlf.louisiana.gov", config: {}, enabled: true },
    { code: "MS", name: "Mississippi", region: "south", hasDrawSystem: false, hasPointSystem: false, agencyName: "Mississippi Department of Wildlife, Fisheries, and Parks", agencyUrl: "https://www.mdwfp.com", config: {}, enabled: true },
    { code: "AL", name: "Alabama", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "Alabama Department of Conservation and Natural Resources", agencyUrl: "https://www.outdooralabama.com", config: {}, enabled: true },
    { code: "TN", name: "Tennessee", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "Tennessee Wildlife Resources Agency", agencyUrl: "https://www.tn.gov/twra", config: {}, enabled: true },
    { code: "KY", name: "Kentucky", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "Kentucky Department of Fish and Wildlife Resources", agencyUrl: "https://fw.ky.gov", config: {}, enabled: true },
    { code: "GA", name: "Georgia", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "Georgia Department of Natural Resources", agencyUrl: "https://gadnr.org", config: {}, enabled: true },
    { code: "FL", name: "Florida", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "Florida Fish and Wildlife Conservation Commission", agencyUrl: "https://myfwc.com", config: {}, enabled: true },
    { code: "SC", name: "South Carolina", region: "south", hasDrawSystem: false, hasPointSystem: false, agencyName: "South Carolina Department of Natural Resources", agencyUrl: "https://www.dnr.sc.gov", config: {}, enabled: true },
    { code: "NC", name: "North Carolina", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "North Carolina Wildlife Resources Commission", agencyUrl: "https://www.ncwildlife.org", config: {}, enabled: true },
    { code: "VA", name: "Virginia", region: "south", hasDrawSystem: true, hasPointSystem: false, agencyName: "Virginia Department of Wildlife Resources", agencyUrl: "https://dwr.virginia.gov", config: {}, enabled: true },
    { code: "WV", name: "West Virginia", region: "south", hasDrawSystem: false, hasPointSystem: false, agencyName: "West Virginia Division of Natural Resources", agencyUrl: "https://wvdnr.gov", config: {}, enabled: true },
    // East / Northeast
    { code: "PA", name: "Pennsylvania", region: "east", hasDrawSystem: true, hasPointSystem: false, agencyName: "Pennsylvania Game Commission", agencyUrl: "https://www.pgc.pa.gov", config: {}, enabled: true },
    { code: "NY", name: "New York", region: "east", hasDrawSystem: true, hasPointSystem: false, agencyName: "New York State Department of Environmental Conservation", agencyUrl: "https://www.dec.ny.gov", config: {}, enabled: true },
    { code: "ME", name: "Maine", region: "east", hasDrawSystem: true, hasPointSystem: false, agencyName: "Maine Department of Inland Fisheries and Wildlife", agencyUrl: "https://www.maine.gov/ifw", config: {}, enabled: true },
    { code: "VT", name: "Vermont", region: "east", hasDrawSystem: true, hasPointSystem: false, agencyName: "Vermont Fish and Wildlife Department", agencyUrl: "https://vtfishandwildlife.com", config: {}, enabled: true },
    { code: "NH", name: "New Hampshire", region: "east", hasDrawSystem: true, hasPointSystem: false, agencyName: "New Hampshire Fish and Game Department", agencyUrl: "https://www.wildlife.state.nh.us", config: {}, enabled: true },
    { code: "MA", name: "Massachusetts", region: "east", hasDrawSystem: true, hasPointSystem: false, agencyName: "Massachusetts Division of Fisheries and Wildlife", agencyUrl: "https://www.mass.gov/orgs/division-of-fisheries-and-wildlife", config: {}, enabled: true },
    { code: "CT", name: "Connecticut", region: "east", hasDrawSystem: true, hasPointSystem: false, agencyName: "Connecticut Department of Energy and Environmental Protection", agencyUrl: "https://portal.ct.gov/deep", config: {}, enabled: true },
    { code: "RI", name: "Rhode Island", region: "east", hasDrawSystem: false, hasPointSystem: false, agencyName: "Rhode Island Department of Environmental Management", agencyUrl: "https://dem.ri.gov", config: {}, enabled: false },
    { code: "NJ", name: "New Jersey", region: "east", hasDrawSystem: true, hasPointSystem: false, agencyName: "New Jersey Division of Fish and Wildlife", agencyUrl: "https://www.nj.gov/dep/fgw", config: {}, enabled: true },
    { code: "DE", name: "Delaware", region: "east", hasDrawSystem: false, hasPointSystem: false, agencyName: "Delaware Division of Fish and Wildlife", agencyUrl: "https://dnrec.delaware.gov/fish-wildlife", config: {}, enabled: false },
    { code: "MD", name: "Maryland", region: "east", hasDrawSystem: true, hasPointSystem: false, agencyName: "Maryland Department of Natural Resources", agencyUrl: "https://dnr.maryland.gov", config: {}, enabled: true },
  ];

  const insertedStates = await db
    .insert(states)
    .values(allStates)
    .onConflictDoNothing()
    .returning();
  console.log(`  -> ${insertedStates.length} states inserted (${allStates.length} total)`);

  // Build lookup map (fetch all if conflict-skipped)
  const stateMap = new Map<string, string>();
  const allInsertedStates =
    insertedStates.length > 0
      ? insertedStates
      : await db.select().from(states);
  for (const s of allInsertedStates) {
    stateMap.set(s.code, s.id);
  }

  // --------------------------------------------------------------------------
  // 2. SPECIES — Core hunting species
  // --------------------------------------------------------------------------
  console.log("[2/9] Seeding species...");

  const allSpecies = [
    { slug: "elk", commonName: "Elk", scientificName: "Cervus canadensis", category: "big_game", config: {}, enabled: true },
    { slug: "mule_deer", commonName: "Mule Deer", scientificName: "Odocoileus hemionus", category: "big_game", config: {}, enabled: true },
    { slug: "whitetail", commonName: "White-tailed Deer", scientificName: "Odocoileus virginianus", category: "big_game", config: {}, enabled: true },
    { slug: "pronghorn", commonName: "Pronghorn", scientificName: "Antilocapra americana", category: "big_game", config: {}, enabled: true },
    { slug: "moose", commonName: "Moose", scientificName: "Alces alces", category: "big_game", config: {}, enabled: true },
    { slug: "bighorn_sheep", commonName: "Bighorn Sheep", scientificName: "Ovis canadensis", category: "big_game", config: {}, enabled: true },
    { slug: "mountain_goat", commonName: "Mountain Goat", scientificName: "Oreamnos americanus", category: "big_game", config: {}, enabled: true },
    { slug: "black_bear", commonName: "Black Bear", scientificName: "Ursus americanus", category: "big_game", config: {}, enabled: true },
    { slug: "turkey", commonName: "Turkey", scientificName: "Meleagris gallopavo", category: "turkey", config: {}, enabled: true },
    { slug: "caribou", commonName: "Caribou", scientificName: "Rangifer tarandus", category: "big_game", config: {}, enabled: true },
    { slug: "bison", commonName: "Bison", scientificName: "Bison bison", category: "big_game", config: {}, enabled: true },
    { slug: "javelina", commonName: "Javelina", scientificName: "Dicotyles tajacu", category: "big_game", config: {}, enabled: true },
    { slug: "mountain_lion", commonName: "Mountain Lion", scientificName: "Puma concolor", category: "big_game", config: {}, enabled: true },
    { slug: "upland_birds", commonName: "Upland Birds", scientificName: "Various upland game birds", category: "upland", config: { examples: ["pheasant", "quail", "grouse", "chukar"] }, enabled: true },
    { slug: "waterfowl", commonName: "Waterfowl (Ducks & Geese)", scientificName: "Various waterfowl species", category: "waterfowl", config: { examples: ["ducks", "geese"] }, enabled: true },
    { slug: "small_game", commonName: "Small Game", scientificName: "Various small game species", category: "small_game", config: { examples: ["rabbit", "squirrel"] }, enabled: true },
    { slug: "predators", commonName: "Predators", scientificName: "Various predator species", category: "big_game", config: { examples: ["wolf", "coyote", "fox", "bobcat"] }, enabled: true },
    { slug: "brown_bear", commonName: "Brown Bear", scientificName: "Ursus arctos", category: "big_game", config: {}, enabled: true },
    { slug: "hogs", commonName: "Hogs", scientificName: "Sus scrofa", category: "big_game", config: { aliases: ["wild pig", "feral hog"] }, enabled: true },
    { slug: "furbearer", commonName: "Furbearer", scientificName: "Various furbearing species", category: "small_game", config: { examples: ["beaver", "marten", "otter", "trapper species"] }, enabled: true },
  ];

  const insertedSpecies = await db
    .insert(species)
    .values(allSpecies)
    .onConflictDoNothing()
    .returning();
  console.log(`  -> ${insertedSpecies.length} species inserted (${allSpecies.length} total)`);

  // Build species lookup map
  const speciesMap = new Map<string, string>();
  const allInsertedSpecies =
    insertedSpecies.length > 0
      ? insertedSpecies
      : await db.select().from(species);
  for (const sp of allInsertedSpecies) {
    speciesMap.set(sp.slug, sp.id);
  }

  // --------------------------------------------------------------------------
  // 3. STATE-SPECIES MAPPINGS — Top 12 western draw states
  // --------------------------------------------------------------------------
  console.log("[3/9] Seeding state-species mappings...");

  const sid = (code: string) => stateMap.get(code)!;
  const spid = (slug: string) => speciesMap.get(slug)!;

  const stateSpeciesMappings = [
    // ---- ARIZONA ----
    { stateId: sid("AZ"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("AZ"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("AZ"), speciesId: spid("whitetail"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("AZ"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("AZ"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("AZ"), speciesId: spid("black_bear"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("AZ"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("AZ"), speciesId: spid("javelina"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("AZ"), speciesId: spid("mountain_lion"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("AZ"), speciesId: spid("bison"), huntTypes: ["rifle", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },

    // ---- COLORADO ----
    { stateId: sid("CO"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("CO"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("CO"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("CO"), speciesId: spid("moose"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("CO"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("CO"), speciesId: spid("mountain_goat"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("CO"), speciesId: spid("black_bear"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("CO"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("CO"), speciesId: spid("mountain_lion"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },

    // ---- WYOMING ----
    { stateId: sid("WY"), speciesId: spid("elk"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("WY"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("WY"), speciesId: spid("whitetail"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("WY"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("WY"), speciesId: spid("moose"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("WY"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("WY"), speciesId: spid("mountain_goat"), huntTypes: ["rifle"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("WY"), speciesId: spid("black_bear"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("WY"), speciesId: spid("bison"), huntTypes: ["rifle"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },

    // ---- MONTANA ----
    { stateId: sid("MT"), speciesId: spid("elk"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: true, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("MT"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: true, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("MT"), speciesId: spid("whitetail"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("MT"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("MT"), speciesId: spid("moose"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("MT"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("MT"), speciesId: spid("mountain_goat"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("MT"), speciesId: spid("black_bear"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("MT"), speciesId: spid("mountain_lion"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("MT"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },

    // ---- NEW MEXICO (no point system — pure random draw) ----
    { stateId: sid("NM"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("NM"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("NM"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("NM"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("NM"), speciesId: spid("black_bear"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("NM"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("NM"), speciesId: spid("javelina"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("NM"), speciesId: spid("mountain_lion"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },

    // ---- NEVADA ----
    { stateId: sid("NV"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("NV"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("NV"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("NV"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("NV"), speciesId: spid("mountain_goat"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("NV"), speciesId: spid("mountain_lion"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },

    // ---- UTAH ----
    { stateId: sid("UT"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("UT"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("UT"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("UT"), speciesId: spid("moose"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("UT"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("UT"), speciesId: spid("mountain_goat"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("UT"), speciesId: spid("black_bear"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("UT"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },
    { stateId: sid("UT"), speciesId: spid("bison"), huntTypes: ["rifle", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "bonus", maxPoints: null, config: {} },

    // ---- IDAHO (no point system) ----
    { stateId: sid("ID"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("ID"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("ID"), speciesId: spid("whitetail"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("ID"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("ID"), speciesId: spid("moose"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("ID"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("ID"), speciesId: spid("mountain_goat"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("ID"), speciesId: spid("black_bear"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("ID"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("ID"), speciesId: spid("mountain_lion"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },

    // ---- OREGON ----
    { stateId: sid("OR"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("OR"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("OR"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("OR"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("OR"), speciesId: spid("mountain_goat"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("OR"), speciesId: spid("black_bear"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("OR"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("OR"), speciesId: spid("mountain_lion"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },

    // ---- WASHINGTON (no point system) ----
    { stateId: sid("WA"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("WA"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("WA"), speciesId: spid("whitetail"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("WA"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("WA"), speciesId: spid("mountain_goat"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("WA"), speciesId: spid("moose"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("WA"), speciesId: spid("black_bear"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("WA"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },

    // ---- SOUTH DAKOTA ----
    { stateId: sid("SD"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("SD"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("SD"), speciesId: spid("whitetail"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("SD"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("SD"), speciesId: spid("bighorn_sheep"), huntTypes: ["rifle"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("SD"), speciesId: spid("mountain_goat"), huntTypes: ["rifle"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("SD"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: true, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
    { stateId: sid("SD"), speciesId: spid("mountain_lion"), huntTypes: ["rifle", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },

    // ---- KANSAS ----
    { stateId: sid("KS"), speciesId: spid("whitetail"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: true, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("KS"), speciesId: spid("mule_deer"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("KS"), speciesId: spid("pronghorn"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("KS"), speciesId: spid("elk"), huntTypes: ["rifle", "archery", "muzzleloader"], hasDraw: true, hasOtc: false, hasPoints: true, pointType: "preference", maxPoints: null, config: {} },
    { stateId: sid("KS"), speciesId: spid("turkey"), huntTypes: ["shotgun", "archery"], hasDraw: false, hasOtc: true, hasPoints: false, pointType: null, maxPoints: null, config: {} },
  ];

  const insertedStateSpecies = await db
    .insert(stateSpecies)
    .values(stateSpeciesMappings)
    .onConflictDoNothing()
    .returning();
  console.log(`  -> ${insertedStateSpecies.length} state-species mappings inserted (${stateSpeciesMappings.length} total)`);

  // --------------------------------------------------------------------------
  // 4. DATA SOURCES — Priority state ingestion sources
  // --------------------------------------------------------------------------
  console.log("[4/9] Seeding data sources...");

  const priorityDataSources = [
    // ====================================================================
    // ARIZONA GAME & FISH DEPARTMENT (AZGFD)
    // ====================================================================
    {
      name: "AZGFD Draw Odds & Statistics",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://www.azgfd.com/hunting/draw-information/",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.azgfd.com",
        endpoints: [
          {
            path: "/hunting/draw-information/draw-statistics/",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "draw_report",
            selectors: { table: "table.draw-stats" },
          },
          {
            path: "/hunting/draw-information/bonus-point-report/",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "AZ",
        species_slugs: ["elk", "mule_deer", "pronghorn", "bighorn_sheep", "javelina", "turkey", "bison"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "AZGFD Harvest Reports",
      sourceType: "harvest_report",
      authorityTier: 1,
      url: "https://www.azgfd.com/hunting/harvest-information/",
      scraperConfig: {
        adapter: "pdf_download",
        base_url: "https://www.azgfd.com",
        endpoints: [
          {
            path: "/hunting/harvest-information/big-game-harvest/",
            parser: "harvest_report",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "harvest_report",
          },
        ],
        rate_limit: { requests_per_minute: 5 },
        retry: { max_attempts: 3, backoff_ms: 10000 },
        state_code: "AZ",
        species_slugs: ["elk", "mule_deer", "pronghorn", "bighorn_sheep"],
        timeout_ms: 60000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },
    {
      name: "AZGFD Hunting Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.azgfd.com/hunting/regulations/",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.azgfd.com",
        endpoints: [
          {
            path: "/hunting/regulations/",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
          {
            path: "/hunting/regulations/big-game-seasons/",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "AZ",
        species_slugs: ["elk", "mule_deer", "pronghorn"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ====================================================================
    // COLORADO PARKS & WILDLIFE (CPW)
    // ====================================================================
    {
      name: "CPW Draw Results & Statistics",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://cpw.state.co.us/thingstodo/Pages/BigGameStatistics.aspx",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://cpw.state.co.us",
        endpoints: [
          {
            path: "/thingstodo/Pages/BigGameStatistics.aspx",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "draw_report",
          },
          {
            path: "/thingstodo/Pages/BigGameApplicantStatistics.aspx",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "CO",
        species_slugs: ["elk", "mule_deer", "pronghorn", "moose", "bighorn_sheep", "mountain_goat"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "CPW Harvest Reports",
      sourceType: "harvest_report",
      authorityTier: 1,
      url: "https://cpw.state.co.us/thingstodo/Pages/BigGameHarvest.aspx",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://cpw.state.co.us",
        endpoints: [
          {
            path: "/thingstodo/Pages/BigGameHarvest.aspx",
            parser: "harvest_report",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "harvest_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "CO",
        species_slugs: ["elk", "mule_deer", "pronghorn", "moose", "bighorn_sheep", "mountain_goat"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },
    {
      name: "CPW Season Dates & Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://cpw.state.co.us/thingstodo/Pages/BigGameSeasonDates.aspx",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://cpw.state.co.us",
        endpoints: [
          {
            path: "/thingstodo/Pages/BigGameSeasonDates.aspx",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/thingstodo/Pages/BigGameBrochure.aspx",
            parser: "regulation_text",
            params: {},
            schedule: "0 6 1 1 *",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "CO",
        species_slugs: ["elk", "mule_deer", "pronghorn"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ====================================================================
    // WYOMING GAME & FISH DEPARTMENT (WGFD)
    // ====================================================================
    {
      name: "WGFD Draw Results & Odds",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://wgfd.wyo.gov/apply-or-buy/draw-results",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://wgfd.wyo.gov",
        endpoints: [
          {
            path: "/apply-or-buy/draw-results",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "draw_report",
          },
          {
            path: "/apply-or-buy/preference-points-summary",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 8 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "WY",
        species_slugs: ["elk", "mule_deer", "whitetail", "pronghorn", "moose", "bighorn_sheep", "mountain_goat", "bison"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "WGFD Harvest Reports",
      sourceType: "harvest_report",
      authorityTier: 1,
      url: "https://wgfd.wyo.gov/hunting/harvest-data",
      scraperConfig: {
        adapter: "pdf_download",
        base_url: "https://wgfd.wyo.gov",
        endpoints: [
          {
            path: "/WGFD/SI/Hunting/Harvest-Reports/BigGame",
            parser: "harvest_report",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "harvest_report",
          },
        ],
        rate_limit: { requests_per_minute: 5 },
        retry: { max_attempts: 3, backoff_ms: 10000 },
        state_code: "WY",
        species_slugs: ["elk", "mule_deer", "pronghorn", "moose", "bighorn_sheep"],
        timeout_ms: 60000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },
    {
      name: "WGFD Season Dates & Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://wgfd.wyo.gov/regulations/regulation-pdfs",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://wgfd.wyo.gov",
        endpoints: [
          {
            path: "/hunting/season-dates",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/regulations/regulation-pdfs",
            parser: "regulation_text",
            params: {},
            schedule: "0 6 1 1 *",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 8 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "WY",
        species_slugs: ["elk", "mule_deer", "pronghorn"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ====================================================================
    // MIDWEST STATES
    // ====================================================================

    // ---- SOUTH DAKOTA (GFP) ----
    {
      name: "SD GFP Hunting Seasons & Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://gfp.sd.gov/hunting/",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://gfp.sd.gov",
        endpoints: [
          {
            path: "/hunting/big-game/deer/",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunting/big-game/antelope/",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "SD",
        species_slugs: ["mule_deer", "whitetail", "pronghorn", "elk", "turkey"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "SD GFP Draw Odds & Results",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://gfp.sd.gov/draw-results/",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://gfp.sd.gov",
        endpoints: [
          {
            path: "/draw-results/",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "SD",
        species_slugs: ["mule_deer", "whitetail", "pronghorn", "elk"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ---- KANSAS (KDWP) ----
    {
      name: "KS KDWP Deer & Turkey Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://ksoutdoors.com/Hunting/Big-Game",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://ksoutdoors.com",
        endpoints: [
          {
            path: "/Hunting/Big-Game/Deer",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/Hunting/Turkey",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "KS",
        species_slugs: ["whitetail", "mule_deer", "turkey"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "KS KDWP Draw & Permit Info",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://ksoutdoors.com/Hunting/Big-Game/Deer/Nonresident-Deer-Information",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://ksoutdoors.com",
        endpoints: [
          {
            path: "/Hunting/Big-Game/Deer/Nonresident-Deer-Information",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "KS",
        species_slugs: ["whitetail", "mule_deer"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ---- IOWA (DNR) ----
    {
      name: "IA DNR Deer Seasons & Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.iowadnr.gov/Hunting/Deer-Hunting",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.iowadnr.gov",
        endpoints: [
          {
            path: "/Hunting/Deer-Hunting",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/Hunting/Deer-Hunting/Nonresident-Deer-Hunting",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "IA",
        species_slugs: ["whitetail"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "IA DNR Deer Draw & Quota Info",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://www.iowadnr.gov/Hunting/Deer-Hunting/Deer-Season-Quotas",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.iowadnr.gov",
        endpoints: [
          {
            path: "/Hunting/Deer-Hunting/Deer-Season-Quotas",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "IA",
        species_slugs: ["whitetail"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ---- MISSOURI (MDC) ----
    {
      name: "MO MDC Deer & Turkey Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://mdc.mo.gov/hunting-trapping/species/deer",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://mdc.mo.gov",
        endpoints: [
          {
            path: "/hunting-trapping/species/deer",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunting-trapping/species/turkey",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "MO",
        species_slugs: ["whitetail", "turkey"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "MO MDC Harvest Reports",
      sourceType: "harvest_report",
      authorityTier: 1,
      url: "https://mdc.mo.gov/hunting-trapping/species/deer/deer-reports",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://mdc.mo.gov",
        endpoints: [
          {
            path: "/hunting-trapping/species/deer/deer-reports",
            parser: "harvest_report",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "harvest_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "MO",
        species_slugs: ["whitetail", "turkey"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ---- WISCONSIN (DNR) ----
    {
      name: "WI DNR Deer Seasons & CWD Zones",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://dnr.wisconsin.gov/topic/hunt/deer",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://dnr.wisconsin.gov",
        endpoints: [
          {
            path: "/topic/hunt/deer",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/topic/WildlifeHabitat/CWD",
            parser: "regulation_text",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "WI",
        species_slugs: ["whitetail"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "WI DNR Deer Harvest Reports",
      sourceType: "harvest_report",
      authorityTier: 1,
      url: "https://dnr.wisconsin.gov/topic/WildlifeHabitat/registers",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://dnr.wisconsin.gov",
        endpoints: [
          {
            path: "/topic/WildlifeHabitat/registers",
            parser: "harvest_report",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "harvest_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "WI",
        species_slugs: ["whitetail"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ---- MINNESOTA (DNR) ----
    {
      name: "MN DNR Deer Seasons & Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.dnr.state.mn.us/hunting/deer/index.html",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.dnr.state.mn.us",
        endpoints: [
          {
            path: "/hunting/deer/index.html",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunting/deer/regulations.html",
            parser: "regulation_text",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "MN",
        species_slugs: ["whitetail"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ---- NEBRASKA (Game & Parks) ----
    {
      name: "NE Game & Parks Deer & Antelope Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://outdoornebraska.gov/hunting/seasons-species/deer/",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://outdoornebraska.gov",
        endpoints: [
          {
            path: "/hunting/seasons-species/deer/",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunting/seasons-species/antelope/",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "NE",
        species_slugs: ["whitetail", "mule_deer", "pronghorn"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "NE Game & Parks Draw Results",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://outdoornebraska.gov/hunting/permits/",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://outdoornebraska.gov",
        endpoints: [
          {
            path: "/hunting/permits/",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "NE",
        species_slugs: ["mule_deer", "pronghorn", "elk"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ---- NORTH DAKOTA (Game & Fish) ----
    {
      name: "ND Game & Fish Deer & Elk Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://gf.nd.gov/hunting/deer",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://gf.nd.gov",
        endpoints: [
          {
            path: "/hunting/deer",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunting/elk",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "ND",
        species_slugs: ["whitetail", "mule_deer", "elk"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "ND Game & Fish Draw Info",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://gf.nd.gov/hunting/lottery",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://gf.nd.gov",
        endpoints: [
          {
            path: "/hunting/lottery",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "ND",
        species_slugs: ["whitetail", "mule_deer", "elk"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ====================================================================
    // SOUTHERN STATES
    // ====================================================================

    // ---- TEXAS (TPWD) ----
    {
      name: "TX TPWD Whitetail Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://tpwd.texas.gov/hunting/season-dates/",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://tpwd.texas.gov",
        endpoints: [
          {
            path: "/hunting/season-dates/",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/regulations/outdoor-annual/hunting/white-tailed-deer/",
            parser: "regulation_text",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "TX",
        species_slugs: ["whitetail", "mule_deer", "turkey", "javelina"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "TX TPWD Harvest Reports",
      sourceType: "harvest_report",
      authorityTier: 1,
      url: "https://tpwd.texas.gov/hunting/harvest/",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://tpwd.texas.gov",
        endpoints: [
          {
            path: "/hunting/harvest/",
            parser: "harvest_report",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "harvest_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "TX",
        species_slugs: ["whitetail", "mule_deer"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ---- GEORGIA (DNR) ----
    {
      name: "GA DNR Deer & Turkey Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://gadnr.org/hunting/deer",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://gadnr.org",
        endpoints: [
          {
            path: "/hunting/deer",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunting/turkey",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "GA",
        species_slugs: ["whitetail", "turkey"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ---- ALABAMA (ADCNR) ----
    {
      name: "AL Outdoor Alabama Deer Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.outdooralabama.com/deer-hunting",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.outdooralabama.com",
        endpoints: [
          {
            path: "/deer-hunting",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/deer-hunting/deer-season-dates",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "AL",
        species_slugs: ["whitetail"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ---- KENTUCKY (KDFWR) ----
    {
      name: "KY KDFWR Deer Seasons & Elk Draw",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://fw.ky.gov/Hunt/Pages/Deer-Hunting.aspx",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://fw.ky.gov",
        endpoints: [
          {
            path: "/Hunt/Pages/Deer-Hunting.aspx",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/Hunt/Pages/Elk-Hunting.aspx",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "KY",
        species_slugs: ["whitetail", "elk", "turkey"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "KY KDFWR Elk Draw Results",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://fw.ky.gov/Hunt/Pages/Elk-Information.aspx",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://fw.ky.gov",
        endpoints: [
          {
            path: "/Hunt/Pages/Elk-Information.aspx",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "KY",
        species_slugs: ["elk"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ---- TENNESSEE (TWRA) ----
    {
      name: "TN TWRA Deer & Turkey Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.tn.gov/twra/hunting/big-game.html",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.tn.gov",
        endpoints: [
          {
            path: "/twra/hunting/big-game/deer.html",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/twra/hunting/big-game/turkey.html",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "TN",
        species_slugs: ["whitetail", "turkey"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ---- VIRGINIA (DWR) ----
    {
      name: "VA DWR Deer Seasons & Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://dwr.virginia.gov/hunting/deer/",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://dwr.virginia.gov",
        endpoints: [
          {
            path: "/hunting/deer/",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunting/regulations/",
            parser: "regulation_text",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "VA",
        species_slugs: ["whitetail", "turkey", "black_bear"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ---- NORTH CAROLINA (NCWRC) ----
    {
      name: "NC NCWRC Deer Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.ncwildlife.org/hunting/deer",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.ncwildlife.org",
        endpoints: [
          {
            path: "/hunting/deer",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunting/regulations",
            parser: "regulation_text",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "NC",
        species_slugs: ["whitetail", "turkey", "black_bear"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ====================================================================
    // EASTERN STATES
    // ====================================================================

    // ---- PENNSYLVANIA (PGC) ----
    {
      name: "PA PGC Hunting Seasons & Regulations",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.pgc.pa.gov/HuntTrap/Pages/default.aspx",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.pgc.pa.gov",
        endpoints: [
          {
            path: "/HuntTrap/Law/Pages/SeasonsAndBagLimits.aspx",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/HuntTrap/Law/Pages/HuntingRegulations.aspx",
            parser: "regulation_text",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "PA",
        species_slugs: ["whitetail", "turkey", "elk", "black_bear"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "PA PGC Elk Draw & Harvest",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://www.pgc.pa.gov/Wildlife/WildlifeSpecies/Elk/Pages/default.aspx",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.pgc.pa.gov",
        endpoints: [
          {
            path: "/Wildlife/WildlifeSpecies/Elk/Pages/default.aspx",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "PA",
        species_slugs: ["elk"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ---- NEW YORK (DEC) ----
    {
      name: "NY DEC Deer & Turkey Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.dec.ny.gov/outdoor/hunting.html",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.dec.ny.gov",
        endpoints: [
          {
            path: "/outdoor/8305.html",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/outdoor/8357.html",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "NY",
        species_slugs: ["whitetail", "turkey"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ---- MAINE (IFW) ----
    {
      name: "ME IFW Moose Lottery & Deer Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.maine.gov/ifw/hunting-trapping/hunting/index.html",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.maine.gov",
        endpoints: [
          {
            path: "/ifw/hunting-trapping/hunting/deer.html",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/ifw/hunting-trapping/hunting/moose/index.html",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "ME",
        species_slugs: ["whitetail", "moose", "turkey", "black_bear"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "ME IFW Moose Lottery Draw Results",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://www.maine.gov/ifw/hunting-trapping/hunting/moose/lottery.html",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.maine.gov",
        endpoints: [
          {
            path: "/ifw/hunting-trapping/hunting/moose/lottery.html",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "ME",
        species_slugs: ["moose"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },

    // ---- VERMONT (VFW) ----
    {
      name: "VT Fish & Wildlife Deer & Moose Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://vtfishandwildlife.com/hunt/hunting-and-trapping-seasons-and-regulations",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://vtfishandwildlife.com",
        endpoints: [
          {
            path: "/hunt/hunting-and-trapping-seasons-and-regulations",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunt/deer",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "VT",
        species_slugs: ["whitetail", "moose", "turkey", "black_bear"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },

    // ---- NEW HAMPSHIRE (Fish & Game) ----
    {
      name: "NH Fish & Game Moose Lottery & Deer Seasons",
      sourceType: "state_agency",
      authorityTier: 1,
      url: "https://www.wildlife.state.nh.us/hunting/hunt-seasons.html",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.wildlife.state.nh.us",
        endpoints: [
          {
            path: "/hunting/hunt-seasons.html",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "season_summary",
          },
          {
            path: "/hunting/deer.html",
            parser: "season_dates",
            params: {},
            schedule: "0 6 * * 1",
            doc_type: "regulation",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "NH",
        species_slugs: ["whitetail", "moose", "turkey", "black_bear"],
        timeout_ms: 30000,
      },
      refreshCadence: "weekly",
      status: "active",
      enabled: true,
    },
    {
      name: "NH Fish & Game Moose Lottery Results",
      sourceType: "draw_report",
      authorityTier: 1,
      url: "https://www.wildlife.state.nh.us/hunting/moose.html",
      scraperConfig: {
        adapter: "web_scraper",
        base_url: "https://www.wildlife.state.nh.us",
        endpoints: [
          {
            path: "/hunting/moose.html",
            parser: "draw_odds_table",
            params: {},
            schedule: "0 6 1 * *",
            doc_type: "draw_report",
          },
        ],
        rate_limit: { requests_per_minute: 10 },
        retry: { max_attempts: 3, backoff_ms: 5000 },
        state_code: "NH",
        species_slugs: ["moose"],
        timeout_ms: 30000,
      },
      refreshCadence: "monthly",
      status: "active",
      enabled: true,
    },
  ];

  const insertedDataSources = await db
    .insert(dataSources)
    .values(priorityDataSources)
    .onConflictDoNothing()
    .returning();
  console.log(`  -> ${insertedDataSources.length} data sources inserted (${priorityDataSources.length} total)`);

  // --------------------------------------------------------------------------
  // 5. AI PROMPTS — Default prompt templates
  // --------------------------------------------------------------------------
  console.log("[5/9] Seeding AI prompts...");

  const defaultPrompts = [
    {
      slug: "onboarding_welcome",
      name: "Onboarding Welcome",
      category: "onboarding",
      template: `You are HuntLogic Concierge, an expert hunting strategist. Welcome the hunter warmly and ask them what species they're most interested in pursuing. Be conversational, knowledgeable, and enthusiastic about hunting. Keep your response concise — 2-3 sentences max.

Hunter's name: {{display_name}}`,
      variables: ["display_name"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "onboarding_species",
      name: "Onboarding Species Interest",
      category: "onboarding",
      template: `You are HuntLogic Concierge. The hunter has expressed interest in specific species. Ask a follow-up question about their hunting orientation — are they primarily trophy-focused, opportunity-focused (most tags/most hunts), or looking for a balanced approach? Explain briefly what each means in practical terms.

Species interests: {{species_interests}}
Current profile: {{profile_summary}}`,
      variables: ["species_interests", "profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "onboarding_orientation",
      name: "Onboarding Hunt Orientation",
      category: "onboarding",
      template: `You are HuntLogic Concierge. Based on the hunter's species interests and orientation, ask about their timeline preferences. Are they looking for hunts this year, willing to build points over 1-3 years, or planning a long-term 5+ year strategy? Mention how point systems work briefly.

Current profile: {{profile_summary}}`,
      variables: ["profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "onboarding_timeline",
      name: "Onboarding Timeline",
      category: "onboarding",
      template: `You are HuntLogic Concierge. Now ask about budget. What's their approximate annual budget for hunting applications, tags, licenses, and travel? Give them ranges to choose from: Under $1,000 / $1,000-$3,000 / $3,000-$5,000 / $5,000-$10,000 / $10,000+. Explain that this helps optimize their hunt portfolio.

Current profile: {{profile_summary}}`,
      variables: ["profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "onboarding_budget",
      name: "Onboarding Budget",
      category: "onboarding",
      template: `You are HuntLogic Concierge. The hunter has provided enough information to start building their playbook. Summarize what you know about them and tell them you're ready to generate personalized recommendations. Ask if they have any existing preference or bonus points in any states, or if they'd like to jump straight to their strategy.

Current profile: {{profile_summary}}`,
      variables: ["profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 768,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "strategy_summary",
      name: "Strategy Summary Generation",
      category: "playbook",
      template: `You are HuntLogic Concierge, generating a strategic hunting playbook summary. Based on the hunter's profile and the recommendations engine output, write a concise strategy overview. Include:

1. Overall strategy theme (e.g., "Balanced Western Big Game Portfolio")
2. Key opportunities this year
3. Point-building plays for future years
4. Budget allocation suggestion
5. Critical deadlines to watch

Hunter Profile: {{profile_summary}}
Recommendations: {{recommendations}}
Deadline context: {{deadlines}}`,
      variables: ["profile_summary", "recommendations", "deadlines"],
      model: "claude-sonnet-4-6",
      maxTokens: 2048,
      temperature: 0.5,
      version: 1,
      active: true,
    },
    {
      slug: "recommendation_explanation",
      name: "Recommendation Explanation",
      category: "recommendation",
      template: `You are HuntLogic Concierge. Explain this specific hunt recommendation to the hunter in plain English. Cover:

1. Why this hunt fits their profile
2. Draw odds context and what their points mean
3. Expected costs (tag, license, travel estimate)
4. What to expect (terrain, difficulty, success rates)
5. Any tradeoffs or risks
6. Cite specific data sources when possible

Recommendation: {{recommendation}}
Hunter Profile: {{profile_summary}}
Draw odds data: {{draw_odds}}
Harvest stats: {{harvest_stats}}`,
      variables: ["recommendation", "profile_summary", "draw_odds", "harvest_stats"],
      model: "claude-sonnet-4-6",
      maxTokens: 1536,
      temperature: 0.5,
      version: 1,
      active: true,
    },
    {
      slug: "playbook_intro",
      name: "Playbook Introduction",
      category: "playbook",
      template: `You are HuntLogic Concierge. The hunter is viewing their personalized playbook for the first time. Write a brief, engaging introduction that:

1. Acknowledges their goals and preferences
2. Previews what they'll find in the playbook
3. Highlights the #1 recommendation and why it's exciting
4. Encourages them to explore and provide feedback

Keep it to 3-4 paragraphs. Be enthusiastic but data-driven.

Hunter Profile: {{profile_summary}}
Top Recommendation: {{top_recommendation}}
Total Recommendations: {{rec_count}}`,
      variables: ["profile_summary", "top_recommendation", "rec_count"],
      model: "claude-sonnet-4-6",
      maxTokens: 1024,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    // ====================================================================
    // Additional Onboarding Prompts (Step 4 — Profile Service)
    // ====================================================================
    {
      slug: "onboarding_points",
      name: "Onboarding Preference Points",
      category: "onboarding",
      template: `You are a friendly hunting strategist. Ask the hunter about their current preference/bonus points across western states. Be conversational. If they don't know what points are, briefly explain. Ask which states they have points in and how many.

Current profile: {{profile_summary}}`,
      variables: ["profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "onboarding_travel",
      name: "Onboarding Travel Tolerance",
      category: "onboarding",
      template: `You are a friendly hunting strategist. Ask the hunter about how far they're willing to travel for hunts. Are they looking to stay close to home, drive regionally, or fly anywhere? Be conversational and warm.

Current profile: {{profile_summary}}`,
      variables: ["profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "onboarding_style",
      name: "Onboarding Hunt Style",
      category: "onboarding",
      template: `You are a friendly hunting strategist. Ask the hunter about their preferred hunting style. Do they prefer DIY public land, private land access, guided hunts, or a mix? Be warm and non-judgmental.

Current profile: {{profile_summary}}`,
      variables: ["profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "onboarding_location",
      name: "Onboarding Home Location",
      category: "onboarding",
      template: `You are a friendly hunting strategist. Ask the hunter where they're based (home state). This helps us find nearby opportunities and factor in residency advantages. Be conversational.

Current profile: {{profile_summary}}`,
      variables: ["profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "onboarding_weapon",
      name: "Onboarding Weapon Preference",
      category: "onboarding",
      template: `You are a friendly hunting strategist. Ask the hunter about their weapon preferences — rifle, archery, muzzleloader, or no preference. Be conversational.

Current profile: {{profile_summary}}`,
      variables: ["profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "onboarding_physical",
      name: "Onboarding Physical Ability",
      category: "onboarding",
      template: `You are a friendly hunting strategist. Ask the hunter about their comfort level with physical demands — backcountry high-altitude, moderate terrain, or road-accessible. Be respectful and inclusive.

Current profile: {{profile_summary}}`,
      variables: ["profile_summary"],
      model: "claude-sonnet-4-6",
      maxTokens: 512,
      temperature: 0.7,
      version: 1,
      active: true,
    },
    {
      slug: "interpret_free_text",
      name: "Free Text Answer Interpreter",
      category: "onboarding",
      template: `You are a hunting data extraction assistant. Given a hunter's free-text response to a question, extract structured preferences. Return JSON with an array of {category, key, value, confidence} objects. Only extract what is clearly stated or strongly implied. Be conservative.

Question context: {{question_context}}
Hunter's response: {{response_text}}`,
      variables: ["question_context", "response_text"],
      model: "claude-sonnet-4-6",
      maxTokens: 1024,
      temperature: 0.3,
      version: 1,
      active: true,
    },
  ];

  const insertedPrompts = await db
    .insert(aiPrompts)
    .values(defaultPrompts)
    .onConflictDoNothing()
    .returning();
  console.log(`  -> ${insertedPrompts.length} AI prompts inserted (${defaultPrompts.length} total)`);

  // --------------------------------------------------------------------------
  // 6. APP CONFIG — Default configuration
  // --------------------------------------------------------------------------
  console.log("[6/9] Seeding app config...");

  const defaultConfigs = [
    {
      namespace: "onboarding",
      key: "min_questions",
      value: 5,
      description:
        "Minimum number of onboarding questions before playbook generation is triggered",
    },
    {
      namespace: "recommendations",
      key: "batch_size",
      value: 10,
      description:
        "Number of recommendations to generate per playbook refresh",
    },
    {
      namespace: "forecasting",
      key: "horizon_years",
      value: 5,
      description:
        "How many years forward to project point creep and draw odds",
    },
    {
      namespace: "scraping",
      key: "max_concurrent_jobs",
      value: 5,
      description:
        "Maximum number of concurrent data scraping/ingestion jobs",
    },
    {
      namespace: "recommendations",
      key: "score_weights",
      value: {
        draw_odds: 0.25,
        trophy_quality: 0.15,
        success_rate: 0.20,
        cost_efficiency: 0.15,
        access: 0.10,
        forecast: 0.10,
        personal_fit: 0.05,
      },
      description:
        "Default scoring weights for recommendation ranking algorithm",
    },
    {
      namespace: "notifications",
      key: "deadline_reminder_defaults",
      value: [30, 14, 7, 3, 1],
      description:
        "Default days-before-deadline to send reminder notifications",
    },
  ];

  const insertedConfigs = await db
    .insert(appConfig)
    .values(defaultConfigs)
    .onConflictDoNothing()
    .returning();
  console.log(`  -> ${insertedConfigs.length} app config entries inserted (${defaultConfigs.length} total)`);

  // --------------------------------------------------------------------------
  // 7. FEE SCHEDULES — State fee data for 5 launch states
  // --------------------------------------------------------------------------
  console.log("[7/9] Seeding fee schedules...");
  await seedFeeSchedules();

  // --------------------------------------------------------------------------
  // 8. SERVICE FEES — HuntLogic concierge pricing tiers
  // --------------------------------------------------------------------------
  console.log("[8/9] Seeding service fees...");
  await seedServiceFees();

  // --------------------------------------------------------------------------
  // 9. STATE FORM CONFIGS — Application form schemas per state
  // --------------------------------------------------------------------------
  console.log("[9/9] Seeding state form configs...");
  await seedFormConfigs();

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log("\n=== Seed Summary ===");
  console.log(`  States:               ${allStates.length}`);
  console.log(`  Species:              ${allSpecies.length}`);
  console.log(`  State-Species:        ${stateSpeciesMappings.length}`);
  console.log(`  Data Sources:         ${priorityDataSources.length}`);
  console.log(`  AI Prompts:           ${defaultPrompts.length}`);
  console.log(`  App Config:           ${defaultConfigs.length}`);
  console.log(`  Fee Schedules:        (see above)`);
  console.log(`  Service Fees:         (see above)`);
  console.log(`  Form Configs:         (see above)`);
  console.log("=== Seed complete ===\n");
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------
seed()
  .then(async () => {
    console.log("Done. Closing connection...");
    await client.end();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("Seed failed:", err);
    await client.end();
    process.exit(1);
  });
