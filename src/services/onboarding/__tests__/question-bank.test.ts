import { describe, it, expect, vi } from "vitest";

// Mock database modules so top-level imports in question-bank.ts don't fail
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema", () => ({ states: {}, species: {} }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn() }));

import { QUESTION_BANK, getQuestionById } from "../question-bank";

describe("QUESTION_BANK", () => {
  it("is not empty", () => {
    expect(QUESTION_BANK.length).toBeGreaterThan(0);
  });

  it("all questions have required fields", () => {
    for (const q of QUESTION_BANK) {
      expect(q.id).toBeTruthy();
      expect(q.category).toBeTruthy();
      expect(q.promptSlug).toBeTruthy();
      expect(typeof q.weight).toBe("number");
      expect(q.responseType).toBeTruthy();
    }
  });

  it("all question IDs are unique", () => {
    const ids = QUESTION_BANK.map((q) => q.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("weights are between 0 and 1 inclusive", () => {
    for (const q of QUESTION_BANK) {
      expect(q.weight).toBeGreaterThanOrEqual(0);
      expect(q.weight).toBeLessThanOrEqual(1);
    }
  });
});

describe("getQuestionById", () => {
  it("returns the correct question for a known ID", () => {
    const q = getQuestionById("species_interest");
    expect(q).toBeDefined();
    expect(q!.id).toBe("species_interest");
    expect(q!.category).toBe("species_interest");
  });

  it("returns undefined for an unknown ID", () => {
    const q = getQuestionById("nonexistent_question_xyz");
    expect(q).toBeUndefined();
  });
});
