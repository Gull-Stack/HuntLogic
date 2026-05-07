"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Link from "next/link";

const HuntMap = dynamic(() => import("@/components/map/HuntMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center rounded-xl bg-brand-sage/10 dark:bg-brand-sage/20">
      <p className="text-sm text-brand-sage motion-safe:animate-pulse">
        Loading map...
      </p>
    </div>
  ),
});

interface StateOption {
  code: string;
  name: string;
}

interface SpeciesOption {
  slug: string;
  commonName: string;
}

export default function MapPage() {
  const [stateFilter, setStateFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [statesOptions, setStatesOptions] = useState<StateOption[]>([]);
  const [speciesOptions, setSpeciesOptions] = useState<SpeciesOption[]>([]);

  const fetchOptions = useCallback(async () => {
    try {
      const [statesRes, speciesRes] = await Promise.all([
        fetch("/api/v1/explore/states"),
        fetch("/api/v1/explore/species"),
      ]);
      if (statesRes.ok) {
        const data = await statesRes.json();
        setStatesOptions(data.states ?? []);
      }
      if (speciesRes.ok) {
        const data = await speciesRes.json();
        setSpeciesOptions(data.species ?? []);
      }
    } catch {
      // Silent fail
    }
  }, []);

  useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return (
    <div className="flex h-[calc(100vh-120px)] flex-col gap-3 md:h-[calc(100vh-80px)]">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/explore"
          className="flex min-h-[44px] items-center gap-1.5 rounded-[8px] border border-brand-sage/20 px-3 py-2 text-sm font-medium text-brand-sage transition-colors hover:bg-brand-sage/5 dark:border-brand-sage/30"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to List
        </Link>

        <div className="relative">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="min-h-[44px] appearance-none rounded-[10px] border border-brand-sage/20 bg-white pl-3 pr-8 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream"
          >
            <option value="">All States</option>
            {statesOptions.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage" />
        </div>

        <div className="relative">
          <select
            value={speciesFilter}
            onChange={(e) => setSpeciesFilter(e.target.value)}
            className="min-h-[44px] appearance-none rounded-[10px] border border-brand-sage/20 bg-white pl-3 pr-8 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream"
          >
            <option value="">All Species</option>
            {speciesOptions.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.commonName}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage" />
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 overflow-hidden rounded-xl border border-brand-sage/10 shadow-sm dark:border-brand-sage/20">
        <HuntMap
          stateFilter={stateFilter || undefined}
          speciesFilter={speciesFilter || undefined}
        />
      </div>
    </div>
  );
}
