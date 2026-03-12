// =============================================================================
// HuntLogic — State Data Normalizer
// =============================================================================
// Normalizes data across different state formats into HuntLogic's canonical
// schema. Maps state-specific field names, unit codes, species names, weapon
// types, and resident types to our standard columns.
// =============================================================================

import type {
  ParsedDrawOdds,
  ParsedHarvestStats,
  ParsedSeason,
  NormalizedData,
} from "../types";

// ---------------------------------------------------------------------------
// Species Name Normalization
// State agencies use many names for the same species
// ---------------------------------------------------------------------------

const SPECIES_ALIASES: Record<string, string> = {
  // Elk
  elk: "elk",
  "bull elk": "elk",
  "cow elk": "elk",
  "rocky mountain elk": "elk",
  wapiti: "elk",

  // Mule Deer
  "mule deer": "mule_deer",
  muley: "mule_deer",
  "md": "mule_deer",
  "mule deer buck": "mule_deer",
  "mule deer doe": "mule_deer",

  // Whitetail
  "white-tailed deer": "whitetail",
  "whitetail deer": "whitetail",
  "white-tail deer": "whitetail",
  whitetail: "whitetail",
  "white-tail": "whitetail",
  "wt": "whitetail",
  "wtd": "whitetail",

  // Pronghorn
  pronghorn: "pronghorn",
  antelope: "pronghorn",
  "pronghorn antelope": "pronghorn",

  // Moose
  moose: "moose",
  "shiras moose": "moose",
  "bull moose": "moose",

  // Bighorn Sheep
  "bighorn sheep": "bighorn_sheep",
  bighorn: "bighorn_sheep",
  "desert bighorn": "bighorn_sheep",
  "rocky mountain bighorn": "bighorn_sheep",
  "california bighorn": "bighorn_sheep",
  "desert sheep": "bighorn_sheep",
  "mountain sheep": "bighorn_sheep",

  // Mountain Goat
  "mountain goat": "mountain_goat",
  goat: "mountain_goat",
  "rocky mountain goat": "mountain_goat",

  // Black Bear
  "black bear": "black_bear",
  bear: "black_bear",

  // Turkey
  turkey: "turkey",
  "wild turkey": "turkey",
  "merriam's turkey": "turkey",
  "rio grande turkey": "turkey",
  "eastern turkey": "turkey",

  // Caribou
  caribou: "caribou",

  // Bison
  bison: "bison",
  buffalo: "bison",
  "american bison": "bison",

  // Javelina
  javelina: "javelina",
  peccary: "javelina",
  "collared peccary": "javelina",

  // Mountain Lion
  "mountain lion": "mountain_lion",
  cougar: "mountain_lion",
  puma: "mountain_lion",
  panther: "mountain_lion",
};

// ---------------------------------------------------------------------------
// Weapon Type Normalization
// ---------------------------------------------------------------------------

const WEAPON_ALIASES: Record<string, string> = {
  archery: "archery",
  bow: "archery",
  bowhunting: "archery",
  "bow hunting": "archery",
  compound: "archery",
  crossbow: "archery",

  rifle: "rifle",
  "general rifle": "rifle",
  "any legal weapon": "rifle",
  "any weapon": "rifle",
  "any legal firearm": "rifle",
  centerfire: "rifle",

  muzzleloader: "muzzleloader",
  "muzzle loader": "muzzleloader",
  "muzz": "muzzleloader",
  "muzzle-loader": "muzzleloader",
  "primitive weapon": "muzzleloader",
  "primitive weapons": "muzzleloader",

  shotgun: "shotgun",
  "shotgun only": "shotgun",

  handgun: "handgun",
  pistol: "handgun",
};

// ---------------------------------------------------------------------------
// Resident Type Normalization
// ---------------------------------------------------------------------------

const RESIDENT_ALIASES: Record<string, string> = {
  resident: "resident",
  res: "resident",
  r: "resident",
  "in-state": "resident",

  nonresident: "nonresident",
  "non-resident": "nonresident",
  "non resident": "nonresident",
  nr: "nonresident",
  n: "nonresident",
  "out-of-state": "nonresident",
  "out of state": "nonresident",
};

// ---------------------------------------------------------------------------
// State Normalizer Class
// ---------------------------------------------------------------------------

export class StateNormalizer {
  /**
   * Normalize species name to our canonical slug
   */
  normalizeSpecies(raw: string): string {
    const key = raw.toLowerCase().trim();
    return SPECIES_ALIASES[key] || key.replace(/\s+/g, "_");
  }

