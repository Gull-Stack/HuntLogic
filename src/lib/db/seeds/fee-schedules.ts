import { db } from "@/lib/db";
import { stateFeeSchedules, states, species } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

// =============================================================================
// Fee Schedule Seed — 2026 Draw Year
// =============================================================================
// Covers 9 states: CO, WY, MT, AZ, NM, ID, UT, NV, OR
// Fee amounts based on published state agency rates.
// Source: manual review of each state's 2025-2026 fee schedules.
// =============================================================================

interface FeeEntry {
  stateCode: string;
  speciesSlug: string;
  residency: "resident" | "nonresident";
  feeType: string;
  feeName: string;
  amount: string;
  required: boolean;
  notes?: string;
  sourceUrl?: string;
}

// ---------------------------------------------------------------------------
// COLORADO (CPW) — 2026 Fee Data
// ---------------------------------------------------------------------------
// Source: https://cpw.state.co.us/thingstodo/Pages/BigGameApplications.aspx
// CO uses preference points. Habitat Stamp required for all.
// Application fee is per-species. Tag charged only if drawn.
// ---------------------------------------------------------------------------

const CO_FEES: FeeEntry[] = [
  // --- Elk ---
  // Resident
  { stateCode: "CO", speciesSlug: "elk", residency: "resident", feeType: "application", feeName: "Elk Application Fee", amount: "10.00", required: true, sourceUrl: "https://cpw.state.co.us" },
  { stateCode: "CO", speciesSlug: "elk", residency: "resident", feeType: "preference_point", feeName: "Elk Preference Point Fee", amount: "40.00", required: false, notes: "Optional; purchased instead of or with application" },
  { stateCode: "CO", speciesSlug: "elk", residency: "resident", feeType: "tag_if_drawn", feeName: "Elk License (if drawn)", amount: "56.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "CO", speciesSlug: "elk", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true, notes: "Required annually before applying" },
  // Nonresident
  { stateCode: "CO", speciesSlug: "elk", residency: "nonresident", feeType: "application", feeName: "Elk Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "elk", residency: "nonresident", feeType: "preference_point", feeName: "Elk Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "elk", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Elk License (if drawn)", amount: "660.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "CO", speciesSlug: "elk", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },

  // --- Deer (Mule Deer) ---
  { stateCode: "CO", speciesSlug: "mule_deer", residency: "resident", feeType: "application", feeName: "Deer Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "mule_deer", residency: "resident", feeType: "preference_point", feeName: "Deer Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "mule_deer", residency: "resident", feeType: "tag_if_drawn", feeName: "Deer License (if drawn)", amount: "41.00", required: true },
  { stateCode: "CO", speciesSlug: "mule_deer", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "mule_deer", residency: "nonresident", feeType: "application", feeName: "Deer Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "mule_deer", residency: "nonresident", feeType: "preference_point", feeName: "Deer Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "mule_deer", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Deer License (if drawn)", amount: "411.00", required: true },
  { stateCode: "CO", speciesSlug: "mule_deer", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },

  // --- Antelope (Pronghorn) ---
  { stateCode: "CO", speciesSlug: "pronghorn", residency: "resident", feeType: "application", feeName: "Antelope Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "pronghorn", residency: "resident", feeType: "preference_point", feeName: "Antelope Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "pronghorn", residency: "resident", feeType: "tag_if_drawn", feeName: "Antelope License (if drawn)", amount: "41.00", required: true },
  { stateCode: "CO", speciesSlug: "pronghorn", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "pronghorn", residency: "nonresident", feeType: "application", feeName: "Antelope Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "pronghorn", residency: "nonresident", feeType: "preference_point", feeName: "Antelope Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "pronghorn", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Antelope License (if drawn)", amount: "411.00", required: true },
  { stateCode: "CO", speciesSlug: "pronghorn", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },

  // --- Moose ---
  { stateCode: "CO", speciesSlug: "moose", residency: "resident", feeType: "application", feeName: "Moose Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "moose", residency: "resident", feeType: "preference_point", feeName: "Moose Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "moose", residency: "resident", feeType: "tag_if_drawn", feeName: "Moose License (if drawn)", amount: "296.00", required: true },
  { stateCode: "CO", speciesSlug: "moose", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "moose", residency: "nonresident", feeType: "application", feeName: "Moose Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "moose", residency: "nonresident", feeType: "preference_point", feeName: "Moose Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "moose", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Moose License (if drawn)", amount: "2,161.00", required: true },
  { stateCode: "CO", speciesSlug: "moose", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },

  // --- Mountain Goat ---
  { stateCode: "CO", speciesSlug: "mountain_goat", residency: "resident", feeType: "application", feeName: "Mountain Goat Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "mountain_goat", residency: "resident", feeType: "preference_point", feeName: "Mountain Goat Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "mountain_goat", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Goat License (if drawn)", amount: "296.00", required: true },
  { stateCode: "CO", speciesSlug: "mountain_goat", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "application", feeName: "Mountain Goat Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "preference_point", feeName: "Mountain Goat Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Goat License (if drawn)", amount: "2,161.00", required: true },
  { stateCode: "CO", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },

  // --- Bighorn Sheep ---
  { stateCode: "CO", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "application", feeName: "Bighorn Sheep Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "preference_point", feeName: "Bighorn Sheep Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep License (if drawn)", amount: "296.00", required: true },
  { stateCode: "CO", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "application", feeName: "Bighorn Sheep Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "preference_point", feeName: "Bighorn Sheep Preference Point Fee", amount: "40.00", required: false },
  { stateCode: "CO", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep License (if drawn)", amount: "2,161.00", required: true },
  { stateCode: "CO", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },

  // --- Bear ---
  { stateCode: "CO", speciesSlug: "black_bear", residency: "resident", feeType: "application", feeName: "Bear Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "black_bear", residency: "resident", feeType: "tag_if_drawn", feeName: "Bear License (if drawn)", amount: "41.00", required: true },
  { stateCode: "CO", speciesSlug: "black_bear", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "black_bear", residency: "nonresident", feeType: "application", feeName: "Bear Application Fee", amount: "10.00", required: true },
  { stateCode: "CO", speciesSlug: "black_bear", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bear License (if drawn)", amount: "411.00", required: true },
  { stateCode: "CO", speciesSlug: "black_bear", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Stamp", amount: "10.00", required: true },
];

// ---------------------------------------------------------------------------
// WYOMING (WGFD) — 2026 Fee Data
// ---------------------------------------------------------------------------
// Source: https://wgfd.wyo.gov/apply-or-buy
// WY uses preference points. Full tag price charged upfront, refunded if not drawn.
// Application fee is separate and non-refundable.
// Conservation stamp required for NR ($15 res / $30 NR).
// ---------------------------------------------------------------------------

const WY_FEES: FeeEntry[] = [
  // --- Elk ---
  { stateCode: "WY", speciesSlug: "elk", residency: "resident", feeType: "application", feeName: "Elk Application Fee", amount: "15.00", required: true, sourceUrl: "https://wgfd.wyo.gov" },
  { stateCode: "WY", speciesSlug: "elk", residency: "resident", feeType: "preference_point", feeName: "Elk Preference Point Fee", amount: "52.00", required: false, notes: "Point-only purchase option" },
  { stateCode: "WY", speciesSlug: "elk", residency: "resident", feeType: "tag_if_drawn", feeName: "Elk License Fee", amount: "57.00", required: true, notes: "Full price charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "elk", residency: "resident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "elk", residency: "nonresident", feeType: "application", feeName: "Elk Application Fee", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "elk", residency: "nonresident", feeType: "preference_point", feeName: "Elk Preference Point Fee", amount: "102.00", required: false },
  { stateCode: "WY", speciesSlug: "elk", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Elk License Fee", amount: "712.00", required: true, notes: "Full price charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "elk", residency: "nonresident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "30.00", required: true },

  // --- Deer ---
  { stateCode: "WY", speciesSlug: "mule_deer", residency: "resident", feeType: "application", feeName: "Deer Application Fee", amount: "10.00", required: true },
  { stateCode: "WY", speciesSlug: "mule_deer", residency: "resident", feeType: "preference_point", feeName: "Deer Preference Point Fee", amount: "37.00", required: false },
  { stateCode: "WY", speciesSlug: "mule_deer", residency: "resident", feeType: "tag_if_drawn", feeName: "Deer License Fee", amount: "43.00", required: true, notes: "Charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "mule_deer", residency: "resident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "mule_deer", residency: "nonresident", feeType: "application", feeName: "Deer Application Fee", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "mule_deer", residency: "nonresident", feeType: "preference_point", feeName: "Deer Preference Point Fee", amount: "77.00", required: false },
  { stateCode: "WY", speciesSlug: "mule_deer", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Deer License Fee", amount: "388.00", required: true, notes: "Charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "mule_deer", residency: "nonresident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "30.00", required: true },

  // --- Antelope ---
  { stateCode: "WY", speciesSlug: "pronghorn", residency: "resident", feeType: "application", feeName: "Antelope Application Fee", amount: "10.00", required: true },
  { stateCode: "WY", speciesSlug: "pronghorn", residency: "resident", feeType: "preference_point", feeName: "Antelope Preference Point Fee", amount: "37.00", required: false },
  { stateCode: "WY", speciesSlug: "pronghorn", residency: "resident", feeType: "tag_if_drawn", feeName: "Antelope License Fee", amount: "43.00", required: true, notes: "Charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "pronghorn", residency: "resident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "pronghorn", residency: "nonresident", feeType: "application", feeName: "Antelope Application Fee", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "pronghorn", residency: "nonresident", feeType: "preference_point", feeName: "Antelope Preference Point Fee", amount: "77.00", required: false },
  { stateCode: "WY", speciesSlug: "pronghorn", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Antelope License Fee", amount: "303.00", required: true, notes: "Charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "pronghorn", residency: "nonresident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "30.00", required: true },

  // --- Moose ---
  { stateCode: "WY", speciesSlug: "moose", residency: "resident", feeType: "application", feeName: "Moose Application Fee", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "moose", residency: "resident", feeType: "preference_point", feeName: "Moose Preference Point Fee", amount: "102.00", required: false },
  { stateCode: "WY", speciesSlug: "moose", residency: "resident", feeType: "tag_if_drawn", feeName: "Moose License Fee", amount: "300.00", required: true, notes: "Charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "moose", residency: "resident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "moose", residency: "nonresident", feeType: "application", feeName: "Moose Application Fee", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "moose", residency: "nonresident", feeType: "preference_point", feeName: "Moose Preference Point Fee", amount: "252.00", required: false },
  { stateCode: "WY", speciesSlug: "moose", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Moose License Fee", amount: "1,876.00", required: true, notes: "Charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "moose", residency: "nonresident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "30.00", required: true },

  // --- Bighorn Sheep ---
  { stateCode: "WY", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "application", feeName: "Bighorn Sheep Application Fee", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "preference_point", feeName: "Bighorn Sheep Preference Point Fee", amount: "102.00", required: false },
  { stateCode: "WY", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep License Fee", amount: "300.00", required: true, notes: "Charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "application", feeName: "Bighorn Sheep Application Fee", amount: "15.00", required: true },
  { stateCode: "WY", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "preference_point", feeName: "Bighorn Sheep Preference Point Fee", amount: "252.00", required: false },
  { stateCode: "WY", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep License Fee", amount: "2,376.00", required: true, notes: "Charged upfront; refunded if unsuccessful" },
  { stateCode: "WY", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "conservation_stamp", feeName: "Conservation Stamp", amount: "30.00", required: true },
];

// ---------------------------------------------------------------------------
// MONTANA (MFWP) — 2026 Fee Data
// ---------------------------------------------------------------------------
// Source: https://fwp.mt.gov/hunting/licenses
// MT uses bonus points. Conservation License + base hunting license required.
// Application fee is per-species. Permits charged on draw.
// ---------------------------------------------------------------------------

const MT_FEES: FeeEntry[] = [
  // --- Elk ---
  { stateCode: "MT", speciesSlug: "elk", residency: "resident", feeType: "application", feeName: "Elk Permit Application Fee", amount: "5.00", required: true, sourceUrl: "https://fwp.mt.gov" },
  { stateCode: "MT", speciesSlug: "elk", residency: "resident", feeType: "bonus_point", feeName: "Elk Bonus Point Fee", amount: "20.00", required: false, notes: "Earned through unsuccessful application or point-only purchase" },
  { stateCode: "MT", speciesSlug: "elk", residency: "resident", feeType: "tag_if_drawn", feeName: "Elk Permit Fee", amount: "20.00", required: true, notes: "Special permit fee; general tag is part of base license" },
  { stateCode: "MT", speciesSlug: "elk", residency: "resident", feeType: "license_prerequisite", feeName: "Base Hunting License", amount: "15.00", required: true, notes: "Conservation ($10) + Hunting ($15) required" },
  { stateCode: "MT", speciesSlug: "elk", residency: "nonresident", feeType: "application", feeName: "Elk Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "elk", residency: "nonresident", feeType: "bonus_point", feeName: "Elk Bonus Point Fee", amount: "50.00", required: false },
  { stateCode: "MT", speciesSlug: "elk", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Elk Permit / Elk Combo License", amount: "875.00", required: true, notes: "NR Big Game Elk Combo includes deer" },
  { stateCode: "MT", speciesSlug: "elk", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Conservation + Base Hunting License", amount: "130.00", required: true, notes: "Conservation ($10) + NR Hunting License ($120)" },

  // --- Deer ---
  { stateCode: "MT", speciesSlug: "mule_deer", residency: "resident", feeType: "application", feeName: "Deer Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "mule_deer", residency: "resident", feeType: "bonus_point", feeName: "Deer Bonus Point Fee", amount: "20.00", required: false },
  { stateCode: "MT", speciesSlug: "mule_deer", residency: "resident", feeType: "tag_if_drawn", feeName: "Deer Permit Fee", amount: "20.00", required: true },
  { stateCode: "MT", speciesSlug: "mule_deer", residency: "resident", feeType: "license_prerequisite", feeName: "Base Hunting License", amount: "15.00", required: true },
  { stateCode: "MT", speciesSlug: "mule_deer", residency: "nonresident", feeType: "application", feeName: "Deer Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "mule_deer", residency: "nonresident", feeType: "bonus_point", feeName: "Deer Bonus Point Fee", amount: "50.00", required: false },
  { stateCode: "MT", speciesSlug: "mule_deer", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Deer Combo License", amount: "695.00", required: true, notes: "NR Big Game Deer Combo" },
  { stateCode: "MT", speciesSlug: "mule_deer", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Conservation + Base Hunting License", amount: "130.00", required: true },

  // --- Antelope ---
  { stateCode: "MT", speciesSlug: "pronghorn", residency: "resident", feeType: "application", feeName: "Antelope Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "pronghorn", residency: "resident", feeType: "bonus_point", feeName: "Antelope Bonus Point Fee", amount: "20.00", required: false },
  { stateCode: "MT", speciesSlug: "pronghorn", residency: "resident", feeType: "tag_if_drawn", feeName: "Antelope License", amount: "18.00", required: true },
  { stateCode: "MT", speciesSlug: "pronghorn", residency: "resident", feeType: "license_prerequisite", feeName: "Base Hunting License", amount: "15.00", required: true },
  { stateCode: "MT", speciesSlug: "pronghorn", residency: "nonresident", feeType: "application", feeName: "Antelope Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "pronghorn", residency: "nonresident", feeType: "bonus_point", feeName: "Antelope Bonus Point Fee", amount: "50.00", required: false },
  { stateCode: "MT", speciesSlug: "pronghorn", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Antelope License (NR)", amount: "205.00", required: true },
  { stateCode: "MT", speciesSlug: "pronghorn", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Conservation + Base Hunting License", amount: "130.00", required: true },

  // --- Moose ---
  { stateCode: "MT", speciesSlug: "moose", residency: "resident", feeType: "application", feeName: "Moose Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "moose", residency: "resident", feeType: "bonus_point", feeName: "Moose Bonus Point Fee", amount: "20.00", required: false },
  { stateCode: "MT", speciesSlug: "moose", residency: "resident", feeType: "tag_if_drawn", feeName: "Moose Permit Fee", amount: "125.00", required: true },
  { stateCode: "MT", speciesSlug: "moose", residency: "resident", feeType: "license_prerequisite", feeName: "Base Hunting License", amount: "15.00", required: true },
  { stateCode: "MT", speciesSlug: "moose", residency: "nonresident", feeType: "application", feeName: "Moose Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "moose", residency: "nonresident", feeType: "bonus_point", feeName: "Moose Bonus Point Fee", amount: "50.00", required: false },
  { stateCode: "MT", speciesSlug: "moose", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Moose Permit Fee (NR)", amount: "1,250.00", required: true },
  { stateCode: "MT", speciesSlug: "moose", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Conservation + Base Hunting License", amount: "130.00", required: true },

  // --- Mountain Goat ---
  { stateCode: "MT", speciesSlug: "mountain_goat", residency: "resident", feeType: "application", feeName: "Mountain Goat Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "mountain_goat", residency: "resident", feeType: "bonus_point", feeName: "Mountain Goat Bonus Point Fee", amount: "20.00", required: false },
  { stateCode: "MT", speciesSlug: "mountain_goat", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Goat Permit Fee", amount: "125.00", required: true },
  { stateCode: "MT", speciesSlug: "mountain_goat", residency: "resident", feeType: "license_prerequisite", feeName: "Base Hunting License", amount: "15.00", required: true },
  { stateCode: "MT", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "application", feeName: "Mountain Goat Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "bonus_point", feeName: "Mountain Goat Bonus Point Fee", amount: "50.00", required: false },
  { stateCode: "MT", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Goat Permit Fee (NR)", amount: "1,250.00", required: true },
  { stateCode: "MT", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Conservation + Base Hunting License", amount: "130.00", required: true },

  // --- Bighorn Sheep ---
  { stateCode: "MT", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "application", feeName: "Bighorn Sheep Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "bonus_point", feeName: "Bighorn Sheep Bonus Point Fee", amount: "20.00", required: false },
  { stateCode: "MT", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Permit Fee", amount: "125.00", required: true },
  { stateCode: "MT", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "license_prerequisite", feeName: "Base Hunting License", amount: "15.00", required: true },
  { stateCode: "MT", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "application", feeName: "Bighorn Sheep Permit Application Fee", amount: "5.00", required: true },
  { stateCode: "MT", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "bonus_point", feeName: "Bighorn Sheep Bonus Point Fee", amount: "50.00", required: false },
  { stateCode: "MT", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Permit Fee (NR)", amount: "1,250.00", required: true },
  { stateCode: "MT", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Conservation + Base Hunting License", amount: "130.00", required: true },
];

// ---------------------------------------------------------------------------
// ARIZONA (AZGFD) — 2026 Fee Data
// ---------------------------------------------------------------------------
// Source: https://www.azgfd.com/hunting/regulations/
// AZ uses bonus points. Application fee + hunting license required.
// Tag fee charged only upon successful draw.
// Bonus points auto-earned on unsuccessful application (no separate purchase).
// ---------------------------------------------------------------------------

const AZ_FEES: FeeEntry[] = [
  // --- Elk ---
  { stateCode: "AZ", speciesSlug: "elk", residency: "resident", feeType: "application", feeName: "Elk Application Fee", amount: "13.00", required: true, sourceUrl: "https://www.azgfd.com" },
  { stateCode: "AZ", speciesSlug: "elk", residency: "resident", feeType: "bonus_point", feeName: "Elk Bonus Point (Loyalty)", amount: "13.00", required: false, notes: "Point-only application; auto-earned on unsuccessful draw" },
  { stateCode: "AZ", speciesSlug: "elk", residency: "resident", feeType: "tag_if_drawn", feeName: "Elk Tag Fee", amount: "150.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "AZ", speciesSlug: "elk", residency: "resident", feeType: "license_prerequisite", feeName: "General Hunting License", amount: "37.00", required: true, notes: "Valid 365 days from purchase" },
  { stateCode: "AZ", speciesSlug: "elk", residency: "nonresident", feeType: "application", feeName: "Elk Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "elk", residency: "nonresident", feeType: "bonus_point", feeName: "Elk Bonus Point (Loyalty)", amount: "13.00", required: false, notes: "Point-only application; auto-earned on unsuccessful draw" },
  { stateCode: "AZ", speciesSlug: "elk", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Elk Tag Fee (NR)", amount: "665.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "AZ", speciesSlug: "elk", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR General Hunting License", amount: "160.00", required: true },

  // --- Deer ---
  { stateCode: "AZ", speciesSlug: "mule_deer", residency: "resident", feeType: "application", feeName: "Deer Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "mule_deer", residency: "resident", feeType: "bonus_point", feeName: "Deer Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "mule_deer", residency: "resident", feeType: "tag_if_drawn", feeName: "Deer Tag Fee", amount: "47.00", required: true },
  { stateCode: "AZ", speciesSlug: "mule_deer", residency: "resident", feeType: "license_prerequisite", feeName: "General Hunting License", amount: "37.00", required: true },
  { stateCode: "AZ", speciesSlug: "mule_deer", residency: "nonresident", feeType: "application", feeName: "Deer Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "mule_deer", residency: "nonresident", feeType: "bonus_point", feeName: "Deer Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "mule_deer", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Deer Tag Fee (NR)", amount: "300.00", required: true },
  { stateCode: "AZ", speciesSlug: "mule_deer", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR General Hunting License", amount: "160.00", required: true },

  // --- Antelope ---
  { stateCode: "AZ", speciesSlug: "pronghorn", residency: "resident", feeType: "application", feeName: "Antelope Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "pronghorn", residency: "resident", feeType: "bonus_point", feeName: "Antelope Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "pronghorn", residency: "resident", feeType: "tag_if_drawn", feeName: "Antelope Tag Fee", amount: "72.00", required: true },
  { stateCode: "AZ", speciesSlug: "pronghorn", residency: "resident", feeType: "license_prerequisite", feeName: "General Hunting License", amount: "37.00", required: true },
  { stateCode: "AZ", speciesSlug: "pronghorn", residency: "nonresident", feeType: "application", feeName: "Antelope Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "pronghorn", residency: "nonresident", feeType: "bonus_point", feeName: "Antelope Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "pronghorn", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Antelope Tag Fee (NR)", amount: "440.00", required: true },
  { stateCode: "AZ", speciesSlug: "pronghorn", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR General Hunting License", amount: "160.00", required: true },

  // --- Javelina ---
  { stateCode: "AZ", speciesSlug: "javelina", residency: "resident", feeType: "application", feeName: "Javelina Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "javelina", residency: "resident", feeType: "bonus_point", feeName: "Javelina Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "javelina", residency: "resident", feeType: "tag_if_drawn", feeName: "Javelina Tag Fee", amount: "30.00", required: true },
  { stateCode: "AZ", speciesSlug: "javelina", residency: "resident", feeType: "license_prerequisite", feeName: "General Hunting License", amount: "37.00", required: true },
  { stateCode: "AZ", speciesSlug: "javelina", residency: "nonresident", feeType: "application", feeName: "Javelina Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "javelina", residency: "nonresident", feeType: "bonus_point", feeName: "Javelina Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "javelina", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Javelina Tag Fee (NR)", amount: "115.00", required: true },
  { stateCode: "AZ", speciesSlug: "javelina", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR General Hunting License", amount: "160.00", required: true },

  // --- Bighorn Sheep ---
  { stateCode: "AZ", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "application", feeName: "Bighorn Sheep Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "bonus_point", feeName: "Bighorn Sheep Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Tag Fee", amount: "285.00", required: true },
  { stateCode: "AZ", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "license_prerequisite", feeName: "General Hunting License", amount: "37.00", required: true },
  { stateCode: "AZ", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "application", feeName: "Bighorn Sheep Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "bonus_point", feeName: "Bighorn Sheep Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Tag Fee (NR)", amount: "1,600.00", required: true },
  { stateCode: "AZ", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR General Hunting License", amount: "160.00", required: true },

  // --- Buffalo (Bison) ---
  { stateCode: "AZ", speciesSlug: "bison", residency: "resident", feeType: "application", feeName: "Buffalo Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "bison", residency: "resident", feeType: "bonus_point", feeName: "Buffalo Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "bison", residency: "resident", feeType: "tag_if_drawn", feeName: "Buffalo Tag Fee", amount: "1,285.00", required: true },
  { stateCode: "AZ", speciesSlug: "bison", residency: "resident", feeType: "license_prerequisite", feeName: "General Hunting License", amount: "37.00", required: true },
  { stateCode: "AZ", speciesSlug: "bison", residency: "nonresident", feeType: "application", feeName: "Buffalo Application Fee", amount: "13.00", required: true },
  { stateCode: "AZ", speciesSlug: "bison", residency: "nonresident", feeType: "bonus_point", feeName: "Buffalo Bonus Point", amount: "13.00", required: false },
  { stateCode: "AZ", speciesSlug: "bison", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Buffalo Tag Fee (NR)", amount: "6,285.00", required: true },
  { stateCode: "AZ", speciesSlug: "bison", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR General Hunting License", amount: "160.00", required: true },
];

// ---------------------------------------------------------------------------
// NEW MEXICO (NMDGF) — 2026 Fee Data
// ---------------------------------------------------------------------------
// Source: https://www.wildlife.state.nm.us
// NM has NO point system — pure random lottery.
// Application fee per species. Tag charged only on draw.
// Game-hunting license + Habitat Management stamp required.
// Oryx and ibex are special exotic species with separate draws.
// ---------------------------------------------------------------------------

const NM_FEES: FeeEntry[] = [
  // --- Elk ---
  { stateCode: "NM", speciesSlug: "elk", residency: "resident", feeType: "application", feeName: "Elk Application Fee", amount: "12.00", required: true, sourceUrl: "https://www.wildlife.state.nm.us" },
  { stateCode: "NM", speciesSlug: "elk", residency: "resident", feeType: "tag_if_drawn", feeName: "Elk License (if drawn)", amount: "56.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "NM", speciesSlug: "elk", residency: "resident", feeType: "license_prerequisite", feeName: "Game-Hunting License", amount: "15.00", required: true },
  { stateCode: "NM", speciesSlug: "elk", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },
  { stateCode: "NM", speciesSlug: "elk", residency: "nonresident", feeType: "application", feeName: "Elk Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "elk", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Elk License (if drawn, NR)", amount: "548.00", required: true },
  { stateCode: "NM", speciesSlug: "elk", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Game-Hunting License", amount: "65.00", required: true },
  { stateCode: "NM", speciesSlug: "elk", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },

  // --- Deer ---
  { stateCode: "NM", speciesSlug: "mule_deer", residency: "resident", feeType: "application", feeName: "Deer Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "mule_deer", residency: "resident", feeType: "tag_if_drawn", feeName: "Deer License (if drawn)", amount: "32.00", required: true },
  { stateCode: "NM", speciesSlug: "mule_deer", residency: "resident", feeType: "license_prerequisite", feeName: "Game-Hunting License", amount: "15.00", required: true },
  { stateCode: "NM", speciesSlug: "mule_deer", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },
  { stateCode: "NM", speciesSlug: "mule_deer", residency: "nonresident", feeType: "application", feeName: "Deer Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "mule_deer", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Deer License (if drawn, NR)", amount: "285.00", required: true },
  { stateCode: "NM", speciesSlug: "mule_deer", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Game-Hunting License", amount: "65.00", required: true },
  { stateCode: "NM", speciesSlug: "mule_deer", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },

  // --- Antelope ---
  { stateCode: "NM", speciesSlug: "pronghorn", residency: "resident", feeType: "application", feeName: "Antelope Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "pronghorn", residency: "resident", feeType: "tag_if_drawn", feeName: "Antelope License (if drawn)", amount: "41.00", required: true },
  { stateCode: "NM", speciesSlug: "pronghorn", residency: "resident", feeType: "license_prerequisite", feeName: "Game-Hunting License", amount: "15.00", required: true },
  { stateCode: "NM", speciesSlug: "pronghorn", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },
  { stateCode: "NM", speciesSlug: "pronghorn", residency: "nonresident", feeType: "application", feeName: "Antelope Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "pronghorn", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Antelope License (if drawn, NR)", amount: "285.00", required: true },
  { stateCode: "NM", speciesSlug: "pronghorn", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Game-Hunting License", amount: "65.00", required: true },
  { stateCode: "NM", speciesSlug: "pronghorn", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },

  // --- Oryx (exotic, special draw) ---
  { stateCode: "NM", speciesSlug: "oryx", residency: "resident", feeType: "application", feeName: "Oryx Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "oryx", residency: "resident", feeType: "tag_if_drawn", feeName: "Oryx License (if drawn)", amount: "160.00", required: true, notes: "WSMR hunts require additional military base access" },
  { stateCode: "NM", speciesSlug: "oryx", residency: "resident", feeType: "license_prerequisite", feeName: "Game-Hunting License", amount: "15.00", required: true },
  { stateCode: "NM", speciesSlug: "oryx", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },
  { stateCode: "NM", speciesSlug: "oryx", residency: "nonresident", feeType: "application", feeName: "Oryx Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "oryx", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Oryx License (if drawn, NR)", amount: "715.00", required: true },
  { stateCode: "NM", speciesSlug: "oryx", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Game-Hunting License", amount: "65.00", required: true },
  { stateCode: "NM", speciesSlug: "oryx", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },

  // --- Ibex (exotic, special draw) ---
  { stateCode: "NM", speciesSlug: "ibex", residency: "resident", feeType: "application", feeName: "Ibex Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "ibex", residency: "resident", feeType: "tag_if_drawn", feeName: "Ibex License (if drawn)", amount: "160.00", required: true, notes: "Florida Mountains hunts" },
  { stateCode: "NM", speciesSlug: "ibex", residency: "resident", feeType: "license_prerequisite", feeName: "Game-Hunting License", amount: "15.00", required: true },
  { stateCode: "NM", speciesSlug: "ibex", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },
  { stateCode: "NM", speciesSlug: "ibex", residency: "nonresident", feeType: "application", feeName: "Ibex Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "ibex", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Ibex License (if drawn, NR)", amount: "715.00", required: true },
  { stateCode: "NM", speciesSlug: "ibex", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Game-Hunting License", amount: "65.00", required: true },
  { stateCode: "NM", speciesSlug: "ibex", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },

  // --- Bighorn Sheep ---
  { stateCode: "NM", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "application", feeName: "Bighorn Sheep Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep License (if drawn)", amount: "285.00", required: true },
  { stateCode: "NM", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "license_prerequisite", feeName: "Game-Hunting License", amount: "15.00", required: true },
  { stateCode: "NM", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },
  { stateCode: "NM", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "application", feeName: "Bighorn Sheep Application Fee", amount: "12.00", required: true },
  { stateCode: "NM", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep License (if drawn, NR)", amount: "3,035.00", required: true },
  { stateCode: "NM", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Game-Hunting License", amount: "65.00", required: true },
  { stateCode: "NM", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "habitat_stamp", feeName: "Habitat Management & Access Validation", amount: "5.00", required: true },
];

// ---------------------------------------------------------------------------
// IDAHO (IDFG) — 2026 Fee Data
// ---------------------------------------------------------------------------
// Source: https://idfg.idaho.gov/hunt/fees
// ID uses controlled hunt applications. Application fee per species.
// Tag fee charged only upon successful draw. Second tag fee applies for NR.
// No state-specific stamp required for controlled hunt applications.
// ---------------------------------------------------------------------------

const ID_FEES: FeeEntry[] = [
  // --- Elk ---
  { stateCode: "ID", speciesSlug: "elk", residency: "resident", feeType: "application", feeName: "Elk Controlled Hunt Application Fee", amount: "16.75", required: true, sourceUrl: "https://idfg.idaho.gov" },
  { stateCode: "ID", speciesSlug: "elk", residency: "resident", feeType: "tag_if_drawn", feeName: "Elk Tag Fee", amount: "42.50", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "ID", speciesSlug: "elk", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "elk", residency: "nonresident", feeType: "application", feeName: "Elk Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "elk", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Elk Tag Fee (NR)", amount: "600.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "ID", speciesSlug: "elk", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },

  // --- Mule Deer ---
  { stateCode: "ID", speciesSlug: "mule_deer", residency: "resident", feeType: "application", feeName: "Deer Controlled Hunt Application Fee", amount: "16.75", required: true },
  { stateCode: "ID", speciesSlug: "mule_deer", residency: "resident", feeType: "tag_if_drawn", feeName: "Deer Tag Fee", amount: "30.75", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "ID", speciesSlug: "mule_deer", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "mule_deer", residency: "nonresident", feeType: "application", feeName: "Deer Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "mule_deer", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Deer Tag Fee (NR)", amount: "400.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "ID", speciesSlug: "mule_deer", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },

  // --- Whitetail ---
  { stateCode: "ID", speciesSlug: "whitetail", residency: "resident", feeType: "application", feeName: "Whitetail Controlled Hunt Application Fee", amount: "16.75", required: true },
  { stateCode: "ID", speciesSlug: "whitetail", residency: "resident", feeType: "tag_if_drawn", feeName: "Whitetail Tag Fee", amount: "30.75", required: true },
  { stateCode: "ID", speciesSlug: "whitetail", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "whitetail", residency: "nonresident", feeType: "application", feeName: "Whitetail Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "whitetail", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Whitetail Tag Fee (NR)", amount: "400.00", required: true },
  { stateCode: "ID", speciesSlug: "whitetail", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },

  // --- Pronghorn ---
  { stateCode: "ID", speciesSlug: "pronghorn", residency: "resident", feeType: "application", feeName: "Pronghorn Controlled Hunt Application Fee", amount: "16.75", required: true },
  { stateCode: "ID", speciesSlug: "pronghorn", residency: "resident", feeType: "tag_if_drawn", feeName: "Pronghorn Tag Fee", amount: "40.75", required: true },
  { stateCode: "ID", speciesSlug: "pronghorn", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "pronghorn", residency: "nonresident", feeType: "application", feeName: "Pronghorn Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "pronghorn", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Pronghorn Tag Fee (NR)", amount: "312.00", required: true },
  { stateCode: "ID", speciesSlug: "pronghorn", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },

  // --- Moose ---
  { stateCode: "ID", speciesSlug: "moose", residency: "resident", feeType: "application", feeName: "Moose Controlled Hunt Application Fee", amount: "16.75", required: true },
  { stateCode: "ID", speciesSlug: "moose", residency: "resident", feeType: "tag_if_drawn", feeName: "Moose Tag Fee", amount: "186.00", required: true },
  { stateCode: "ID", speciesSlug: "moose", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "moose", residency: "nonresident", feeType: "application", feeName: "Moose Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "moose", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Moose Tag Fee (NR)", amount: "2,101.00", required: true },
  { stateCode: "ID", speciesSlug: "moose", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },

  // --- Mountain Goat ---
  { stateCode: "ID", speciesSlug: "mountain_goat", residency: "resident", feeType: "application", feeName: "Mountain Goat Controlled Hunt Application Fee", amount: "16.75", required: true },
  { stateCode: "ID", speciesSlug: "mountain_goat", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Goat Tag Fee", amount: "186.00", required: true },
  { stateCode: "ID", speciesSlug: "mountain_goat", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "application", feeName: "Mountain Goat Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Goat Tag Fee (NR)", amount: "2,101.00", required: true },
  { stateCode: "ID", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },

  // --- Bighorn Sheep ---
  { stateCode: "ID", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "application", feeName: "Bighorn Sheep Controlled Hunt Application Fee", amount: "16.75", required: true },
  { stateCode: "ID", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Tag Fee", amount: "186.00", required: true },
  { stateCode: "ID", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "application", feeName: "Bighorn Sheep Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Tag Fee (NR)", amount: "2,101.00", required: true },
  { stateCode: "ID", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },

  // --- Black Bear ---
  { stateCode: "ID", speciesSlug: "black_bear", residency: "resident", feeType: "application", feeName: "Bear Controlled Hunt Application Fee", amount: "14.75", required: true },
  { stateCode: "ID", speciesSlug: "black_bear", residency: "resident", feeType: "tag_if_drawn", feeName: "Bear Tag Fee", amount: "22.00", required: true },
  { stateCode: "ID", speciesSlug: "black_bear", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "black_bear", residency: "nonresident", feeType: "application", feeName: "Bear Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "black_bear", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bear Tag Fee (NR)", amount: "265.00", required: true },
  { stateCode: "ID", speciesSlug: "black_bear", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },

  // --- Mountain Lion ---
  { stateCode: "ID", speciesSlug: "mountain_lion", residency: "resident", feeType: "application", feeName: "Mountain Lion Controlled Hunt Application Fee", amount: "14.75", required: true },
  { stateCode: "ID", speciesSlug: "mountain_lion", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Lion Tag Fee", amount: "22.00", required: true },
  { stateCode: "ID", speciesSlug: "mountain_lion", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "application", feeName: "Mountain Lion Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Lion Tag Fee (NR)", amount: "265.00", required: true },
  { stateCode: "ID", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },

  // --- Turkey ---
  { stateCode: "ID", speciesSlug: "turkey", residency: "resident", feeType: "application", feeName: "Turkey Controlled Hunt Application Fee", amount: "14.75", required: true },
  { stateCode: "ID", speciesSlug: "turkey", residency: "resident", feeType: "tag_if_drawn", feeName: "Turkey Tag Fee", amount: "20.75", required: true },
  { stateCode: "ID", speciesSlug: "turkey", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "25.75", required: true },
  { stateCode: "ID", speciesSlug: "turkey", residency: "nonresident", feeType: "application", feeName: "Turkey Controlled Hunt Application Fee", amount: "41.75", required: true },
  { stateCode: "ID", speciesSlug: "turkey", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Turkey Tag Fee (NR)", amount: "96.75", required: true },
  { stateCode: "ID", speciesSlug: "turkey", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "154.75", required: true },
];

// ---------------------------------------------------------------------------
// UTAH (UDWR) — 2026 Fee Data
// ---------------------------------------------------------------------------
// Source: https://wildlife.utah.gov/hunting-in-utah.html
// UT uses bonus points for limited entry and once-in-a-lifetime species.
// Application fee $10 per species. Bonus point purchase $10.
// Tag charged only upon successful draw. General season separate.
// Hunting license required before applying.
// ---------------------------------------------------------------------------

const UT_FEES: FeeEntry[] = [
  // --- Elk ---
  { stateCode: "UT", speciesSlug: "elk", residency: "resident", feeType: "application", feeName: "Elk Limited Entry Application Fee", amount: "10.00", required: true, sourceUrl: "https://wildlife.utah.gov" },
  { stateCode: "UT", speciesSlug: "elk", residency: "resident", feeType: "bonus_point", feeName: "Elk Bonus Point Fee", amount: "10.00", required: false, notes: "Optional; builds odds for future draws" },
  { stateCode: "UT", speciesSlug: "elk", residency: "resident", feeType: "tag_if_drawn", feeName: "Elk LE Permit Fee", amount: "50.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "UT", speciesSlug: "elk", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License (Hunting/Fishing)", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "elk", residency: "nonresident", feeType: "application", feeName: "Elk Limited Entry Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "elk", residency: "nonresident", feeType: "bonus_point", feeName: "Elk Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "elk", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Elk LE Permit Fee (NR)", amount: "1,500.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "UT", speciesSlug: "elk", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },

  // --- Mule Deer ---
  { stateCode: "UT", speciesSlug: "mule_deer", residency: "resident", feeType: "application", feeName: "Deer Limited Entry Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "mule_deer", residency: "resident", feeType: "bonus_point", feeName: "Deer Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "mule_deer", residency: "resident", feeType: "tag_if_drawn", feeName: "Deer LE Permit Fee", amount: "40.00", required: true },
  { stateCode: "UT", speciesSlug: "mule_deer", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "mule_deer", residency: "nonresident", feeType: "application", feeName: "Deer Limited Entry Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "mule_deer", residency: "nonresident", feeType: "bonus_point", feeName: "Deer Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "mule_deer", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Deer LE Permit Fee (NR)", amount: "518.00", required: true },
  { stateCode: "UT", speciesSlug: "mule_deer", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },

  // --- Pronghorn ---
  { stateCode: "UT", speciesSlug: "pronghorn", residency: "resident", feeType: "application", feeName: "Pronghorn Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "pronghorn", residency: "resident", feeType: "bonus_point", feeName: "Pronghorn Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "pronghorn", residency: "resident", feeType: "tag_if_drawn", feeName: "Pronghorn Permit Fee", amount: "50.00", required: true },
  { stateCode: "UT", speciesSlug: "pronghorn", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "pronghorn", residency: "nonresident", feeType: "application", feeName: "Pronghorn Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "pronghorn", residency: "nonresident", feeType: "bonus_point", feeName: "Pronghorn Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "pronghorn", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Pronghorn Permit Fee (NR)", amount: "358.00", required: true },
  { stateCode: "UT", speciesSlug: "pronghorn", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },

  // --- Moose (Once-in-a-Lifetime) ---
  { stateCode: "UT", speciesSlug: "moose", residency: "resident", feeType: "application", feeName: "Moose OIAL Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "moose", residency: "resident", feeType: "bonus_point", feeName: "Moose Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "moose", residency: "resident", feeType: "tag_if_drawn", feeName: "Moose OIAL Permit Fee", amount: "408.00", required: true },
  { stateCode: "UT", speciesSlug: "moose", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "moose", residency: "nonresident", feeType: "application", feeName: "Moose OIAL Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "moose", residency: "nonresident", feeType: "bonus_point", feeName: "Moose Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "moose", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Moose OIAL Permit Fee (NR)", amount: "1,518.00", required: true },
  { stateCode: "UT", speciesSlug: "moose", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },

  // --- Mountain Goat (Once-in-a-Lifetime) ---
  { stateCode: "UT", speciesSlug: "mountain_goat", residency: "resident", feeType: "application", feeName: "Mountain Goat OIAL Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_goat", residency: "resident", feeType: "bonus_point", feeName: "Mountain Goat Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "mountain_goat", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Goat OIAL Permit Fee", amount: "408.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_goat", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "application", feeName: "Mountain Goat OIAL Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "bonus_point", feeName: "Mountain Goat Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Goat OIAL Permit Fee (NR)", amount: "1,518.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },

  // --- Bighorn Sheep (Once-in-a-Lifetime) ---
  { stateCode: "UT", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "application", feeName: "Bighorn Sheep OIAL Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "bonus_point", feeName: "Bighorn Sheep Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep OIAL Permit Fee", amount: "408.00", required: true },
  { stateCode: "UT", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "application", feeName: "Bighorn Sheep OIAL Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "bonus_point", feeName: "Bighorn Sheep Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep OIAL Permit Fee (NR)", amount: "1,518.00", required: true },
  { stateCode: "UT", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },

  // --- Black Bear ---
  { stateCode: "UT", speciesSlug: "black_bear", residency: "resident", feeType: "application", feeName: "Bear Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "black_bear", residency: "resident", feeType: "tag_if_drawn", feeName: "Bear Permit Fee", amount: "83.00", required: true },
  { stateCode: "UT", speciesSlug: "black_bear", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "black_bear", residency: "nonresident", feeType: "application", feeName: "Bear Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "black_bear", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bear Permit Fee (NR)", amount: "283.00", required: true },
  { stateCode: "UT", speciesSlug: "black_bear", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },

  // --- Bison (Once-in-a-Lifetime) ---
  { stateCode: "UT", speciesSlug: "bison", residency: "resident", feeType: "application", feeName: "Bison OIAL Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "bison", residency: "resident", feeType: "bonus_point", feeName: "Bison Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "bison", residency: "resident", feeType: "tag_if_drawn", feeName: "Bison OIAL Permit Fee", amount: "408.00", required: true },
  { stateCode: "UT", speciesSlug: "bison", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "bison", residency: "nonresident", feeType: "application", feeName: "Bison OIAL Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "bison", residency: "nonresident", feeType: "bonus_point", feeName: "Bison Bonus Point Fee", amount: "10.00", required: false },
  { stateCode: "UT", speciesSlug: "bison", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bison OIAL Permit Fee (NR)", amount: "1,518.00", required: true },
  { stateCode: "UT", speciesSlug: "bison", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },

  // --- Turkey ---
  { stateCode: "UT", speciesSlug: "turkey", residency: "resident", feeType: "application", feeName: "Turkey Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "turkey", residency: "resident", feeType: "tag_if_drawn", feeName: "Turkey Permit Fee", amount: "30.00", required: true },
  { stateCode: "UT", speciesSlug: "turkey", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "turkey", residency: "nonresident", feeType: "application", feeName: "Turkey Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "turkey", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Turkey Permit Fee (NR)", amount: "80.00", required: true },
  { stateCode: "UT", speciesSlug: "turkey", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },

  // --- Mountain Lion ---
  { stateCode: "UT", speciesSlug: "mountain_lion", residency: "resident", feeType: "application", feeName: "Mountain Lion Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_lion", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Lion Permit Fee", amount: "58.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_lion", residency: "resident", feeType: "license_prerequisite", feeName: "Combination License", amount: "34.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "application", feeName: "Mountain Lion Application Fee", amount: "10.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Lion Permit Fee (NR)", amount: "258.00", required: true },
  { stateCode: "UT", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "65.00", required: true },
];

// ---------------------------------------------------------------------------
// NEVADA (NDOW) — 2026 Fee Data
// ---------------------------------------------------------------------------
// Source: https://www.ndow.org/hunt/
// NV uses bonus points. Application fee $15 for all. Separate bonus point
// purchase available. Tag charged only upon successful draw.
// Hunting license required before applying.
// ---------------------------------------------------------------------------

const NV_FEES: FeeEntry[] = [
  // --- Elk ---
  { stateCode: "NV", speciesSlug: "elk", residency: "resident", feeType: "application", feeName: "Elk Tag Application Fee", amount: "15.00", required: true, sourceUrl: "https://www.ndow.org" },
  { stateCode: "NV", speciesSlug: "elk", residency: "resident", feeType: "bonus_point", feeName: "Elk Bonus Point Fee", amount: "15.00", required: false, notes: "Optional; builds odds for future draws" },
  { stateCode: "NV", speciesSlug: "elk", residency: "resident", feeType: "tag_if_drawn", feeName: "Elk Tag Fee", amount: "120.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "NV", speciesSlug: "elk", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "NV", speciesSlug: "elk", residency: "nonresident", feeType: "application", feeName: "Elk Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "elk", residency: "nonresident", feeType: "bonus_point", feeName: "Elk Bonus Point Fee", amount: "142.00", required: false, notes: "NR bonus point includes species surcharge" },
  { stateCode: "NV", speciesSlug: "elk", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Elk Tag Fee (NR)", amount: "1,200.00", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "NV", speciesSlug: "elk", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "142.00", required: true },

  // --- Mule Deer ---
  { stateCode: "NV", speciesSlug: "mule_deer", residency: "resident", feeType: "application", feeName: "Deer Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "mule_deer", residency: "resident", feeType: "bonus_point", feeName: "Deer Bonus Point Fee", amount: "15.00", required: false },
  { stateCode: "NV", speciesSlug: "mule_deer", residency: "resident", feeType: "tag_if_drawn", feeName: "Deer Tag Fee", amount: "30.00", required: true },
  { stateCode: "NV", speciesSlug: "mule_deer", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "NV", speciesSlug: "mule_deer", residency: "nonresident", feeType: "application", feeName: "Deer Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "mule_deer", residency: "nonresident", feeType: "bonus_point", feeName: "Deer Bonus Point Fee", amount: "142.00", required: false },
  { stateCode: "NV", speciesSlug: "mule_deer", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Deer Tag Fee (NR)", amount: "462.00", required: true },
  { stateCode: "NV", speciesSlug: "mule_deer", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "142.00", required: true },

  // --- Pronghorn ---
  { stateCode: "NV", speciesSlug: "pronghorn", residency: "resident", feeType: "application", feeName: "Antelope Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "pronghorn", residency: "resident", feeType: "bonus_point", feeName: "Antelope Bonus Point Fee", amount: "15.00", required: false },
  { stateCode: "NV", speciesSlug: "pronghorn", residency: "resident", feeType: "tag_if_drawn", feeName: "Antelope Tag Fee", amount: "60.00", required: true },
  { stateCode: "NV", speciesSlug: "pronghorn", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "NV", speciesSlug: "pronghorn", residency: "nonresident", feeType: "application", feeName: "Antelope Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "pronghorn", residency: "nonresident", feeType: "bonus_point", feeName: "Antelope Bonus Point Fee", amount: "142.00", required: false },
  { stateCode: "NV", speciesSlug: "pronghorn", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Antelope Tag Fee (NR)", amount: "375.00", required: true },
  { stateCode: "NV", speciesSlug: "pronghorn", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "142.00", required: true },

  // --- Bighorn Sheep ---
  { stateCode: "NV", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "application", feeName: "Bighorn Sheep Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "bonus_point", feeName: "Bighorn Sheep Bonus Point Fee", amount: "15.00", required: false },
  { stateCode: "NV", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Tag Fee", amount: "120.00", required: true },
  { stateCode: "NV", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "NV", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "application", feeName: "Bighorn Sheep Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "bonus_point", feeName: "Bighorn Sheep Bonus Point Fee", amount: "142.00", required: false },
  { stateCode: "NV", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Tag Fee (NR)", amount: "1,500.00", required: true },
  { stateCode: "NV", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "142.00", required: true },

  // --- Mountain Goat ---
  { stateCode: "NV", speciesSlug: "mountain_goat", residency: "resident", feeType: "application", feeName: "Mountain Goat Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_goat", residency: "resident", feeType: "bonus_point", feeName: "Mountain Goat Bonus Point Fee", amount: "15.00", required: false },
  { stateCode: "NV", speciesSlug: "mountain_goat", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Goat Tag Fee", amount: "120.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_goat", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "application", feeName: "Mountain Goat Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "bonus_point", feeName: "Mountain Goat Bonus Point Fee", amount: "142.00", required: false },
  { stateCode: "NV", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Goat Tag Fee (NR)", amount: "1,500.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "142.00", required: true },

  // --- Mountain Lion ---
  { stateCode: "NV", speciesSlug: "mountain_lion", residency: "resident", feeType: "application", feeName: "Mountain Lion Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_lion", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Lion Tag Fee", amount: "30.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_lion", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "application", feeName: "Mountain Lion Tag Application Fee", amount: "15.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Lion Tag Fee (NR)", amount: "275.00", required: true },
  { stateCode: "NV", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "142.00", required: true },
];

// ---------------------------------------------------------------------------
// OREGON (ODFW) — 2026 Fee Data
// ---------------------------------------------------------------------------
// Source: https://myodfw.com/articles/hunting-license-and-tag-fees
// OR uses preference points for controlled hunts. Application fee $8.
// Preference point purchase $8. Tag charged only upon successful draw.
// Hunting license required. Habitat stamp not separate in OR.
// ---------------------------------------------------------------------------

const OR_FEES: FeeEntry[] = [
  // --- Elk ---
  { stateCode: "OR", speciesSlug: "elk", residency: "resident", feeType: "application", feeName: "Elk Controlled Hunt Application Fee", amount: "8.00", required: true, sourceUrl: "https://myodfw.com" },
  { stateCode: "OR", speciesSlug: "elk", residency: "resident", feeType: "preference_point", feeName: "Elk Preference Point Fee", amount: "8.00", required: false, notes: "Optional; purchased if not applying this year" },
  { stateCode: "OR", speciesSlug: "elk", residency: "resident", feeType: "tag_if_drawn", feeName: "Elk Tag Fee", amount: "43.50", required: true, notes: "Charged only upon successful draw" },
  { stateCode: "OR", speciesSlug: "elk", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "OR", speciesSlug: "elk", residency: "nonresident", feeType: "application", feeName: "Elk Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "elk", residency: "nonresident", feeType: "preference_point", feeName: "Elk Preference Point Fee", amount: "8.00", required: false },
  { stateCode: "OR", speciesSlug: "elk", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Elk Tag Fee (NR)", amount: "577.00", required: true },
  { stateCode: "OR", speciesSlug: "elk", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "167.50", required: true },

  // --- Mule Deer ---
  { stateCode: "OR", speciesSlug: "mule_deer", residency: "resident", feeType: "application", feeName: "Deer Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "mule_deer", residency: "resident", feeType: "preference_point", feeName: "Deer Preference Point Fee", amount: "8.00", required: false },
  { stateCode: "OR", speciesSlug: "mule_deer", residency: "resident", feeType: "tag_if_drawn", feeName: "Deer Tag Fee", amount: "32.00", required: true },
  { stateCode: "OR", speciesSlug: "mule_deer", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "OR", speciesSlug: "mule_deer", residency: "nonresident", feeType: "application", feeName: "Deer Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "mule_deer", residency: "nonresident", feeType: "preference_point", feeName: "Deer Preference Point Fee", amount: "8.00", required: false },
  { stateCode: "OR", speciesSlug: "mule_deer", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Deer Tag Fee (NR)", amount: "362.00", required: true },
  { stateCode: "OR", speciesSlug: "mule_deer", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "167.50", required: true },

  // --- Pronghorn ---
  { stateCode: "OR", speciesSlug: "pronghorn", residency: "resident", feeType: "application", feeName: "Antelope Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "pronghorn", residency: "resident", feeType: "preference_point", feeName: "Antelope Preference Point Fee", amount: "8.00", required: false },
  { stateCode: "OR", speciesSlug: "pronghorn", residency: "resident", feeType: "tag_if_drawn", feeName: "Antelope Tag Fee", amount: "40.50", required: true },
  { stateCode: "OR", speciesSlug: "pronghorn", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "OR", speciesSlug: "pronghorn", residency: "nonresident", feeType: "application", feeName: "Antelope Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "pronghorn", residency: "nonresident", feeType: "preference_point", feeName: "Antelope Preference Point Fee", amount: "8.00", required: false },
  { stateCode: "OR", speciesSlug: "pronghorn", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Antelope Tag Fee (NR)", amount: "362.00", required: true },
  { stateCode: "OR", speciesSlug: "pronghorn", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "167.50", required: true },

  // --- Bighorn Sheep ---
  { stateCode: "OR", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "application", feeName: "Bighorn Sheep Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "preference_point", feeName: "Bighorn Sheep Preference Point Fee", amount: "8.00", required: false },
  { stateCode: "OR", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Tag Fee", amount: "160.50", required: true },
  { stateCode: "OR", speciesSlug: "bighorn_sheep", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "OR", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "application", feeName: "Bighorn Sheep Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "preference_point", feeName: "Bighorn Sheep Preference Point Fee", amount: "8.00", required: false },
  { stateCode: "OR", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bighorn Sheep Tag Fee (NR)", amount: "1,672.00", required: true },
  { stateCode: "OR", speciesSlug: "bighorn_sheep", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "167.50", required: true },

  // --- Mountain Goat ---
  { stateCode: "OR", speciesSlug: "mountain_goat", residency: "resident", feeType: "application", feeName: "Mountain Goat Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "mountain_goat", residency: "resident", feeType: "preference_point", feeName: "Mountain Goat Preference Point Fee", amount: "8.00", required: false },
  { stateCode: "OR", speciesSlug: "mountain_goat", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Goat Tag Fee", amount: "160.50", required: true },
  { stateCode: "OR", speciesSlug: "mountain_goat", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "OR", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "application", feeName: "Mountain Goat Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "preference_point", feeName: "Mountain Goat Preference Point Fee", amount: "8.00", required: false },
  { stateCode: "OR", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Goat Tag Fee (NR)", amount: "1,672.00", required: true },
  { stateCode: "OR", speciesSlug: "mountain_goat", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "167.50", required: true },

  // --- Black Bear ---
  { stateCode: "OR", speciesSlug: "black_bear", residency: "resident", feeType: "application", feeName: "Bear Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "black_bear", residency: "resident", feeType: "tag_if_drawn", feeName: "Bear Tag Fee", amount: "24.00", required: true },
  { stateCode: "OR", speciesSlug: "black_bear", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "OR", speciesSlug: "black_bear", residency: "nonresident", feeType: "application", feeName: "Bear Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "black_bear", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Bear Tag Fee (NR)", amount: "337.50", required: true },
  { stateCode: "OR", speciesSlug: "black_bear", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "167.50", required: true },

  // --- Mountain Lion ---
  { stateCode: "OR", speciesSlug: "mountain_lion", residency: "resident", feeType: "application", feeName: "Mountain Lion Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "mountain_lion", residency: "resident", feeType: "tag_if_drawn", feeName: "Mountain Lion Tag Fee", amount: "24.00", required: true },
  { stateCode: "OR", speciesSlug: "mountain_lion", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "OR", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "application", feeName: "Mountain Lion Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Mountain Lion Tag Fee (NR)", amount: "337.50", required: true },
  { stateCode: "OR", speciesSlug: "mountain_lion", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "167.50", required: true },

  // --- Turkey ---
  { stateCode: "OR", speciesSlug: "turkey", residency: "resident", feeType: "application", feeName: "Turkey Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "turkey", residency: "resident", feeType: "tag_if_drawn", feeName: "Turkey Tag Fee", amount: "23.00", required: true },
  { stateCode: "OR", speciesSlug: "turkey", residency: "resident", feeType: "license_prerequisite", feeName: "Hunting License", amount: "33.00", required: true },
  { stateCode: "OR", speciesSlug: "turkey", residency: "nonresident", feeType: "application", feeName: "Turkey Controlled Hunt Application Fee", amount: "8.00", required: true },
  { stateCode: "OR", speciesSlug: "turkey", residency: "nonresident", feeType: "tag_if_drawn", feeName: "Turkey Tag Fee (NR)", amount: "85.00", required: true },
  { stateCode: "OR", speciesSlug: "turkey", residency: "nonresident", feeType: "license_prerequisite", feeName: "NR Hunting License", amount: "167.50", required: true },
];

// =============================================================================
// Seed function
// =============================================================================

export async function seedFeeSchedules() {
  console.log("Seeding fee schedules...");

  // 1. Build state lookup
  const allStates = await db.select().from(states);
  const stateMap = new Map<string, string>();
  for (const s of allStates) {
    stateMap.set(s.code, s.id);
  }

  // 2. Build species lookup
  const allSpecies = await db.select().from(species);
  const speciesMap = new Map<string, string>();
  for (const sp of allSpecies) {
    speciesMap.set(sp.slug, sp.id);
  }

  // 3. Combine all fee entries
  const allFees: FeeEntry[] = [
    ...CO_FEES,
    ...WY_FEES,
    ...MT_FEES,
    ...AZ_FEES,
    ...NM_FEES,
    ...ID_FEES,
    ...UT_FEES,
    ...NV_FEES,
    ...OR_FEES,
  ];

  // 4. Resolve IDs and build insert values
  const values = [];
  const skipped: string[] = [];

  for (const fee of allFees) {
    const stateId = stateMap.get(fee.stateCode);
    const speciesId = speciesMap.get(fee.speciesSlug);

    if (!stateId) {
      skipped.push(`State not found: ${fee.stateCode}`);
      continue;
    }
    if (!speciesId) {
      skipped.push(`Species not found: ${fee.speciesSlug} (${fee.stateCode})`);
      continue;
    }

    // Clean amount string (remove commas)
    const cleanAmount = fee.amount.replace(/,/g, "");

    values.push({
      stateId,
      speciesId,
      year: 2026,
      residency: fee.residency,
      feeType: fee.feeType,
      feeName: fee.feeName,
      amount: cleanAmount,
      required: fee.required,
      notes: fee.notes ?? null,
      sourceUrl: fee.sourceUrl ?? null,
      metadata: { source: "manual", chargedUpfront: fee.feeType !== "tag_if_drawn" },
    });
  }

  // 5. Insert in batches (Postgres has parameter limits)
  const BATCH_SIZE = 50;
  let insertedCount = 0;

  for (let i = 0; i < values.length; i += BATCH_SIZE) {
    const batch = values.slice(i, i + BATCH_SIZE);
    const result = await db
      .insert(stateFeeSchedules)
      .values(batch)
      .onConflictDoNothing()
      .returning();
    insertedCount += result.length;
  }

  if (skipped.length > 0) {
    console.log(`  -> Skipped ${skipped.length} entries:`);
    const uniqueSkips = [...new Set(skipped)];
    for (const s of uniqueSkips) {
      console.log(`     - ${s}`);
    }
  }

  console.log(
    `  -> ${insertedCount} fee schedule entries inserted (${values.length} resolved from ${allFees.length} total)`
  );
}
