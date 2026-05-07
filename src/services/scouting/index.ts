// =============================================================================
// Scouting & Prep Service — Generate prep plans for hunt recommendations
// =============================================================================

import { db } from "@/lib/db";
import { recommendations, states, species, huntUnits } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import {
  loadChecklistTemplate,
  getGearChecklistKey,
  getTrainingPlanKey,
  getTimelineKey,
} from "./checklists";

const LOG_PREFIX = "[scouting]";

// =============================================================================
// Types
// =============================================================================

export interface PrepPlan {
  recommendation: {
    id: string;
    stateCode: string;
    stateName: string;
    speciesSlug: string;
    speciesName: string;
    unitCode?: string;
    terrainClass?: string;
    elevationMax?: number;
    weaponType?: string;
  };
  sections: PrepSection[];
  totalItems: number;
}

export interface PrepSection {
  id: string;
  title: string;
  type: "gear" | "physical" | "scouting" | "travel" | "licenses";
  items: PrepItem[];
}

export interface PrepItem {
  id: string;
  label: string;
  category: string;
  required: boolean;
  notes?: string;
}

// =============================================================================
// generatePrepPlan
// =============================================================================

export async function generatePrepPlan(
  recommendationId: string,
  userId: string
): Promise<PrepPlan | null> {
  console.log(
    `${LOG_PREFIX} Generating prep plan for recommendation ${recommendationId}`
  );

  // Fetch recommendation with full context
  const rows = await db
    .select({
      id: recommendations.id,
      stateCode: states.code,
      stateName: states.name,
      speciesSlug: species.slug,
      speciesName: species.commonName,
      unitCode: huntUnits.unitCode,
      terrainClass: huntUnits.terrainClass,
      elevationMax: huntUnits.elevationMax,
      costEstimate: recommendations.costEstimate,
    })
    .from(recommendations)
    .innerJoin(states, eq(recommendations.stateId, states.id))
    .innerJoin(species, eq(recommendations.speciesId, species.id))
    .leftJoin(huntUnits, eq(recommendations.huntUnitId, huntUnits.id))
    .where(
      and(
        eq(recommendations.id, recommendationId),
        eq(recommendations.userId, userId)
      )
    )
    .limit(1);

  const rec = rows[0];
  if (!rec) {
    console.warn(`${LOG_PREFIX} Recommendation not found: ${recommendationId}`);
    return null;
  }

  const costData = rec.costEstimate as Record<string, unknown> | null;
  const weaponType =
    (costData?.weaponType as string) ?? "rifle";

  // Build sections
  const sections: PrepSection[] = [];

  // 1. Gear checklist
  const gearKey = getGearChecklistKey(weaponType, rec.terrainClass ?? undefined);
  const gearTemplate = await loadChecklistTemplate(gearKey);
  if (gearTemplate) {
    sections.push({
      id: "gear",
      title: "Gear Checklist",
      type: "gear",
      items: gearTemplate.items,
    });
  } else {
    sections.push({
      id: "gear",
      title: "Gear Checklist",
      type: "gear",
      items: getDefaultGearItems(weaponType),
    });
  }

  // 2. Physical prep
  const trainingKey = getTrainingPlanKey(rec.terrainClass ?? undefined);
  const trainingTemplate = await loadChecklistTemplate(trainingKey);
  if (trainingTemplate) {
    sections.push({
      id: "physical",
      title: "Physical Prep",
      type: "physical",
      items: trainingTemplate.items,
    });
  } else {
    sections.push({
      id: "physical",
      title: "Physical Prep",
      type: "physical",
      items: getDefaultPhysicalItems(rec.terrainClass ?? undefined),
    });
  }

  // 3. Scouting timeline
  const timelineKey = getTimelineKey(rec.speciesSlug);
  const timelineTemplate = await loadChecklistTemplate(timelineKey);
  if (timelineTemplate) {
    sections.push({
      id: "scouting",
      title: "Scouting Timeline",
      type: "scouting",
      items: timelineTemplate.items,
    });
  } else {
    sections.push({
      id: "scouting",
      title: "Scouting Timeline",
      type: "scouting",
      items: getDefaultScoutingItems(),
    });
  }

  // 4. Travel prep
  sections.push({
    id: "travel",
    title: "Travel Prep",
    type: "travel",
    items: getTravelItems(rec.stateCode),
  });

  // 5. Licenses & tags
  sections.push({
    id: "licenses",
    title: "Licenses & Tags",
    type: "licenses",
    items: getLicenseItems(rec.stateCode, rec.speciesSlug),
  });

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);

  return {
    recommendation: {
      id: rec.id,
      stateCode: rec.stateCode,
      stateName: rec.stateName,
      speciesSlug: rec.speciesSlug,
      speciesName: rec.speciesName,
      unitCode: rec.unitCode ?? undefined,
      terrainClass: rec.terrainClass ?? undefined,
      elevationMax: rec.elevationMax ?? undefined,
      weaponType,
    },
    sections,
    totalItems,
  };
}

// =============================================================================
// Default fallback items (when templates not in DB)
// =============================================================================

