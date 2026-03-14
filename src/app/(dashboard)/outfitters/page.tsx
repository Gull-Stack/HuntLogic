"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Star, ExternalLink, Search, ChevronDown } from "lucide-react";
import Link from "next/link";

interface Outfitter {
  id: string;
  name: string;
  stateCode: string;
  speciesSlugs: string[];
  huntTypes: string[];
  priceRange: string | null;
  rating: number;
  reviewCount: number;
  description: string | null;
  website: string | null;
}

export default function OutfittersPage() {
  const [outfitters, setOutfitters] = useState<Outfitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [stateFilter, setStateFilter] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [priceFilter, setPriceFilter] = useState("");
  const [stateOptions, setStateOptions] = useState<{ code: string; name: string }[]>([]);

  useEffect(() => {
    fetch("/api/v1/explore/states")
      .then((res) => (res.ok ? res.json() : { states: [] }))
      .then((data) => setStateOptions(data.states ?? []))
      .catch(() => {});
  }, []);

  const fetchOutfitters = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (stateFilter) params.set("state", stateFilter);
      if (speciesFilter) params.set("species", speciesFilter);
      if (priceFilter) params.set("priceRange", priceFilter);

      const res = await fetch(`/api/v1/outfitters?${params}`);
      if (res.ok) {
        const data = await res.json();
        setOutfitters(data.outfitters ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [stateFilter, speciesFilter, priceFilter]);

  useEffect(() => {
    fetchOutfitters();
  }, [fetchOutfitters]);

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={cn(
          "h-3.5 w-3.5",
          i < Math.round(rating)
            ? "fill-amber-400 text-amber-400"
            : "text-brand-sage/30"
        )}
      />
    ));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          Outfitter Directory
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Find guided hunt outfitters across the West
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="min-h-[44px] appearance-none rounded-[10px] border border-brand-sage/20 bg-white pl-3 pr-8 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream"
          >
            <option value="">All States</option>
            {stateOptions.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name || s.code}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage" />
        </div>

        <div className="relative">
          <select
            value={priceFilter}
            onChange={(e) => setPriceFilter(e.target.value)}
            className="min-h-[44px] appearance-none rounded-[10px] border border-brand-sage/20 bg-white pl-3 pr-8 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream"
          >
            <option value="">All Prices</option>
            <option value="budget">Budget</option>
            <option value="mid">Mid-Range</option>
            <option value="premium">Premium</option>
            <option value="luxury">Luxury</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage" />
        </div>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 rounded-xl bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20"
            />
          ))}
        </div>
      ) : outfitters.length === 0 ? (
        <div className="rounded-xl border border-brand-sage/10 bg-white p-8 text-center dark:border-brand-sage/20 dark:bg-brand-bark">
          <Search className="mx-auto h-10 w-10 text-brand-sage/30" />
          <p className="mt-3 text-sm text-brand-sage">
            No outfitters found matching your filters.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {outfitters.map((o) => (
            <Link
              key={o.id}
              href={`/outfitters/${o.id}`}
              className="rounded-xl border border-brand-sage/10 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-brand-sage/20 dark:bg-brand-bark motion-safe:hover:-translate-y-0.5"
            >
              <div className="mb-2 flex items-start justify-between">
                <h3 className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                  {o.name}
                </h3>
                <span className="rounded-full bg-brand-forest/10 px-2 py-0.5 text-xs font-medium text-brand-forest dark:bg-brand-sage/20 dark:text-brand-cream">
                  {o.stateCode}
                </span>
              </div>

              <div className="mb-2 flex items-center gap-1">
                {renderStars(o.rating)}
                <span className="ml-1 text-xs text-brand-sage">
                  ({o.reviewCount})
                </span>
              </div>

              <div className="mb-2 flex flex-wrap gap-1">
                {(o.speciesSlugs as string[]).slice(0, 3).map((s) => (
                  <span
                    key={s}
                    className="rounded-full bg-brand-sage/10 px-2 py-0.5 text-[10px] text-brand-sage dark:bg-brand-sage/20"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {o.priceRange && (
                <p className="text-xs text-brand-sage capitalize">
                  {o.priceRange} pricing
                </p>
              )}

              {o.description && (
                <p className="mt-2 text-xs text-brand-sage line-clamp-2">
                  {o.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
