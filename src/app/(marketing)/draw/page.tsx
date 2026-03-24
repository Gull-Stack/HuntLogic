"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Target,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Crosshair,
  Beef,
  Trophy,
  Mountain,
  Scale,
  Lock,
  Sparkles,
  MapPin,
  Compass,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getBestStatesForSpecies, getSpeciesStateContext } from "@/lib/data/state-species-intelligence";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SpeciesOption {
  slug: string;
  name: string;
  category: string;
  stateCount: number;
}

interface StateOption {
  code: string;
  name: string;
  region: string;
  hasDrawSystem: boolean;
  hasPointSystem: boolean;
}

interface DrawResult {
  state: string;
  stateName: string;
  species: string;
  speciesName: string;
  drawRate: number | null;
  minPoints: number | null;
  unit: string;
  year: number | null;
  totalApplicants: number | null;
  totalTags: number | null;
  residentType?: string;
}

interface SimulatorResults {
  results: DrawResult[];
  total: number;
}

type Motivation = "freezer" | "trophy" | "lifetime" | "balanced";

const WEAPONS = ["Rifle", "Archery", "Muzzleloader", "Any"] as const;

const MOTIVATIONS: {
  key: Motivation;
  label: string;
  description: string;
  icon: typeof Beef;
}[] = [
  {
    key: "freezer",
    label: "Fill the Freezer",
    description: "Meat hunter — maximize success odds",
    icon: Beef,
  },
  {
    key: "trophy",
    label: "Wall Hanger",
    description: "Trophy quality — willing to wait",
    icon: Trophy,
  },
  {
    key: "lifetime",
    label: "Once-in-a-Lifetime",
    description: "The experience matters most",
    icon: Mountain,
  },
  {
    key: "balanced",
    label: "Balanced",
    description: "Good odds AND quality",
    icon: Scale,
  },
];

const TOTAL_STEPS = 6;

// ---------------------------------------------------------------------------
// Species → State reputation data (curated western hunting community knowledge)
// ---------------------------------------------------------------------------

// State-species intelligence imported from @/lib/data/state-species-intelligence

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDrawRate(rate: number | null): string {
  if (rate == null) return "N/A";
  return `${(rate * 100).toFixed(1)}%`;
}

function ProgressBar({ step }: { step: number }) {
  const pct = ((step) / TOTAL_STEPS) * 100;
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between text-xs font-medium text-brand-sage">
        <span>Step {step} of {TOTAL_STEPS}</span>
        <span>{Math.round(pct)}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-brand-sage/10">
        <div
          className="h-full rounded-full bg-gradient-cta transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Components
// ---------------------------------------------------------------------------

function StepSpecies({
  speciesList,
  selected,
  toggle,
}: {
  speciesList: SpeciesOption[];
  selected: Set<string>;
  toggle: (slug: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        What do you want to hunt?
      </h2>
      <p className="mt-2 text-brand-sage">
        Pick one or more species you&apos;re interested in.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {speciesList.map((s) => (
          <button
            key={s.slug}
            onClick={() => toggle(s.slug)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-all",
              selected.has(s.slug)
                ? "border-brand-forest bg-brand-forest text-white dark:border-brand-sage dark:bg-brand-sage"
                : "border-brand-sage/20 text-brand-bark hover:border-brand-forest hover:bg-brand-forest/5 dark:text-brand-cream dark:hover:border-brand-sage"
            )}
          >
            {s.name}
          </button>
        ))}
      </div>
      {selected.size === 0 && (
        <p className="mt-4 text-sm text-brand-sage/60">
          Select at least one species to continue.
        </p>
      )}
    </div>
  );
}

function StepStates({
  stateList,
  selected,
  toggle,
  selectSmart,
  suggestedReasons,
  buttonLabel,
  speciesContext,
}: {
  stateList: StateOption[];
  selected: Set<string>;
  toggle: (code: string) => void;
  selectSmart: () => void;
  suggestedReasons: Map<string, string>;
  buttonLabel: string;
  speciesContext?: string;
}) {
  const drawStates = stateList.filter((s) => s.hasDrawSystem);
  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        Which states?
      </h2>
      {speciesContext ? (
        <p className="mt-2 text-sm text-brand-forest/80 dark:text-brand-sage/90 leading-relaxed bg-brand-forest/5 dark:bg-brand-sage/10 rounded-lg px-3 py-2 border border-brand-forest/10 dark:border-brand-sage/20">
          <Sparkles className="inline h-3.5 w-3.5 mr-1 -mt-0.5 text-brand-forest dark:text-brand-sage" />
          {speciesContext}
        </p>
      ) : (
        <p className="mt-2 text-brand-sage">Where would you like to apply?</p>
      )}
      <button
        onClick={selectSmart}
        className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-brand-forest/30 bg-brand-forest/5 px-4 py-2 text-sm font-medium text-brand-forest transition-colors hover:bg-brand-forest/10 dark:border-brand-sage/30 dark:bg-brand-sage/10 dark:text-brand-sage dark:hover:bg-brand-sage/20"
      >
        <Sparkles className="h-4 w-4" />
        {buttonLabel}
      </button>
      <div className="mt-4 flex flex-wrap gap-3">
        {drawStates.map((s) => {
          const reason = suggestedReasons.get(s.code);
          const isSelected = selected.has(s.code);
          return (
            <div key={s.code} className="flex flex-col items-center">
              <button
                onClick={() => toggle(s.code)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm font-medium transition-all",
                  isSelected
                    ? "border-brand-forest bg-brand-forest text-white dark:border-brand-sage dark:bg-brand-sage"
                    : "border-brand-sage/20 text-brand-bark hover:border-brand-forest hover:bg-brand-forest/5 dark:text-brand-cream dark:hover:border-brand-sage"
                )}
              >
                {s.name}
              </button>
              {reason && isSelected && (
                <span className="mt-1 max-w-[120px] text-center text-[10px] italic leading-tight text-brand-forest/70 dark:text-brand-sage/70">
                  {reason}
                </span>
              )}
            </div>
          );
        })}
      </div>
      {selected.size === 0 && (
        <p className="mt-4 text-sm text-brand-sage/60">
          Select at least one state to continue.
        </p>
      )}
    </div>
  );
}

