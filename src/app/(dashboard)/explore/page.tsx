"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Search,
  MapPin,
  Target,
  ChevronRight,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { apiClient } from "@/lib/api/client";
import Link from "next/link";
import { UNIQUE_OPPORTUNITIES } from "@/lib/data/unique-opportunities";

interface StateInfo {
  code: string;
  name: string;
  region: string;
  hasDrawSystem: boolean;
  hasPointSystem: boolean;
  agencyName: string;
  agencyUrl: string;
  speciesCount: number;
}

interface SpeciesInfo {
  slug: string;
  name: string;
  category: string;
  stateCount: number;
}

interface StateSpeciesDetail {
  stateCode: string;
  stateName: string;
  speciesSlug: string;
  speciesName: string;
  hasDraw: boolean;
  hasOtc: boolean;
  hasPoints: boolean;
  pointType: string | null;
  huntTypes: string[];
}

type ViewMode = "states" | "species";

export default function ExplorePage() {
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("states");
  const [searchQuery, setSearchQuery] = useState("");
  const [regionFilter, setRegionFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [states, setStates] = useState<StateInfo[]>([]);
  const [speciesList, setSpeciesList] = useState<SpeciesInfo[]>([]);
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [stateDetails, setStateDetails] = useState<Record<string, StateSpeciesDetail[]>>({});

  const fetchData = useCallback(async () => {
    try {
      const [statesRes, speciesRes] = await Promise.all([
        apiClient.getCached<{ states: StateInfo[] }>("/explore/states", { staleMs: 120_000 }),
        apiClient.getCached<{ species: SpeciesInfo[] }>("/explore/species", { staleMs: 120_000 }),
      ]);
      setStates(statesRes.data?.states ?? []);
      setSpeciesList(speciesRes.data?.species ?? []);
    } catch (err) {
      console.error("[explore] Load failed:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const loadStateDetails = async (stateCode: string) => {
    if (stateDetails[stateCode]) {
      setExpandedState(expandedState === stateCode ? null : stateCode);
      return;
    }
    try {
      const res = await apiClient.get<{ species: StateSpeciesDetail[] }>(`/explore/states/${stateCode}`);
      setStateDetails((prev) => ({ ...prev, [stateCode]: res.data?.species ?? [] }));
      setExpandedState(stateCode);
    } catch (err) {
      console.error("[explore] Detail load failed:", err);
    }
  };

  const regions = ["all", "west", "east", "midwest", "south"];
  const filteredStates = states.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === "all" || s.region === regionFilter;
    return matchesSearch && matchesRegion;
  });

  // Surface unique categories present in the loaded species list — drives the
  // category chip row. Order is stable + readable.
  const speciesCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const s of speciesList) {
      if (s.category) seen.add(s.category);
    }
    return ["all", ...Array.from(seen).sort()];
  }, [speciesList]);

  const filteredSpecies = speciesList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.slug.includes(searchQuery.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || s.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const formatCategoryLabel = (c: string) =>
    c === "all"
      ? "All Categories"
      : c.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());

  if (loading) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-brand-forest dark:text-brand-cream">Explore</h1></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 motion-safe:animate-pulse rounded-xl bg-brand-sage/10" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-forest dark:text-brand-cream">Explore</h1>
        <p className="mt-1 text-sm text-brand-sage">Browse hunting opportunities across all 50 states</p>
      </div>

      {/* Unique opportunities — Mitch April 30 review #10 layer 3.
          Curated overlooked hunts (KY elk lottery, ND/SD waterfowl, etc.). */}
      {UNIQUE_OPPORTUNITIES.length > 0 && (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-sunset" />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-bark dark:text-brand-cream">
              Unique opportunities
            </h2>
            <span className="text-xs text-brand-sage">
              hunts most hunters miss
            </span>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {UNIQUE_OPPORTUNITIES.map((opp) => (
              <Link
                key={opp.id}
                href={`/forecasts?state=${opp.stateCode}&species=${opp.speciesSlug}`}
                className="group min-w-[260px] max-w-[300px] flex-shrink-0 rounded-xl border border-brand-sage/10 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-brand-sage/20 dark:bg-brand-bark"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="rounded bg-brand-forest/10 px-1.5 py-0.5 text-[10px] font-bold text-brand-forest dark:bg-brand-sage/20 dark:text-brand-sage">
                    {opp.stateCode}
                  </span>
                  <span className="rounded bg-brand-sunset/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-brand-sunset">
                    {opp.tagAccess}
                  </span>
                </div>
                <p className="mt-2 text-sm font-semibold leading-snug text-brand-bark group-hover:text-brand-forest dark:text-brand-cream">
                  {opp.title}
                </p>
                <p className="mt-1 line-clamp-3 text-xs text-brand-sage">
                  {opp.blurb}
                </p>
                <p className="mt-3 text-[11px] text-brand-sage">
                  <span className="font-medium">When:</span> {opp.applicationWindow}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Search + View Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={viewMode === "states" ? "Search states..." : "Search species..."}
            className="w-full rounded-[10px] border border-[#E0DDD5] bg-white py-3 pl-10 pr-4 text-sm text-brand-bark outline-none focus:border-brand-forest dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30"
          />
        </div>
        <div className="flex rounded-[10px] border border-brand-sage/20 p-1">
          <button
            onClick={() => setViewMode("states")}
            className={`min-h-[36px] rounded-lg px-4 text-sm font-medium transition-colors ${
              viewMode === "states" ? "bg-brand-forest text-white" : "text-brand-sage hover:text-brand-bark"
            }`}
          >
            <MapPin className="mr-1.5 inline h-4 w-4" />States
          </button>
          <button
            onClick={() => setViewMode("species")}
            className={`min-h-[36px] rounded-lg px-4 text-sm font-medium transition-colors ${
              viewMode === "species" ? "bg-brand-forest text-white" : "text-brand-sage hover:text-brand-bark"
            }`}
          >
            <Target className="mr-1.5 inline h-4 w-4" />Species
          </button>
        </div>
      </div>

      {/* Category Filter (species view only) — Mitch #10 layer 1 + species categories from #4. */}
      {viewMode === "species" && speciesCategories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {speciesCategories.map((c) => (
            <button
              key={c}
              onClick={() => setCategoryFilter(c)}
              className={`min-h-[36px] whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                categoryFilter === c
                  ? "bg-brand-forest text-white"
                  : "border border-brand-sage/20 text-brand-sage hover:text-brand-bark"
              }`}
            >
              {formatCategoryLabel(c)}
            </button>
          ))}
        </div>
      )}

      {/* Region Filter (states view only) */}
      {viewMode === "states" && (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setRegionFilter(r)}
              className={`min-h-[36px] whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                regionFilter === r
                  ? "bg-brand-forest text-white"
                  : "border border-brand-sage/20 text-brand-sage hover:text-brand-bark"
              }`}
            >
              {r === "all" ? "All Regions" : r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Results */}
      {viewMode === "states" ? (
        <div className="space-y-2">
          {filteredStates.length === 0 ? (
            <p className="py-8 text-center text-sm text-brand-sage">No states match your search</p>
          ) : (
            filteredStates.map((state) => (
              <div key={state.code} className="rounded-xl border border-brand-sage/10 bg-white dark:bg-brand-bark dark:border-brand-sage/20">
                <button
                  onClick={() => loadStateDetails(state.code)}
                  className="flex w-full items-center justify-between p-4 text-left transition-colors hover:bg-brand-sage/5"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-forest/10 text-xs font-bold text-brand-forest dark:bg-brand-sage/20 dark:text-brand-sage">
                      {state.code}
                    </span>
                    <div>
                      <p className="font-semibold text-brand-bark dark:text-brand-cream">{state.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        {state.hasDrawSystem && <span className="text-[10px] font-medium text-brand-sunset bg-brand-sunset/10 px-1.5 py-0.5 rounded">DRAW</span>}
                        {state.hasPointSystem && <span className="text-[10px] font-medium text-brand-sky bg-brand-sky/10 px-1.5 py-0.5 rounded">POINTS</span>}
                        <span className="text-[10px] text-brand-sage">{state.speciesCount} species</span>
                      </div>
                    </div>
                  </div>
                  {expandedState === state.code ? (
                    <ChevronDown className="h-5 w-5 text-brand-sage" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-brand-sage" />
                  )}
                </button>
                {expandedState === state.code && stateDetails[state.code] && (
                  <div className="border-t border-brand-sage/10 px-4 pb-4 dark:border-brand-sage/20">
                    {stateDetails[state.code].length === 0 ? (
                      <p className="py-4 text-sm text-brand-sage">No species data available yet</p>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {stateDetails[state.code].map((sp, i) => (
                          <div key={i} className="flex items-center justify-between rounded-lg bg-brand-sage/5 px-3 py-2 dark:bg-brand-sage/10">
                            <div>
                              <p className="text-sm font-medium text-brand-bark dark:text-brand-cream">{sp.speciesName}</p>
                              <div className="flex gap-1.5 mt-0.5">
                                {sp.hasDraw && <span className="text-[10px] text-brand-sunset">Draw</span>}
                                {sp.hasOtc && <span className="text-[10px] text-green-600">OTC</span>}
                                {sp.hasPoints && <span className="text-[10px] text-brand-sky">{sp.pointType}</span>}
                                {(sp.huntTypes as string[]).map((ht) => (
                                  <span key={ht} className="text-[10px] text-brand-sage">{ht}</span>
                                ))}
                              </div>
                            </div>
                            <Link
                              href={`/forecasts?state=${sp.stateCode}&species=${sp.speciesSlug}`}
                              className="text-xs font-medium text-brand-forest hover:underline dark:text-brand-sage"
                            >
                              View Odds
                            </Link>
                          </div>
                        ))}
                        {state.agencyUrl && (
                          <a
                            href={state.agencyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 block text-xs text-brand-forest hover:underline dark:text-brand-sage"
                          >
                            {state.agencyName || "State Agency Website"} &rarr;
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredSpecies.length === 0 ? (
            <p className="col-span-full py-8 text-center text-sm text-brand-sage">No species match your search</p>
          ) : (
            filteredSpecies.map((sp) => (
              <div key={sp.slug} className="rounded-xl border border-brand-sage/10 bg-white p-4 dark:bg-brand-bark dark:border-brand-sage/20">
                <p className="font-semibold text-brand-bark dark:text-brand-cream">{sp.name}</p>
                <p className="mt-0.5 text-xs text-brand-sage capitalize">{sp.category?.replace("_", " ")}</p>
                <p className="mt-2 text-sm text-brand-sage">Available in {sp.stateCount} states</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
