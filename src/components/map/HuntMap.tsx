"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Layers, X } from "lucide-react";

interface HuntUnit {
  unitCode: string;
  publicLandPct: number | null;
  terrainClass: string | null;
  elevationMin: number | null;
  elevationMax: number | null;
  accessNotes: string | null;
  species: string[];
  lat: number | null;
  lng: number | null;
}

interface HuntMapProps {
  stateFilter?: string;
  speciesFilter?: string;
}

function getPublicLandColor(pct: number | null): string {
  if (pct === null) return "#9CA3AF"; // grey
  if (pct >= 70) return "#22C55E"; // green
  if (pct >= 30) return "#EAB308"; // yellow
  return "#EF4444"; // red
}

export default function HuntMap({ stateFilter, speciesFilter }: HuntMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [units, setUnits] = useState<HuntUnit[]>([]);
  const [showLayers, setShowLayers] = useState(false);
  const [activeLayer, setActiveLayer] = useState<"public_land" | "terrain" | "draw_odds">("public_land");
  const [selectedUnit, setSelectedUnit] = useState<HuntUnit | null>(null);

  const fetchUnits = useCallback(async () => {
    const params = new URLSearchParams();
    if (stateFilter) params.set("state", stateFilter);
    if (speciesFilter) params.set("species", speciesFilter);

    try {
      const res = await fetch(`/api/v1/map/units?${params}`);
      if (res.ok) {
        const data = await res.json();
        setUnits(data.units ?? []);
      }
    } catch {
      // Silent fail
    }
  }, [stateFilter, speciesFilter]);

  useEffect(() => {
    fetchUnits();
  }, [fetchUnits]);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    let cancelled = false;

    (async () => {
      const maplibregl = (await import("maplibre-gl")).default;
      // @ts-expect-error — maplibre's CSS file has no type declaration; runtime side-effect import.
      await import("maplibre-gl/dist/maplibre-gl.css");

      if (cancelled || !mapContainer.current) return;

      const tileKey = process.env.NEXT_PUBLIC_MAP_TILES_KEY;
      const style = tileKey
        ? `https://tiles.stadiamaps.com/styles/outdoors.json?api_key=${tileKey}`
        : {
            version: 8 as const,
            sources: {
              osm: {
                type: "raster" as const,
                tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
                tileSize: 256,
                attribution: "&copy; OpenStreetMap contributors",
              },
            },
            layers: [
              { id: "osm", type: "raster" as const, source: "osm" },
            ],
          };

      const map = new maplibregl.Map({
        container: mapContainer.current!,
        style,
        center: [-105.5, 39.5],
        zoom: 5,
      });

      map.addControl(new maplibregl.NavigationControl(), "top-left");

      map.on("load", () => {
        if (!cancelled) {
          mapRef.current = map;
          setMapLoaded(true);
        }
      });
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Add markers when map and units are ready
  useEffect(() => {
    if (!mapRef.current || !mapLoaded || units.length === 0) return;

    // maplibre-gl is an ESM-default-only export; eslint/tsc can't reify the
    // .default member on the namespace type, so widen and trust the runtime.
    let maplibregl: Awaited<ReturnType<typeof loadMaplibre>> | null = null;
    async function loadMaplibre() {
      return (await import("maplibre-gl")).default;
    }

    (async () => {
      maplibregl = (await import("maplibre-gl")).default;
      const map = mapRef.current!;

      // Remove existing markers
      const existingMarkers = document.querySelectorAll(".hunt-unit-marker");
      existingMarkers.forEach((m) => m.remove());

      for (const unit of units) {
        if (unit.lat == null || unit.lng == null) continue;

        const el = document.createElement("div");
        el.className = "hunt-unit-marker";
        el.style.width = "14px";
        el.style.height = "14px";
        el.style.borderRadius = "50%";
        el.style.backgroundColor = getPublicLandColor(unit.publicLandPct);
        el.style.border = "2px solid white";
        el.style.boxShadow = "0 1px 3px rgba(0,0,0,0.3)";
        el.style.cursor = "pointer";

        el.addEventListener("click", () => {
          setSelectedUnit(unit);
        });

        new maplibregl!.Marker({ element: el })
          .setLngLat([unit.lng, unit.lat])
          .addTo(map);
      }

      // Fit bounds to units
      if (units.length > 1) {
        const lngs = units.filter((u) => u.lng != null).map((u) => u.lng!);
        const lats = units.filter((u) => u.lat != null).map((u) => u.lat!);
        if (lngs.length > 0) {
          map.fitBounds(
            [
              [Math.min(...lngs) - 0.5, Math.min(...lats) - 0.5],
              [Math.max(...lngs) + 0.5, Math.max(...lats) + 0.5],
            ],
            { padding: 50, maxZoom: 10 }
          );
        }
      }
    })();
  }, [mapLoaded, units, activeLayer]);

  return (
    <div className="relative h-full w-full">
      {/* Map container */}
      <div ref={mapContainer} className="h-full w-full rounded-xl" />

      {/* Layer toggle */}
      <div className="absolute right-3 top-3 z-10">
        <button
          onClick={() => setShowLayers(!showLayers)}
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md transition-colors hover:bg-gray-50 dark:bg-brand-bark dark:hover:bg-brand-bark/80"
        >
          <Layers className="h-5 w-5 text-brand-bark dark:text-brand-cream" />
        </button>

        {showLayers && (
          <div className="mt-2 w-48 rounded-xl border border-brand-sage/10 bg-white p-3 shadow-lg dark:border-brand-sage/20 dark:bg-brand-bark">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-brand-sage">
              Layers
            </p>
            {(
              [
                { key: "public_land", label: "Public Land %" },
                { key: "terrain", label: "Terrain Class" },
                { key: "draw_odds", label: "Draw Odds" },
              ] as const
            ).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveLayer(key)}
                className={cn(
                  "flex min-h-[36px] w-full items-center rounded-lg px-2 py-1.5 text-left text-sm transition-colors",
                  activeLayer === key
                    ? "bg-brand-forest/10 font-medium text-brand-forest dark:bg-brand-sage/20 dark:text-brand-cream"
                    : "text-brand-bark hover:bg-brand-sage/5 dark:text-brand-cream/70"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 z-10 rounded-xl border border-brand-sage/10 bg-white/90 px-3 py-2 shadow-sm backdrop-blur dark:border-brand-sage/20 dark:bg-brand-bark/90">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-sage">
          Public Land
        </p>
        <div className="flex items-center gap-3">
          {[
            { color: "#22C55E", label: ">70%" },
            { color: "#EAB308", label: "30-70%" },
            { color: "#EF4444", label: "<30%" },
            { color: "#9CA3AF", label: "N/A" },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1">
              <div
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-brand-sage">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Unit popup */}
      {selectedUnit && (
        <div className="absolute right-3 top-16 z-20 w-64 rounded-xl border border-brand-sage/10 bg-white p-4 shadow-lg dark:border-brand-sage/20 dark:bg-brand-bark">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-bold text-brand-bark dark:text-brand-cream">
              Unit {selectedUnit.unitCode}
            </h4>
            <button
              onClick={() => setSelectedUnit(null)}
              className="flex h-6 w-6 items-center justify-center rounded text-brand-sage hover:bg-brand-sage/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-1 text-xs text-brand-sage">
            <p>
              <span className="font-medium">Public Land:</span>{" "}
              {selectedUnit.publicLandPct != null
                ? `${selectedUnit.publicLandPct}%`
                : "Unknown"}
            </p>
            <p>
              <span className="font-medium">Terrain:</span>{" "}
              {selectedUnit.terrainClass ?? "Unknown"}
            </p>
            <p>
              <span className="font-medium">Elevation:</span>{" "}
              {selectedUnit.elevationMin && selectedUnit.elevationMax
                ? `${selectedUnit.elevationMin.toLocaleString()}-${selectedUnit.elevationMax.toLocaleString()} ft`
                : "Unknown"}
            </p>
            {selectedUnit.species.length > 0 && (
              <p>
                <span className="font-medium">Species:</span>{" "}
                {selectedUnit.species.join(", ")}
              </p>
            )}
            {selectedUnit.accessNotes && (
              <p>
                <span className="font-medium">Access:</span>{" "}
                {selectedUnit.accessNotes}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