function getDefaultGearItems(weaponType: string): PrepItem[] {
  const baseItems: PrepItem[] = [
    { id: "g1", label: "Optics (binoculars + spotting scope)", category: "optics", required: true },
    { id: "g2", label: "Rangefinder", category: "optics", required: true },
    { id: "g3", label: "GPS/navigation device", category: "navigation", required: true },
    { id: "g4", label: "Headlamp with extra batteries", category: "essentials", required: true },
    { id: "g5", label: "First aid kit", category: "safety", required: true },
    { id: "g6", label: "Water purification", category: "hydration", required: true },
    { id: "g7", label: "Game bags", category: "processing", required: true },
    { id: "g8", label: "Knives (skinning + caping)", category: "processing", required: true },
    { id: "g9", label: "Pack frame or game cart", category: "packing", required: false },
    { id: "g10", label: "Rain gear", category: "clothing", required: true },
    { id: "g11", label: "Layering system (base/mid/outer)", category: "clothing", required: true },
    { id: "g12", label: "Quality boots (broken in)", category: "clothing", required: true },
  ];

  if (weaponType === "archery") {
    baseItems.push(
      { id: "g13", label: "Bow maintenance kit", category: "weapon", required: true },
      { id: "g14", label: "Extra arrows/broadheads", category: "weapon", required: true },
      { id: "g15", label: "Bow-mounted rangefinder or sight tape", category: "weapon", required: false }
    );
  } else if (weaponType === "muzzleloader") {
    baseItems.push(
      { id: "g13", label: "Cleaning kit for muzzleloader", category: "weapon", required: true },
      { id: "g14", label: "Extra powder charges/bullets", category: "weapon", required: true },
      { id: "g15", label: "Waterproof storage for powder", category: "weapon", required: true }
    );
  } else {
    baseItems.push(
      { id: "g13", label: "Rifle cleaning kit", category: "weapon", required: true },
      { id: "g14", label: "Extra ammunition", category: "weapon", required: true },
      { id: "g15", label: "Bipod or shooting sticks", category: "weapon", required: false }
    );
  }

  return baseItems;
}

function getDefaultPhysicalItems(terrainClass?: string): PrepItem[] {
  const isAlpine = terrainClass === "alpine" || terrainClass === "timber";
  return [
    { id: "p1", label: isAlpine ? "Cardio: 4-5 days/week (running, stairs)" : "Cardio: 3-4 days/week (walking, cycling)", category: "cardio", required: true, notes: isAlpine ? "Focus on incline and elevation" : "Build endurance for long sits and stalks" },
    { id: "p2", label: "Weighted pack hikes (start 30lb, build to 60lb)", category: "strength", required: isAlpine, notes: "Simulate hauling meat out" },
    { id: "p3", label: "Leg strengthening (squats, lunges, step-ups)", category: "strength", required: true },
    { id: "p4", label: "Core work (planks, dead bugs, carries)", category: "strength", required: true },
    { id: "p5", label: "Altitude acclimation plan", category: "altitude", required: isAlpine, notes: "Arrive 1-2 days early if hunting above 9000ft" },
    { id: "p6", label: "Shooting practice: 3x/week minimum", category: "shooting", required: true, notes: "Practice at hunting distances and positions" },
  ];
}

function getDefaultScoutingItems(): PrepItem[] {
  return [
    { id: "s1", label: "Study e-scout maps (onX, GoHunt, HuntStand)", category: "digital", required: true },
    { id: "s2", label: "Review harvest stats for target unit", category: "research", required: true },
    { id: "s3", label: "Set trail cameras (if legal in state)", category: "field", required: false, notes: "Check state regs on trail camera use" },
    { id: "s4", label: "Glass from vantage points (if possible pre-season)", category: "field", required: false },
    { id: "s5", label: "Identify water sources on maps", category: "digital", required: true },
    { id: "s6", label: "Check road closures and access points", category: "access", required: true },
    { id: "s7", label: "Contact local biologist or game warden", category: "intel", required: false, notes: "Great source of unit-specific info" },
  ];
}

function getTravelItems(stateCode: string): PrepItem[] {
  return [
    { id: "t1", label: `Confirm ${stateCode} travel route and lodging`, category: "logistics", required: true },
    { id: "t2", label: "Book accommodations or reserve campsite", category: "lodging", required: true },
    { id: "t3", label: "Vehicle maintenance check", category: "vehicle", required: true },
    { id: "t4", label: "Fuel stops planned for remote areas", category: "vehicle", required: false },
    { id: "t5", label: "Emergency contact plan (cell coverage may be limited)", category: "safety", required: true },
    { id: "t6", label: "Check-in protocol with someone at home", category: "safety", required: true },
  ];
}

function getLicenseItems(stateCode: string, speciesSlug: string): PrepItem[] {
  return [
    { id: "l1", label: `${stateCode} hunting license purchased`, category: "license", required: true },
    { id: "l2", label: `${speciesSlug} tag/permit secured`, category: "tag", required: true },
    { id: "l3", label: "Hunter education certificate on hand", category: "education", required: true },
    { id: "l4", label: "Physical ID/driver's license packed", category: "id", required: true },
    { id: "l5", label: `Review ${stateCode} hunting regulations`, category: "regulations", required: true, notes: "Know legal shooting hours, weapon restrictions, and unit boundaries" },
    { id: "l6", label: "Habitat stamp or conservation stamp (if required)", category: "license", required: false },
  ];
}
