import { describe, it, expect } from "vitest";
import { COMPLETENESS_WEIGHTS, PLAYBOOK_READY_THRESHOLD } from "../types";

const EXPECTED_CATEGORIES = [
  "species_interest",
  "state_interest",
  "hunt_orientation",
  "timeline",
  "budget",
  "experience",
  "travel",
  "hunt_style",
  "weapon",
  "physical",
  "location",
  "land_access",
] as const;

describe("COMPLETENESS_WEIGHTS", () => {
  it("contains all expected preference categories", () => {
    for (const cat of EXPECTED_CATEGORIES) {
      expect(COMPLETENESS_WEIGHTS).toHaveProperty(cat);
    }
  });

  it("has no extra categories beyond expected", () => {
    const keys = Object.keys(COMPLETENESS_WEIGHTS);
    expect(keys).toHaveLength(EXPECTED_CATEGORIES.length);
  });

  it("all weights are non-negative numbers", () => {
    for (const [, value] of Object.entries(COMPLETENESS_WEIGHTS)) {
      expect(typeof value.points).toBe("number");
      expect(value.points).toBeGreaterThanOrEqual(0);
    }
  });

  it("all entries have a non-empty label string", () => {
    for (const [, value] of Object.entries(COMPLETENESS_WEIGHTS)) {
      expect(typeof value.label).toBe("string");
      expect(value.label.length).toBeGreaterThan(0);
    }
  });

  it("total points sum to 100", () => {
    const total = Object.values(COMPLETENESS_WEIGHTS).reduce(
      (sum, v) => sum + v.points,
      0,
    );
    expect(total).toBe(100);
  });
});

describe("PLAYBOOK_READY_THRESHOLD", () => {
  it("is 60", () => {
    expect(PLAYBOOK_READY_THRESHOLD).toBe(60);
  });
});
