// =============================================================================
// Scouting Checklists — Load gear/training/timeline templates from app_config
// =============================================================================

import { db } from "@/lib/db";
import { appConfig } from "@/lib/db/schema";
import { eq, and, like } from "drizzle-orm";

export interface ChecklistItem {
  id: string;
  label: string;
  category: string;
  required: boolean;
  notes?: string;
}

export interface ChecklistTemplate {
  items: ChecklistItem[];
}

export interface TrainingPlan {
  weeks: {
    week: number;
    focus: string;
    activities: { name: string; duration: string; notes?: string }[];
  }[];
}

export interface ScoutingTimeline {
  entries: {
    weeksBefore: number;
    title: string;
    description: string;
    priority: "high" | "medium" | "low";
  }[];
}

/**
 * Load a checklist template from app_config by its key.
 */
export async function loadChecklistTemplate(
  key: string
): Promise<ChecklistTemplate | null> {
  const row = await db.query.appConfig.findFirst({
    where: and(eq(appConfig.namespace, "scouting"), eq(appConfig.key, key)),
  });

  if (!row?.value) return null;
  return row.value as ChecklistTemplate;
}

/**
 * Load all checklist templates matching a pattern (e.g., gear.*).
 */
export async function loadChecklistsByPrefix(
  prefix: string
): Promise<Record<string, ChecklistTemplate>> {
  const rows = await db
    .select({ key: appConfig.key, value: appConfig.value })
    .from(appConfig)
    .where(
      and(eq(appConfig.namespace, "scouting"), like(appConfig.key, `${prefix}%`))
    );

  const result: Record<string, ChecklistTemplate> = {};
  for (const row of rows) {
    result[row.key] = row.value as ChecklistTemplate;
  }
  return result;
}

/**
 * Determine which gear checklist to use based on weapon type and terrain.
 */
export function getGearChecklistKey(
  weaponType?: string,
  terrainClass?: string
): string {
  const weapon = weaponType ?? "rifle";
  const terrain = terrainClass ?? "mixed";

  if (weapon === "archery" && (terrain === "timber" || terrain === "mixed")) {
    return "gear.archery_timber";
  }
  if (terrain === "alpine") return "gear.rifle_alpine";
  if (terrain === "prairie" || terrain === "desert")
    return "gear.muzzleloader_prairie";
  return "gear.rifle_alpine"; // default
}

/**
 * Determine which physical training plan to use.
 */
export function getTrainingPlanKey(terrainClass?: string): string {
  if (terrainClass === "alpine" || terrainClass === "timber") {
    return "physical.alpine";
  }
  return "physical.prairie";
}

/**
 * Determine which scouting timeline to use.
 */
export function getTimelineKey(speciesSlug?: string): string {
  if (
    speciesSlug === "elk" ||
    speciesSlug === "mule_deer" ||
    speciesSlug === "moose"
  ) {
    return "timeline.western_elk";
  }
  return "timeline.whitetail";
}
