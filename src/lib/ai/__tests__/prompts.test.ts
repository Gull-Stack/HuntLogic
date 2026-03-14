import { describe, it, expect, vi } from "vitest";

// Mock database modules so the top-level imports in prompts.ts don't fail
vi.mock("@/lib/db", () => ({ db: {} }));
vi.mock("@/lib/db/schema/config", () => ({ aiPrompts: {} }));
vi.mock("drizzle-orm", () => ({ eq: vi.fn(), and: vi.fn(), desc: vi.fn() }));

import { interpolatePrompt } from "../prompts";

describe("interpolatePrompt", () => {
  it("replaces a single variable", () => {
    const result = interpolatePrompt("Hello {{name}}", { name: "Hunter" });
    expect(result).toBe("Hello Hunter");
  });

  it("replaces multiple variables", () => {
    const result = interpolatePrompt(
      "{{context}}\n\nUser question: {{query}}",
      { context: "Draw odds data", query: "What are my chances?" }
    );
    expect(result).toBe("Draw odds data\n\nUser question: What are my chances?");
  });

  it("replaces all occurrences of the same variable", () => {
    const result = interpolatePrompt("{{x}} and {{x}}", { x: "yes" });
    expect(result).toBe("yes and yes");
  });

  it("leaves placeholders for missing variables", () => {
    const result = interpolatePrompt("{{name}} in {{state}}", { name: "Mike" });
    expect(result).toBe("Mike in {{state}}");
  });

  it("returns template unchanged with empty variables object", () => {
    const template = "Hello {{name}}, welcome to {{app}}";
    const result = interpolatePrompt(template, {});
    expect(result).toBe(template);
  });

  it("handles template with no placeholders", () => {
    const result = interpolatePrompt("No variables here", { name: "test" });
    expect(result).toBe("No variables here");
  });
});
