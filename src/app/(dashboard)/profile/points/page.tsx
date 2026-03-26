"use client";

import { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Sheet } from "@/components/ui/Sheet";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Plus,
  ChevronDown,
  ChevronUp,
  Award,
  Edit3,
  Check,
  X,
} from "lucide-react";
import type { PointHolding } from "@/services/profile/types";
import {
  STATE_SPECIES_INTELLIGENCE,
  KNOWN_SPECIES_SLUGS,
  type SpeciesSlug,
} from "@/lib/data/state-species-intelligence";
import {
  STATE_POINT_SYSTEMS,
  getPointSystem,
} from "@/lib/data/state-point-systems";

/* -------------------------------------------------------------------------- */
/*  Species display names                                                     */
/* -------------------------------------------------------------------------- */

const SPECIES_DISPLAY_NAMES: Record<string, string> = {
  caribou: "Caribou",
  moose: "Moose",
  elk: "Elk",
  mule_deer: "Mule Deer",
  pronghorn: "Pronghorn",
  bighorn_sheep: "Bighorn Sheep",
  mountain_goat: "Mountain Goat",
  black_bear: "Black Bear",
  bison: "Bison",
  turkey: "Turkey",
  whitetail: "Whitetail",
  pheasant: "Pheasant",
  javelina: "Javelina",
  mountain_lion: "Mountain Lion",
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

interface StateSpeciesEntry {
  slug: string;
  name: string;
  pointType: string;
  pointLabel: string;
}

/** Invert the species→states intelligence to get all species for a given state */
function getSpeciesForState(stateCode: string): StateSpeciesEntry[] {
  const results: StateSpeciesEntry[] = [];
  const seen = new Set<string>();

  for (const slug of KNOWN_SPECIES_SLUGS) {
    const intel = STATE_SPECIES_INTELLIGENCE[slug];
    if (!intel) continue;
    const hasState = intel.topStates.some((s) => s.stateCode === stateCode);
    if (hasState && !seen.has(slug)) {
      seen.add(slug);
      const ps = getPointSystem(stateCode, slug);
      results.push({
        slug,
        name: SPECIES_DISPLAY_NAMES[slug] ?? slug,
        pointType: ps?.type === "none" ? "none" : ps?.type ?? "preference",
        pointLabel: ps?.label ?? "Points",
      });
    }
  }

  return results;
}

/** State names for the dropdown */
const STATE_NAMES: Record<string, string> = {
  AK: "Alaska", AL: "Alabama", AR: "Arkansas", AZ: "Arizona",
  CA: "California", CO: "Colorado", CT: "Connecticut", DE: "Delaware",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", IA: "Iowa",
  ID: "Idaho", IL: "Illinois", IN: "Indiana", KS: "Kansas",
  KY: "Kentucky", LA: "Louisiana", MA: "Massachusetts", MD: "Maryland",
  ME: "Maine", MI: "Michigan", MN: "Minnesota", MO: "Missouri",
  MS: "Mississippi", MT: "Montana", NC: "North Carolina", ND: "North Dakota",
  NE: "Nebraska", NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico",
  NV: "Nevada", NY: "New York", OH: "Ohio", OK: "Oklahoma",
  OR: "Oregon", PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina",
  SD: "South Dakota", TN: "Tennessee", TX: "Texas", UT: "Utah",
  VA: "Virginia", VT: "Vermont", WA: "Washington", WI: "Wisconsin",
  WV: "West Virginia", WY: "Wyoming",
};

/** Get all unique states that appear in the intelligence data (states with draw programs) */
function getDrawStates(): { code: string; name: string }[] {
  const codes = new Set<string>();
  for (const slug of KNOWN_SPECIES_SLUGS) {
    const intel = STATE_SPECIES_INTELLIGENCE[slug];
    if (!intel) continue;
    for (const s of intel.topStates) codes.add(s.stateCode);
  }
  return Array.from(codes)
    .sort((a, b) => (STATE_NAMES[a] ?? a).localeCompare(STATE_NAMES[b] ?? b))
    .map((c) => ({ code: c, name: STATE_NAMES[c] ?? c }));
}

interface StateGroup {
  stateCode: string;
  stateName: string;
  holdings: PointHolding[];
  totalPoints: number;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

export default function PointsPage() {
  const [holdings, setHoldings] = useState<PointHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // Add-points form state
  const [selectedState, setSelectedState] = useState("");
  const [speciesPoints, setSpeciesPoints] = useState<
    Record<string, { points: string; year: string }>
  >({});

  const drawStates = useMemo(() => getDrawStates(), []);
  const stateSpecies = useMemo(
    () => (selectedState ? getSpeciesForState(selectedState) : []),
    [selectedState],
  );
  const statePointSystem = selectedState
    ? STATE_POINT_SYSTEMS[selectedState]
    : null;

  useEffect(() => {
    async function fetchHoldings() {
      try {
        const res = await fetch("/api/v1/profile/points");
        if (res.ok) {
          const data = await res.json();
          setHoldings(data.data || data);
        }
      } catch (err) {
        console.error("[points] Failed to fetch holdings:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHoldings();
  }, []);

  // Reset species form when state changes
  useEffect(() => {
    if (selectedState && stateSpecies.length > 0) {
      const init: Record<string, { points: string; year: string }> = {};
      for (const sp of stateSpecies) {
        init[sp.slug] = { points: "", year: "" };
      }
      setSpeciesPoints(init);
    }
  }, [selectedState, stateSpecies]);

  // Group by state
  const stateGroups: StateGroup[] = [];
  const stateMap = new Map<string, StateGroup>();

  for (const h of holdings) {
    let group = stateMap.get(h.stateCode);
    if (!group) {
      group = {
        stateCode: h.stateCode,
        stateName: h.stateName,
        holdings: [],
        totalPoints: 0,
      };
      stateMap.set(h.stateCode, group);
      stateGroups.push(group);
    }
    group.holdings.push(h);
    group.totalPoints += h.points;
  }

  const totalAllPoints = holdings.reduce((sum, h) => sum + h.points, 0);

  const toggleState = (code: string) => {
    setExpandedStates((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleEdit = (id: string, currentPoints: number) => {
    setEditingId(id);
    setEditValue(currentPoints);
  };

  const handleSaveEdit = (id: string) => {
    setHoldings((prev) =>
      prev.map((h) => (h.id === id ? { ...h, points: editValue } : h)),
    );
    setEditingId(null);
  };

  const handleSaveAll = () => {
    if (!selectedState) return;

    const newHoldings: PointHolding[] = [];
    const now = new Date().toISOString();
    const currentYear = new Date().getFullYear();

    for (const sp of stateSpecies) {
      const entry = speciesPoints[sp.slug];
      if (!entry) continue;

      const pts = entry.points === "" ? 0 : parseInt(entry.points, 10) || 0;
      const yr = entry.year === "" ? currentYear : parseInt(entry.year, 10) || currentYear;

      // Only save if user entered points > 0 or a year
      if (pts > 0 || entry.year !== "") {
        newHoldings.push({
          id: `ph-${Date.now()}-${sp.slug}`,
          userId: "u-1",
          stateId: selectedState,
          speciesId: sp.slug,
          stateName: STATE_NAMES[selectedState] ?? selectedState,
          stateCode: selectedState,
          speciesName: sp.name,
          pointType: sp.pointType,
          points: pts,
          yearStarted: yr,
          verified: false,
          createdAt: now,
          updatedAt: now,
        });
      }
    }

    if (newHoldings.length > 0) {
      setHoldings((prev) => [...prev, ...newHoldings]);
    }

    setShowAddSheet(false);
    setSelectedState("");
    setSpeciesPoints({});
  };

  const handleSpeciesPointChange = (slug: string, value: string) => {
    const raw = value.replace(/\D/g, "");
    setSpeciesPoints((prev) => ({
      ...prev,
      [slug]: { ...prev[slug]!, points: raw === "" ? "" : String(Math.min(30, parseInt(raw, 10))) },
    }));
  };

  const handleSpeciesYearChange = (slug: string, value: string) => {
    const raw = value.replace(/\D/g, "").slice(0, 4);
    setSpeciesPoints((prev) => ({
      ...prev,
      [slug]: { ...prev[slug]!, year: raw },
    }));
  };

  const handleSpeciesYearBlur = (slug: string) => {
    setSpeciesPoints((prev) => {
      const entry = prev[slug];
      if (!entry || entry.year === "") return prev;
      let yr = parseInt(entry.year, 10);
      if (isNaN(yr) || yr < 1990) yr = 1990;
      if (yr > new Date().getFullYear()) yr = new Date().getFullYear();
      return { ...prev, [slug]: { ...entry, year: String(yr) } };
    });
  };

  const hasAnyPoints = Object.values(speciesPoints).some(
    (e) => e.points !== "" && e.points !== "0",
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-44 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-64 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-16 w-full motion-safe:animate-pulse rounded-xl bg-brand-sage/10"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          Preference Points
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Track your preference and bonus points across all states
        </p>
      </div>

      {/* Summary card */}
      <Card className="bg-brand-forest text-white dark:bg-brand-sage/30">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-brand-cream/70">Total Points</p>
            <p className="text-3xl font-bold">{totalAllPoints}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-brand-cream/70">States</p>
            <p className="text-3xl font-bold">{stateGroups.length}</p>
          </div>
        </div>
      </Card>

      {/* Point holdings by state */}
      {stateGroups.length === 0 ? (
        <EmptyState
          icon={<Award className="h-8 w-8" />}
          title="No Points Added"
          description="Add your preference point holdings to get accurate draw odds predictions."
          actionLabel="Add Points"
          onAction={() => setShowAddSheet(true)}
        />
      ) : (
        <div className="space-y-3">
          {stateGroups.map((group) => {
            const isExpanded = expandedStates.has(group.stateCode);

            return (
              <Card key={group.stateCode}>
                <button
                  onClick={() => toggleState(group.stateCode)}
                  className="flex min-h-[48px] w-full items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-sage/10 text-sm font-bold text-brand-sage dark:bg-brand-sage/20">
                      {group.stateCode}
                    </div>
                    <div>
                      <p className="font-semibold text-brand-bark dark:text-brand-cream">
                        {group.stateName}
                      </p>
                      <p className="text-xs text-brand-sage">
                        {group.holdings.length} species, {group.totalPoints}{" "}
                        total pts
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-brand-sage" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-brand-sage" />
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-3 space-y-2 border-t border-brand-sage/10 pt-3 dark:border-brand-sage/20">
                    {group.holdings.map((holding) => (
                      <div
                        key={holding.id}
                        className="flex items-center justify-between rounded-lg bg-brand-sage/5 px-3 py-2.5 dark:bg-brand-sage/10"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                            {holding.speciesName}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Badge variant="outline" size="sm">
                              {holding.pointType}
                            </Badge>
                            {holding.yearStarted && (
                              <span className="text-xs text-brand-sage">
                                Since {holding.yearStarted}
                              </span>
                            )}
                          </div>
                        </div>

                        {editingId === holding.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) =>
                                setEditValue(parseInt(e.target.value) || 0)
                              }
                              className="w-16 rounded-lg border border-brand-sage/20 bg-white px-2 py-1 text-center text-sm dark:bg-brand-bark dark:border-brand-sage/30"
                              min={0}
                              max={30}
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveEdit(holding.id)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-success hover:bg-success/10"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage hover:bg-brand-sage/10"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-brand-bark dark:text-brand-cream tabular-nums">
                              {holding.points}
                            </span>
                            <button
                              onClick={() =>
                                handleEdit(holding.id, holding.points)
                              }
                              className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage hover:bg-brand-sage/10"
                              aria-label="Edit points"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Points FAB */}
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 lg:right-12 z-50">
        <button
          onClick={() => setShowAddSheet(true)}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-forest text-white shadow-lg transition-all hover:bg-brand-sage active:scale-95"
          aria-label="Add points"
        >
          <Plus className="h-6 w-6" />
        </button>
      </div>

      {/* ================================================================ */}
      {/*  ADD POINTS SHEET — State → All species grid                     */}
      {/* ================================================================ */}
      <Sheet
        isOpen={showAddSheet}
        onClose={() => {
          setShowAddSheet(false);
          setSelectedState("");
          setSpeciesPoints({});
        }}
        title="Add Points"
        snapPoint="full"
      >
        <div className="space-y-5">
          {/* State selector */}
          <div>
            <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
              State
            </label>
            <select
              value={selectedState}
              onChange={(e) => setSelectedState(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-base dark:bg-brand-bark dark:border-brand-sage/30 dark:text-brand-cream"
            >
              <option value="">Select a state</option>
              {drawStates.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          {/* Point system info banner */}
          {statePointSystem && (
            <div className="rounded-xl bg-brand-sage/5 px-4 py-3 dark:bg-brand-sage/10">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-4 w-4 text-brand-forest dark:text-brand-sage" />
                <span className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                  {statePointSystem.label}
                </span>
              </div>
              <p className="text-xs text-brand-sage leading-relaxed">
                {statePointSystem.description}
              </p>
            </div>
          )}

          {/* Species grid */}
          {selectedState && stateSpecies.length > 0 && (
            <div>
              <p className="text-sm font-medium text-brand-bark dark:text-brand-cream mb-3">
                Enter your points for each species (leave blank for 0)
              </p>
              <div className="space-y-2">
                {stateSpecies.map((sp) => {
                  const entry = speciesPoints[sp.slug];
                  // Show species-specific point type if different from state default
                  const showOverride =
                    sp.pointType !== statePointSystem?.type &&
                    sp.pointType !== "none";

                  return (
                    <div
                      key={sp.slug}
                      className="flex items-center gap-3 rounded-xl bg-brand-sage/5 px-3 py-2.5 dark:bg-brand-sage/10"
                    >
                      {/* Species name + point type badge */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-bark dark:text-brand-cream truncate">
                          {sp.name}
                        </p>
                        {showOverride && (
                          <Badge variant="outline" size="sm" className="mt-0.5">
                            {sp.pointLabel}
                          </Badge>
                        )}
                        {sp.pointType === "none" && (
                          <p className="text-[10px] text-brand-sage mt-0.5">
                            No point system — random draw
                          </p>
                        )}
                      </div>

                      {/* Points input */}
                      <div className="flex items-center gap-2">
                        <div className="text-center">
                          <label className="block text-[10px] text-brand-sage mb-0.5">
                            Pts
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={entry?.points ?? ""}
                            placeholder="0"
                            onChange={(e) =>
                              handleSpeciesPointChange(sp.slug, e.target.value)
                            }
                            disabled={sp.pointType === "none"}
                            className="w-14 min-h-[36px] rounded-lg border border-brand-sage/20 bg-white px-2 py-1.5 text-center text-sm tabular-nums dark:bg-brand-bark dark:border-brand-sage/30 dark:text-brand-cream disabled:opacity-40 disabled:cursor-not-allowed"
                          />
                        </div>

                        {/* Year input */}
                        <div className="text-center">
                          <label className="block text-[10px] text-brand-sage mb-0.5">
                            Since
                          </label>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={entry?.year ?? ""}
                            placeholder={String(new Date().getFullYear())}
                            onChange={(e) =>
                              handleSpeciesYearChange(sp.slug, e.target.value)
                            }
                            onBlur={() => handleSpeciesYearBlur(sp.slug)}
                            className="w-16 min-h-[36px] rounded-lg border border-brand-sage/20 bg-white px-2 py-1.5 text-center text-sm tabular-nums dark:bg-brand-bark dark:border-brand-sage/30 dark:text-brand-cream"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Empty state for selected state with no species */}
          {selectedState && stateSpecies.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-brand-sage">
                No draw species found for{" "}
                {STATE_NAMES[selectedState] ?? selectedState}.
              </p>
            </div>
          )}

          {/* Save button */}
          {selectedState && stateSpecies.length > 0 && (
            <Button
              fullWidth
              onClick={handleSaveAll}
              disabled={!hasAnyPoints}
            >
              Save Points for {STATE_NAMES[selectedState] ?? selectedState}
            </Button>
          )}
        </div>
      </Sheet>
    </div>
  );
}
