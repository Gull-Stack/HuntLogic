import { describe, expect, it } from "vitest";
import { normalizeHuntUnitCode } from "../unit-code";

describe("normalizeHuntUnitCode", () => {
  it("normalizes Wyoming numeric area codes", () => {
    expect(normalizeHuntUnitCode("001", "WY")).toBe("1");
    expect(normalizeHuntUnitCode("Area 100", "WY")).toBe("100");
  });

  it("normalizes Arizona alpha-numeric unit codes", () => {
    expect(normalizeHuntUnitCode("06A", "AZ")).toBe("6A");
    expect(normalizeHuntUnitCode(" unit 12aw ", "AZ")).toBe("12AW");
  });

  it("leaves already-normalized codes intact", () => {
    expect(normalizeHuntUnitCode("61", "CO")).toBe("61");
    expect(normalizeHuntUnitCode("7", "WY")).toBe("7");
  });
});