function StepWeapon({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (w: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        How do you want to hunt?
      </h2>
      <p className="mt-2 text-brand-sage">Choose your preferred weapon type.</p>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {WEAPONS.map((w) => (
          <button
            key={w}
            onClick={() => onSelect(w.toLowerCase())}
            className={cn(
              "rounded-xl border p-4 text-center text-sm font-semibold transition-all",
              selected === w.toLowerCase()
                ? "border-brand-forest bg-brand-forest text-white shadow-md dark:border-brand-sage dark:bg-brand-sage"
                : "border-brand-sage/20 text-brand-bark hover:border-brand-forest hover:shadow-sm dark:text-brand-cream dark:hover:border-brand-sage"
            )}
          >
            {w}
          </button>
        ))}
      </div>
    </div>
  );
}

// US states for home state selector
const US_STATES = [
  ["AL","Alabama"],["AK","Alaska"],["AZ","Arizona"],["AR","Arkansas"],["CA","California"],
  ["CO","Colorado"],["CT","Connecticut"],["DE","Delaware"],["FL","Florida"],["GA","Georgia"],
  ["HI","Hawaii"],["ID","Idaho"],["IL","Illinois"],["IN","Indiana"],["IA","Iowa"],
  ["KS","Kansas"],["KY","Kentucky"],["LA","Louisiana"],["ME","Maine"],["MD","Maryland"],
  ["MA","Massachusetts"],["MI","Michigan"],["MN","Minnesota"],["MS","Mississippi"],["MO","Missouri"],
  ["MT","Montana"],["NE","Nebraska"],["NV","Nevada"],["NH","New Hampshire"],["NJ","New Jersey"],
  ["NM","New Mexico"],["NY","New York"],["NC","North Carolina"],["ND","North Dakota"],["OH","Ohio"],
  ["OK","Oklahoma"],["OR","Oregon"],["PA","Pennsylvania"],["RI","Rhode Island"],["SC","South Carolina"],
  ["SD","South Dakota"],["TN","Tennessee"],["TX","Texas"],["UT","Utah"],["VT","Vermont"],
  ["VA","Virginia"],["WA","Washington"],["WV","West Virginia"],["WI","Wisconsin"],["WY","Wyoming"],
] as const;

// ---------------------------------------------------------------------------
// Inspire Me — curated hunt data
// ---------------------------------------------------------------------------

interface InspireApiHunt {
  species: string;
  state: string;
  tagline: string;
  difficulty: string;
  unitCode?: string;
  drawRate?: number | null;
  successRate?: number | null;
  yearsToExpect?: string;
  hook?: string;
}

const REGIONAL_OTC_HUNTS: Record<string, InspireApiHunt> = {
  southeast: { species: "White-tailed Deer", state: "Georgia", tagline: "Some of the best whitetail hunting in the Southeast. OTC license, 750K+ acres of public land.", difficulty: "otc" },
  south: { species: "White-tailed Deer", state: "Texas", tagline: "More whitetail than anywhere on earth. Private land leases are accessible and affordable.", difficulty: "otc" },
  midwest: { species: "Pheasant", state: "South Dakota", tagline: "The pheasant capital of the world. Incredible bird numbers and walk-in access.", difficulty: "otc" },
  west: { species: "Elk", state: "Idaho", tagline: "OTC bull elk tags in the Frank Church Wilderness. No draw, no points — just buy the license.", difficulty: "otc" },
  northwest: { species: "Black Bear", state: "Montana", tagline: "OTC spring bear tags in western Montana. High density, big public land.", difficulty: "otc" },
  southwest: { species: "Mule Deer", state: "Nevada", tagline: "Nevada issues more big game tags than most states. Some mule deer units draw with 0 points.", difficulty: "easy_draw" },
  mountain: { species: "Pronghorn", state: "Wyoming", tagline: "Wyoming has more pronghorn than anywhere on earth. Many units draw in 1-2 years NR.", difficulty: "easy_draw" },
  northeast: { species: "White-tailed Deer", state: "Pennsylvania", tagline: "Pennsylvania has one of the largest whitetail herds in the country. OTC license, huge public land.", difficulty: "otc" },
};

const STATE_REGIONS: Record<string, keyof typeof REGIONAL_OTC_HUNTS> = {
  GA: "southeast", FL: "southeast", SC: "southeast", NC: "southeast", AL: "southeast", MS: "southeast", TN: "southeast", VA: "southeast", AR: "southeast",
  TX: "south", OK: "south", LA: "south", KY: "south",
  SD: "midwest", ND: "midwest", NE: "midwest", KS: "midwest", IA: "midwest", MO: "midwest", MN: "midwest", WI: "midwest", IL: "midwest", IN: "midwest", OH: "midwest", MI: "midwest",
  ID: "west", OR: "west", WA: "northwest", MT: "northwest", AK: "northwest",
  NV: "southwest", AZ: "southwest", NM: "southwest", UT: "southwest",
  WY: "mountain", CO: "mountain",
  CA: "west",
  NY: "northeast", PA: "northeast", VT: "northeast", NH: "northeast", ME: "northeast", MA: "northeast", CT: "northeast", RI: "northeast", NJ: "northeast", DE: "northeast", MD: "northeast", WV: "northeast",
};

const ASPIRATIONAL_HUNTS: Record<string, InspireApiHunt> = {
  freezer: { species: "Rocky Mountain Elk", state: "Idaho", tagline: "OTC bull elk tags available statewide — no draw, no points. A 5-day camp in the Frank Church Wilderness.", difficulty: "otc", yearsToExpect: "This year", hook: "Over-the-counter. No waiting. Just buy the license and go." },
  trophy: { species: "Rocky Mountain Bighorn Sheep", state: "Nevada", tagline: "Nevada issues more bighorn sheep tags than any other state. A true once-in-a-lifetime trophy hunt.", difficulty: "draw", yearsToExpect: "8-15 years", hook: "Start your points today. Nevada is the best NR sheep state in the country." },
  lifetime: { species: "Desert Bighorn Sheep", state: "Arizona", tagline: "Arizona bighorn sheep is the pinnacle of North American big game hunting. Record-class rams in the Sonoran Desert.", difficulty: "draw", yearsToExpect: "15-25 years", hook: "Apply every year. When you draw, it'll be the hunt of your life." },
  balanced: { species: "Bull Elk", state: "Colorado", tagline: "Colorado has the largest elk population on earth. Preference points grow value every year — many units draw in 5-7 years.", difficulty: "draw", yearsToExpect: "3-7 years", hook: "Best ROI in western big game. Start accumulating points now." },
};

function StepPoints({
  hasPoints,
  setHasPoints,
  speciesSlugs,
  speciesList,
  points,
  setPoints,
  homeState,
  setHomeState,
}: {
  hasPoints: boolean | null;
  setHasPoints: (v: boolean) => void;
  speciesSlugs: string[];
  speciesList: SpeciesOption[];
  points: Record<string, number>;
  setPoints: (p: Record<string, number>) => void;
  homeState: string;
  setHomeState: (s: string) => void;
}) {
  const speciesMap = new Map(speciesList.map((s) => [s.slug, s.name]));

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        A little about you
      </h2>
      <p className="mt-2 text-brand-sage">
        Your state of residence affects draw odds — residents often have different odds than nonresidents.
      </p>

      {/* Home state */}
      <div className="mt-6">
        <label className="block text-sm font-semibold text-brand-bark dark:text-brand-cream mb-2">
          Where do you live?
        </label>
        <select
          value={homeState}
          onChange={(e) => setHomeState(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-sm text-brand-bark dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30 focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
        >
          <option value="">Select your home state...</option>
          {US_STATES.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {/* Points divider */}
      <div className="mt-8 border-t border-brand-sage/10 pt-6 dark:border-brand-sage/20">
        <h3 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
          Do you have any points?
        </h3>
        <p className="mt-1 text-sm text-brand-sage">
          Bonus or preference points from previous applications.
        </p>
      </div>
      <div className="mt-6 flex gap-3">
        {([true, false] as const).map((val) => (
          <button
            key={String(val)}
            onClick={() => setHasPoints(val)}
            className={cn(
              "rounded-xl border px-6 py-3 text-sm font-semibold transition-all",
              hasPoints === val
                ? "border-brand-forest bg-brand-forest text-white dark:border-brand-sage dark:bg-brand-sage"
                : "border-brand-sage/20 text-brand-bark hover:border-brand-forest dark:text-brand-cream dark:hover:border-brand-sage"
            )}
          >
            {val ? "Yes" : "No"}
          </button>
        ))}
      </div>

      {hasPoints && (
        <div className="mt-6 space-y-4">
          <p className="text-sm font-medium text-brand-bark dark:text-brand-cream">
            How many points do you have for each species?
          </p>
          {speciesSlugs.map((slug) => {
            const name = speciesMap.get(slug) ?? slug;
            return (
              <div key={slug} className="flex items-center gap-3">
                <label className="w-40 shrink-0 text-sm text-brand-sage">
                  {name}
                </label>
                <input
                  type="number"
                  min={0}
                  max={30}
                  value={points[slug] ?? 0}
                  onChange={(e) =>
                    setPoints({
                      ...points,
                      [slug]: parseInt(e.target.value, 10) || 0,
                    })
                  }
                  className="w-20 rounded-lg border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30 focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StepMotivation({
  selected,
  onSelect,
}: {
  selected: Motivation | null;
  onSelect: (m: Motivation) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        What drives you?
      </h2>
      <p className="mt-2 text-brand-sage">
        This helps us prioritize opportunities for you.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {MOTIVATIONS.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => onSelect(m.key)}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                selected === m.key
                  ? "border-brand-forest bg-brand-forest/5 shadow-md dark:border-brand-sage dark:bg-brand-sage/10"
                  : "border-brand-sage/20 hover:border-brand-forest hover:shadow-sm dark:hover:border-brand-sage"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  selected === m.key
                    ? "bg-brand-forest text-white dark:bg-brand-sage"
                    : "bg-brand-sage/10 text-brand-sage"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-brand-bark dark:text-brand-cream">
                  {m.label}
                </p>
                <p className="mt-0.5 text-sm text-brand-sage">
                  {m.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inspire Me Step Components
// ---------------------------------------------------------------------------

function InspireHomeState({
  homeState,
  setHomeState,
}: {
  homeState: string;
  setHomeState: (s: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        Where do you live?
      </h2>
      <p className="mt-2 text-brand-sage">
        We&apos;ll find hunts based on your home region and residency.
      </p>
      <div className="mt-6">
        <select
          value={homeState}
          onChange={(e) => setHomeState(e.target.value)}
          className="w-full max-w-xs rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-sm text-brand-bark dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30 focus:border-brand-forest focus:outline-none focus:ring-1 focus:ring-brand-forest"
        >
          <option value="">Select your home state...</option>
          {US_STATES.map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

function InspireMotivation({
  selected,
  onSelect,
}: {
  selected: Motivation | null;
  onSelect: (m: Motivation) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        What matters most?
      </h2>
      <p className="mt-2 text-brand-sage">
        Tell us what kind of experience you&apos;re after.
      </p>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {MOTIVATIONS.map((m) => {
          const Icon = m.icon;
          return (
            <button
              key={m.key}
              onClick={() => onSelect(m.key)}
              className={cn(
                "flex items-start gap-4 rounded-xl border p-4 text-left transition-all",
                selected === m.key
                  ? "border-brand-forest bg-brand-forest/5 shadow-md dark:border-brand-sage dark:bg-brand-sage/10"
                  : "border-brand-sage/20 hover:border-brand-forest hover:shadow-sm dark:hover:border-brand-sage"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  selected === m.key
                    ? "bg-brand-forest text-white dark:bg-brand-sage"
                    : "bg-brand-sage/10 text-brand-sage"
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-brand-bark dark:text-brand-cream">
                  {m.label}
                </p>
                <p className="mt-0.5 text-sm text-brand-sage">
                  {m.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function InspireResults({
  homeState,
  motivation,
  onExploreAll,
}: {
  homeState: string;
  motivation: Motivation;
  onExploreAll: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [otcHunt, setOtcHunt] = useState<InspireApiHunt | null>(null);
  const [dreamHunt, setDreamHunt] = useState<InspireApiHunt | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchInspiration() {
      setLoading(true);
      try {
        const res = await fetch("/api/v1/inspire-me", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ homeState, motivation }),
        });
        if (!res.ok) throw new Error("API error");
        const data = await res.json() as { huntThisFall: InspireApiHunt; fiveYearDream: InspireApiHunt };
        if (!cancelled) {
          setOtcHunt(data.huntThisFall);
          setDreamHunt(data.fiveYearDream);
        }
      } catch {
        // Fall back to curated data
        if (!cancelled) {
          const region = STATE_REGIONS[homeState] ?? "west";
          const fallbackOtc = REGIONAL_OTC_HUNTS[region] ?? REGIONAL_OTC_HUNTS["west"]!;
          const fallbackDream = ASPIRATIONAL_HUNTS[motivation] ?? null;
          setOtcHunt(fallbackOtc);
          setDreamHunt(fallbackDream);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchInspiration();
    return () => { cancelled = true; };
  }, [homeState, motivation]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Crosshair className="h-12 w-12 animate-spin text-brand-forest dark:text-brand-sage" />
        <p className="mt-4 text-lg font-semibold text-brand-bark dark:text-brand-cream animate-pulse">
          Finding your perfect hunt...
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        Your Hunting Inspiration
      </h2>
      <p className="mt-2 text-brand-sage">
        Based on where you live and what matters to you.
      </p>

      {/* Card 1: Hunt This Fall */}
      {otcHunt && (
        <div className="mt-6 rounded-xl border-2 border-green-500/30 bg-green-50/50 p-6 dark:border-green-500/20 dark:bg-green-950/20">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-green-700 dark:text-green-400">
            <MapPin className="h-4 w-4" />
            Hunt This Fall
          </div>
          <h3 className="mt-3 text-xl font-bold text-brand-bark dark:text-brand-cream">
            {otcHunt.species} — {otcHunt.state}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-brand-sage">
            {otcHunt.tagline}
          </p>
          <span className="mt-3 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
            {otcHunt.difficulty === "otc" ? "No draw required" : "Easy draw"}
          </span>
        </div>
      )}

      {/* Card 2: Your 5-Year Dream */}
      {dreamHunt && (
        <div className="mt-4 rounded-xl border-2 border-amber-500/30 bg-amber-50/50 p-6 dark:border-amber-500/20 dark:bg-amber-950/20">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">
            <Mountain className="h-4 w-4" />
            Your 5-Year Dream
          </div>
          <h3 className="mt-3 text-xl font-bold text-brand-bark dark:text-brand-cream">
            {dreamHunt.species} — {dreamHunt.state}
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-brand-sage">
            {dreamHunt.tagline}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="inline-block rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
              Start building points today
            </span>
            {dreamHunt.yearsToExpect && (
              <span className="text-xs text-brand-sage">
                Est. {dreamHunt.yearsToExpect} to draw
              </span>
            )}
          </div>
          {dreamHunt.hook && (
            <p className="mt-2 text-sm font-medium italic text-amber-800 dark:text-amber-300">
              {dreamHunt.hook}
            </p>
          )}
        </div>
      )}

      {/* CTAs */}
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Link
          href="/signup"
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[8px] bg-gradient-cta px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
        >
          Build Your Full Strategy
          <ArrowRight className="h-4 w-4" />
        </Link>
        <button
          onClick={onExploreAll}
          className="text-sm font-medium text-brand-sage transition-colors hover:text-brand-bark dark:hover:text-brand-cream"
        >
          Explore All Hunts
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step Components (continued)
// ---------------------------------------------------------------------------

function StepResults({
  results,
  loading,
}: {
  results: SimulatorResults | null;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <Crosshair className="h-12 w-12 animate-spin text-brand-forest dark:text-brand-sage" />
        <p className="mt-4 text-lg font-semibold text-brand-bark dark:text-brand-cream animate-pulse">
          Calculating your draw strategy...
        </p>
        <p className="mt-2 text-sm text-brand-sage">
          Analyzing odds across thousands of hunt units
        </p>
      </div>
    );
  }

  if (!results || results.results.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
          No draw data found for your selections.
        </p>
        <p className="mt-2 text-sm text-brand-sage">
          Try broadening your species or state selections.
        </p>
      </div>
    );
  }

  const VISIBLE_COUNT = 3;
  const visible = results.results.slice(0, VISIBLE_COUNT);
  const blurred = results.results.slice(VISIBLE_COUNT);
  const remainingCount = Math.max(0, results.total - VISIBLE_COUNT);

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        Your Top Draw Opportunities
      </h2>
      <p className="mt-2 text-brand-sage">
        Based on your preferences, here are your best bets.
      </p>

      {/* Visible results */}
      <div className="mt-6 space-y-3">
        {visible.map((r, i) => (
          <div
            key={`${r.state}-${r.species}-${r.unit}-${i}`}
            className="rounded-xl border border-brand-sage/10 bg-white p-4 shadow-sm dark:bg-brand-bark dark:border-brand-sage/20"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-forest/10 text-brand-forest dark:bg-brand-sage/20 dark:text-brand-sage">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-semibold text-brand-bark dark:text-brand-cream">
                    {r.speciesName ?? "Unknown"} — {r.stateName ?? r.state}
                  </p>
                  <p className="text-sm text-brand-sage">
                    Unit: {r.unit} {r.year ? `(${r.year})` : ""}
                    {r.residentType && (
                      <span className={cn(
                        "ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase",
                        r.residentType === "resident"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400"
                      )}>
                        {r.residentType === "resident" ? "Resident" : "NR"}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-brand-forest dark:text-brand-sage">
                  {formatDrawRate(r.drawRate)}
                </p>
                <p className="text-xs text-brand-sage">draw rate</p>
              </div>
            </div>
            {r.minPoints != null && (
              <p className="mt-2 text-xs text-brand-sage">
                Min points drawn: <span className="font-semibold">{r.minPoints}</span>
                {r.totalApplicants != null && (
                  <> &middot; {r.totalApplicants} applicants</>
                )}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Blurred/locked results */}
      {blurred.length > 0 && (
        <div className="relative mt-4">
          <div className="space-y-3 select-none" aria-hidden="true">
            {blurred.slice(0, 3).map((r, i) => (
              <div
                key={`blur-${i}`}
                className="rounded-xl border border-brand-sage/10 bg-white p-4 blur-sm dark:bg-brand-bark dark:border-brand-sage/20"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-lg bg-brand-sage/10" />
                    <div>
                      <p className="font-semibold text-brand-bark dark:text-brand-cream">
                        {r.speciesName ?? "Species"} — {r.stateName ?? "State"}
                      </p>
                      <p className="text-sm text-brand-sage">Unit: {r.unit}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-brand-forest dark:text-brand-sage">
                      {formatDrawRate(r.drawRate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lock overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-xl bg-brand-cream/70 dark:bg-brand-forest/70 backdrop-blur-sm">
            <Lock className="h-8 w-8 text-brand-forest dark:text-brand-sage" />
            <p className="mt-2 text-sm font-medium text-brand-bark dark:text-brand-cream">
              +{remainingCount} more opportunities locked
            </p>
          </div>
        </div>
      )}

      {/* CTA */}
      <div className="mt-8 rounded-xl border border-brand-forest/20 bg-brand-forest/5 p-6 text-center dark:border-brand-sage/20 dark:bg-brand-sage/10">
        <h3 className="text-lg font-bold text-brand-bark dark:text-brand-cream">
          Unlock Your Full Draw Playbook
        </h3>
        <p className="mt-1 text-sm text-brand-sage">
          Create a free account to see all results, point forecasts, and
          personalized strategy recommendations.
        </p>
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/signup"
            className="inline-flex min-h-[44px] items-center gap-2 rounded-[8px] bg-gradient-cta px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg"
          >
            Sign Up Free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-brand-sage hover:text-brand-bark transition-colors dark:hover:text-brand-cream"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard
// ---------------------------------------------------------------------------

export default function DrawSimulatorPage() {
  const [step, setStep] = useState(1);

  // Data fetched from APIs
  const [speciesList, setSpeciesList] = useState<SpeciesOption[]>([]);
  const [stateList, setStateList] = useState<StateOption[]>([]);

  // User selections
  const [selectedSpecies, setSelectedSpecies] = useState<Set<string>>(
    new Set()
  );
  const [selectedStates, setSelectedStates] = useState<Set<string>>(new Set());
  const [weapon, setWeapon] = useState("any");
  const [hasPoints, setHasPoints] = useState<boolean | null>(null);
  const [points, setPoints] = useState<Record<string, number>>({});
  const [homeState, setHomeState] = useState<string>("");
  const [motivation, setMotivation] = useState<Motivation | null>(null);

  // Smart suggestion reasons (state code → reason string)
  const [suggestedReasons, setSuggestedReasons] = useState<Map<string, string>>(
    new Map()
  );

  // Inspire Me flow
  const [inspireMode, setInspireMode] = useState(false);
  const [inspireStep, setInspireStep] = useState(1);

  // Results
  const [results, setResults] = useState<SimulatorResults | null>(null);
  const [resultsLoading, setResultsLoading] = useState(false);

  // All species (unfiltered) for fallback
  const [allSpecies, setAllSpecies] = useState<SpeciesOption[]>([]);

  // Fetch species & states on mount
  useEffect(() => {
    fetch("/api/v1/explore/species")
      .then((r) => r.json())
      .then((d: { species: SpeciesOption[] }) => {
        setSpeciesList(d.species ?? []);
        setAllSpecies(d.species ?? []);
      })
      .catch(() => {});

    fetch("/api/v1/explore/states")
      .then((r) => r.json())
      .then((d: { states: StateOption[] }) => setStateList(d.states ?? []))
      .catch(() => {});
  }, []);

  // When states change, refetch eligible species for those states
  useEffect(() => {
    if (selectedStates.size === 0) {
      // No states selected — show all species
      setSpeciesList(allSpecies);
      return;
    }

    fetch("/api/v1/explore/species-for-states", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ states: Array.from(selectedStates) }),
    })
      .then((r) => r.json())
      .then((d: { species: SpeciesOption[] }) => {
        if (d.species && d.species.length > 0) {
          setSpeciesList(d.species);
          // Remove any selected species no longer eligible
          const eligible = new Set(d.species.map((s) => s.slug));
          setSelectedSpecies((prev) => {
            const next = new Set([...prev].filter((s) => eligible.has(s)));
            return next.size === prev.size ? prev : next;
          });
        } else {
          // Fallback: show all species if API returns empty
          setSpeciesList(allSpecies);
        }
      })
      .catch(() => {
        setSpeciesList(allSpecies);
      });
  }, [selectedStates, allSpecies]);

  const toggleSpecies = useCallback((slug: string) => {
    setSelectedSpecies((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }, []);

  const toggleState = useCallback((code: string) => {
    setSelectedStates((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
    // Clear the reason for a manually toggled state
    setSuggestedReasons((prev) => {
      if (!prev.has(code)) return prev;
      const next = new Map(prev);
      next.delete(code);
      return next;
    });
  }, []);

  const selectSmartStates = useCallback(() => {
    const slugs = [...selectedSpecies];
    if (slugs.length === 0) {
      // No species selected — select all draw states (original fallback)
      setSelectedStates(
        new Set(stateList.filter((s) => s.hasDrawSystem).map((s) => s.code))
      );
      setSuggestedReasons(new Map());
      return;
    }

    const ranked = getBestStatesForSpecies(slugs);
    const suggestedCodes = new Set<string>();
    const reasons = new Map<string, string>();

    // Select tier-1 and tier-2 states that exist in our state list
    // For exclusive species (caribou, javelina) this naturally constrains to AK/AZ only
    for (const { code, tier, reasons: stateReasons } of ranked) {
      if (tier <= 2 && stateList.some((s) => s.code === code)) {
        suggestedCodes.add(code);
        // Use first reason as the tooltip (trim species prefix for display)
        const firstReason = stateReasons[0];
        if (firstReason) {
          const display = firstReason.includes(": ")
            ? firstReason.split(": ").slice(1).join(": ")
            : firstReason;
          reasons.set(code, display);
        }
      }
    }

    setSelectedStates(suggestedCodes);
    setSuggestedReasons(reasons);
  }, [selectedSpecies, stateList]);

  const canNext = (): boolean => {
    switch (step) {
      case 1:
        return selectedSpecies.size > 0;
      case 2:
        return selectedStates.size > 0;
      case 3:
        return weapon !== "";
      case 4:
        return hasPoints !== null;
      case 5:
        return motivation !== null;
      default:
        return false;
    }
  };

  const fetchResults = useCallback(async () => {
    setResultsLoading(true);
    setResults(null);

    // Artificial delay for gamified feel
    await new Promise((resolve) => setTimeout(resolve, 2500));

    try {
      const res = await fetch("/api/v1/draw-simulator/results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          species: Array.from(selectedSpecies),
          states: Array.from(selectedStates),
          weapon,
          motivation,
          points,
          homeState: homeState || null,
        }),
      });
      const data = (await res.json()) as SimulatorResults;
      setResults(data);
    } catch {
      setResults({ results: [], total: 0 });
    } finally {
      setResultsLoading(false);
    }
  }, [selectedSpecies, selectedStates, weapon, motivation, points]);

  const goNext = () => {
    if (step < TOTAL_STEPS) {
      const nextStep = step + 1;
      setStep(nextStep);
      if (nextStep === TOTAL_STEPS) {
        fetchResults();
      }
    }
  };

  const goBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="min-h-screen bg-brand-cream dark:bg-brand-forest">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 border-b border-brand-sage/10 bg-brand-cream/90 backdrop-blur-lg dark:bg-brand-forest/90 dark:border-brand-sage/20">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 md:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Target className="h-6 w-6 text-brand-forest dark:text-brand-cream" />
            <span className="text-lg font-bold text-brand-forest dark:text-brand-cream">
              HuntLogic
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-brand-bark transition-colors hover:text-brand-forest dark:text-brand-cream/70 dark:hover:text-brand-cream"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="rounded-[8px] bg-gradient-cta px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md min-h-[40px] flex items-center"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* Wizard */}
      <div className="mx-auto max-w-2xl px-4 py-8 md:px-6 md:py-12">
        {/* Progress */}
        {!inspireMode && <ProgressBar step={step} />}
        {inspireMode && inspireStep < 3 && (
          <div className="w-full">
            <div className="mb-2 flex items-center justify-between text-xs font-medium text-brand-sage">
              <span>Step {inspireStep} of 2</span>
              <span>{Math.round((inspireStep / 2) * 100)}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-brand-sage/10">
              <div
                className="h-full rounded-full bg-gradient-cta transition-all duration-500 ease-out"
                style={{ width: `${(inspireStep / 2) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Step content with fade transition */}
        <div key={inspireMode ? `inspire-${inspireStep}` : step} className="mt-8 draw-wizard-fade-in">
          {step === 1 && !inspireMode && (
            <div>
              {/* Entry path choice */}
              <div className="mb-8 grid gap-3 sm:grid-cols-2">
                <button
                  className="flex items-center gap-3 rounded-xl border-2 border-brand-forest/20 bg-brand-forest/5 p-4 text-left transition-all dark:border-brand-sage/20 dark:bg-brand-sage/10"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-forest text-white dark:bg-brand-sage">
                    <Crosshair className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-bark dark:text-brand-cream">
                      I know what I want to hunt
                    </p>
                    <p className="mt-0.5 text-xs text-brand-sage">
                      Pick species, states, and weapon
                    </p>
                  </div>
                </button>
                <button
                  onClick={() => { setInspireMode(true); setInspireStep(1); }}
                  className="flex items-center gap-3 rounded-xl border border-brand-sage/20 p-4 text-left transition-all hover:border-brand-forest hover:shadow-sm dark:hover:border-brand-sage"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-sage/10 text-brand-sage">
                    <Compass className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-brand-bark dark:text-brand-cream">
                      Inspire me — I&apos;m not sure
                    </p>
                    <p className="mt-0.5 text-xs text-brand-sage">
                      2 questions, instant recommendations
                    </p>
                  </div>
                </button>
              </div>
              <StepSpecies
                speciesList={speciesList}
                selected={selectedSpecies}
                toggle={toggleSpecies}
              />
            </div>
          )}
          {inspireMode && inspireStep === 1 && (
            <InspireHomeState homeState={homeState} setHomeState={setHomeState} />
          )}
          {inspireMode && inspireStep === 2 && (
            <InspireMotivation selected={motivation} onSelect={setMotivation} />
          )}
          {inspireMode && inspireStep === 3 && motivation && (
            <InspireResults
              homeState={homeState}
              motivation={motivation}
              onExploreAll={() => {
                setInspireMode(false);
                setInspireStep(1);
                setStep(1);
              }}
            />
          )}
          {step === 2 && (
            <StepStates
              stateList={stateList}
              selected={selectedStates}
              toggle={toggleState}
              selectSmart={selectSmartStates}
              suggestedReasons={suggestedReasons}
              speciesContext={getSpeciesStateContext([...selectedSpecies])}
              buttonLabel={
                selectedSpecies.size > 0
                  ? `✦ AI Pick: Best States`
                  : "Show me the best options"
              }
            />
          )}
          {step === 3 && <StepWeapon selected={weapon} onSelect={setWeapon} />}
          {step === 4 && (
            <StepPoints
              hasPoints={hasPoints}
              setHasPoints={setHasPoints}
              speciesSlugs={Array.from(selectedSpecies)}
              speciesList={speciesList}
              points={points}
              setPoints={setPoints}
              homeState={homeState}
              setHomeState={setHomeState}
            />
          )}
          {step === 5 && (
            <StepMotivation selected={motivation} onSelect={setMotivation} />
          )}
          {step === 6 && (
            <StepResults results={results} loading={resultsLoading} />
          )}
        </div>

        {/* Navigation */}
        {!inspireMode && step < TOTAL_STEPS && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={goBack}
              disabled={step === 1}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[8px] px-4 py-2.5 text-sm font-medium transition-all",
                step === 1
                  ? "cursor-not-allowed text-brand-sage/40"
                  : "text-brand-bark hover:bg-brand-sage/10 dark:text-brand-cream"
              )}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={goNext}
              disabled={!canNext()}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[8px] px-6 py-2.5 text-sm font-semibold text-white transition-all",
                canNext()
                  ? "bg-gradient-cta shadow-md hover:-translate-y-0.5 hover:shadow-lg"
                  : "cursor-not-allowed bg-brand-sage/30"
              )}
            >
              {step === 5 ? "See My Results" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Inspire Me navigation */}
        {inspireMode && inspireStep < 3 && (
          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => {
                if (inspireStep === 1) {
                  setInspireMode(false);
                  setInspireStep(1);
                } else {
                  setInspireStep(inspireStep - 1);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-[8px] px-4 py-2.5 text-sm font-medium text-brand-bark transition-all hover:bg-brand-sage/10 dark:text-brand-cream"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <button
              onClick={() => setInspireStep(inspireStep + 1)}
              disabled={
                (inspireStep === 1 && !homeState) ||
                (inspireStep === 2 && !motivation)
              }
              className={cn(
                "inline-flex items-center gap-1.5 rounded-[8px] px-6 py-2.5 text-sm font-semibold text-white transition-all",
                (inspireStep === 1 && homeState) || (inspireStep === 2 && motivation)
                  ? "bg-gradient-cta shadow-md hover:-translate-y-0.5 hover:shadow-lg"
                  : "cursor-not-allowed bg-brand-sage/30"
              )}
            >
              {inspireStep === 2 ? "Inspire" : "Next"}
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Back to start on results page */}
        {step === TOTAL_STEPS && !resultsLoading && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setStep(1)}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-sage hover:text-brand-bark transition-colors dark:hover:text-brand-cream"
            >
              <ArrowLeft className="h-4 w-4" />
              Start over
            </button>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes drawWizardFadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .draw-wizard-fade-in {
          animation: drawWizardFadeIn 0.3s ease-out;
        }
      `}} />
    </div>
  );
}