  /**
   * Normalize weapon type to our canonical value
   */
  normalizeWeaponType(raw: string | undefined): string | undefined {
    if (!raw) return undefined;
    const key = raw.toLowerCase().trim();
    return WEAPON_ALIASES[key] || key;
  }

  /**
   * Normalize resident type
   */
  normalizeResidentType(raw: string): string {
    const key = raw.toLowerCase().trim();
    return RESIDENT_ALIASES[key] || key;
  }

  /**
   * Normalize unit code — strip leading zeros, standardize separators
   */
  normalizeUnitCode(raw: string, stateCode: string): string {
    let code = raw.trim().toUpperCase();

    // Remove common prefixes
    code = code.replace(/^(UNIT|AREA|ZONE|GMU|WMA)\s*/i, "");

    // State-specific normalization
    switch (stateCode.toUpperCase()) {
      case "CO":
        // Colorado uses pure numbers: "061" → "61"
        if (/^\d+$/.test(code)) {
          code = parseInt(code, 10).toString();
        }
        break;
      case "AZ":
        // Arizona uses "1", "6A", "12AW" etc.
        code = code.replace(/^0+/, "") || "0";
        break;
      case "WY":
        // Wyoming uses numbers "1", "2", "100" etc.
        if (/^\d+$/.test(code)) {
          code = parseInt(code, 10).toString();
        }
        break;
      default:
        // Generic: strip leading zeros from pure numbers
        if (/^\d+$/.test(code)) {
          code = parseInt(code, 10).toString();
        }
        break;
    }

    return code;
  }

  // -------------------------------------------------------------------------
  // Normalize draw odds records
  // -------------------------------------------------------------------------

  normalizeDrawOdds(
    records: ParsedDrawOdds[],
    stateCode: string,
    sourceId: string
  ): NormalizedData {
    const normalized = records.map((record) => ({
      year: record.year,
      unitCode: this.normalizeUnitCode(record.unitCode, stateCode),
      speciesSlug: this.normalizeSpecies(record.species),
      residentType: this.normalizeResidentType(record.residentType),
      weaponType: this.normalizeWeaponType(record.weaponType),
      choiceRank: record.choiceRank,
      totalApplicants: record.totalApplicants,
      totalTags: record.totalTags,
      minPointsDrawn: record.minPointsDrawn,
      maxPointsDrawn: record.maxPointsDrawn,
      avgPointsDrawn: record.avgPointsDrawn,
      drawRate: record.drawRate,
      rawData: record.rawRow,
      sourceId,
    }));

    return {
      table: "draw_odds",
      records: normalized,
      stateCode: stateCode.toUpperCase(),
      sourceId,
      year: records[0]?.year,
    };
  }

  // -------------------------------------------------------------------------
  // Normalize harvest stats records
  // -------------------------------------------------------------------------

  normalizeHarvestStats(
    records: ParsedHarvestStats[],
    stateCode: string,
    sourceId: string
  ): NormalizedData {
    const normalized = records.map((record) => ({
      year: record.year,
      unitCode: this.normalizeUnitCode(record.unitCode, stateCode),
      speciesSlug: this.normalizeSpecies(record.species),
      weaponType: this.normalizeWeaponType(record.weaponType),
      totalHunters: record.totalHunters,
      totalHarvest: record.totalHarvest,
      successRate: record.successRate,
      avgDaysHunted: record.avgDaysHunted,
      trophyMetrics: record.trophyMetrics,
      rawData: record.rawRow,
      sourceId,
    }));

    return {
      table: "harvest_stats",
      records: normalized,
      stateCode: stateCode.toUpperCase(),
      sourceId,
      year: records[0]?.year,
    };
  }

  // -------------------------------------------------------------------------
  // Normalize season records
  // -------------------------------------------------------------------------

  normalizeSeasons(
    records: ParsedSeason[],
    stateCode: string,
    sourceId: string
  ): NormalizedData {
    const normalized = records.map((record) => ({
      year: record.year,
      unitCode: record.unitCode
        ? this.normalizeUnitCode(record.unitCode, stateCode)
        : undefined,
      speciesSlug: this.normalizeSpecies(record.species),
      seasonName: record.seasonName,
      weaponType: this.normalizeWeaponType(record.weaponType),
      startDate: record.startDate,
      endDate: record.endDate,
      tagType: record.tagType,
      quota: record.quota,
      rawData: record.rawRow,
      sourceId,
    }));

    return {
      table: "seasons",
      records: normalized,
      stateCode: stateCode.toUpperCase(),
      sourceId,
      year: records[0]?.year,
    };
  }
}
