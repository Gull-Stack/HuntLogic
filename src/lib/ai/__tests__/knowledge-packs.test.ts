import { beforeEach, describe, expect, it, vi } from "vitest";

const readdirMock = vi.fn();
const readFileMock = vi.fn();

vi.mock("node:fs/promises", () => ({
  readdir: readdirMock,
  readFile: readFileMock,
}));

describe("knowledge packs", () => {
  beforeEach(() => {
    vi.resetModules();
    readdirMock.mockReset();
    readFileMock.mockReset();
  });

  it("selects the Pennsylvania elk pack for a matching query", async () => {
    readdirMock.mockResolvedValue(["pennsylvania-elk.md"]);
    readFileMock.mockResolvedValue(`---
title: Pennsylvania Elk Strategy Pack
states: PA, Pennsylvania
species: elk
keywords: trophy, density, zone
---
Top density-first picks: Zone 2 and Zone 3.
`);

    const { findRelevantKnowledgePacks } = await import("../knowledge-packs");
    const packs = await findRelevantKnowledgePacks(
      "I want to apply for elk in PA and care about trophy quality and density"
    );

    expect(packs).toHaveLength(1);
    expect(packs[0]?.title).toBe("Pennsylvania Elk Strategy Pack");
    expect(packs[0]?.score).toBeGreaterThan(0);
  });

  it("does not match short state codes inside larger words", async () => {
    readdirMock.mockResolvedValue(["pennsylvania-elk.md"]);
    readFileMock.mockResolvedValue(`---
title: Pennsylvania Elk Strategy Pack
states: PA, Pennsylvania
species: elk
keywords: trophy, density, zone
---
Top density-first picks: Zone 2 and Zone 3.
`);

    const { findRelevantKnowledgePacks } = await import("../knowledge-packs");
    const packs = await findRelevantKnowledgePacks(
      "What's the best hunting space in the northeast for deer?"
    );

    expect(packs).toEqual([]);
  });

  it("returns empty when no pack matches the query", async () => {
    readdirMock.mockResolvedValue(["pennsylvania-elk.md"]);
    readFileMock.mockResolvedValue(`---
title: Pennsylvania Elk Strategy Pack
states: PA, Pennsylvania
species: elk
keywords: trophy, density, zone
---
Top density-first picks: Zone 2 and Zone 3.
`);

    const { findRelevantKnowledgePacks } = await import("../knowledge-packs");
    const packs = await findRelevantKnowledgePacks("What should I know about Texas hog hunts?");

    expect(packs).toEqual([]);
  });
});
