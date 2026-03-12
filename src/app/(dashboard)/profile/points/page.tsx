"use client";

import { useState, useEffect } from "react";
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

interface StateGroup {
  stateCode: string;
  stateName: string;
  holdings: PointHolding[];
  totalPoints: number;
}

// Mock data for development
const mockHoldings: PointHolding[] = [
  {
    id: "ph-1", userId: "u-1", stateId: "co-001", speciesId: "elk-001",
    stateName: "Colorado", stateCode: "CO", speciesName: "Elk",
    pointType: "preference", points: 3, yearStarted: 2023, verified: false,
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
  },
  {
    id: "ph-2", userId: "u-1", stateId: "co-001", speciesId: "md-001",
    stateName: "Colorado", stateCode: "CO", speciesName: "Mule Deer",
    pointType: "preference", points: 5, yearStarted: 2021, verified: false,
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
  },
  {
    id: "ph-3", userId: "u-1", stateId: "wy-001", speciesId: "elk-001",
    stateName: "Wyoming", stateCode: "WY", speciesName: "Elk",
    pointType: "preference", points: 5, yearStarted: 2021, verified: false,
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
  },
  {
    id: "ph-4", userId: "u-1", stateId: "wy-001", speciesId: "md-001",
    stateName: "Wyoming", stateCode: "WY", speciesName: "Mule Deer",
    pointType: "preference", points: 2, yearStarted: 2024, verified: false,
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
  },
  {
    id: "ph-5", userId: "u-1", stateId: "mt-001", speciesId: "elk-001",
    stateName: "Montana", stateCode: "MT", speciesName: "Elk",
    pointType: "bonus", points: 2, yearStarted: 2024, verified: false,
    createdAt: "2026-01-01", updatedAt: "2026-01-01",
  },
];

export default function PointsPage() {
  const [holdings, setHoldings] = useState<PointHolding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedStates, setExpandedStates] = useState<Set<string>>(new Set());
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);

  // Form state for adding points
  const [newState, setNewState] = useState("");
  const [newSpecies, setNewSpecies] = useState("");
  const [newPointType, setNewPointType] = useState("preference");
  const [newPoints, setNewPoints] = useState(0);
  const [newYearStarted, setNewYearStarted] = useState(new Date().getFullYear());

  useEffect(() => {
    async function fetchHoldings() {
      try {
        const res = await fetch("/api/v1/profile/points");
        if (res.ok) {
          const data = await res.json();
          setHoldings(data.data || data);
        }
      } catch {
        setHoldings(mockHoldings);
      } finally {
        setIsLoading(false);
      }
    }
    fetchHoldings();
  }, []);

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
      prev.map((h) => (h.id === id ? { ...h, points: editValue } : h))
    );
    setEditingId(null);
  };

  const handleAddPoints = () => {
    if (!newState || !newSpecies) return;

    const newHolding: PointHolding = {
      id: `ph-${Date.now()}`,
      userId: "u-1",
      stateId: newState,
      speciesId: newSpecies,
      stateName: newState,
      stateCode: newState,
      speciesName: newSpecies,
      pointType: newPointType,
      points: newPoints,
      yearStarted: newYearStarted,
      verified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setHoldings((prev) => [...prev, newHolding]);
    setShowAddSheet(false);
    setNewState("");
    setNewSpecies("");
    setNewPoints(0);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-44 animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-64 animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-brand-sage/10" />
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
                {/* State header */}
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
                        {group.holdings.length} species, {group.totalPoints} total pts
                      </p>
                    </div>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="h-5 w-5 text-brand-sage" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-brand-sage" />
                  )}
                </button>

                {/* Species rows */}
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

                        {/* Point count / edit */}
                        {editingId === holding.id ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              value={editValue}
                              onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
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
                              onClick={() => handleEdit(holding.id, holding.points)}
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

      {/* Add Points Sheet */}
      <Sheet
        isOpen={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        title="Add Points"
        snapPoint="half"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
              State
            </label>
            <select
              value={newState}
              onChange={(e) => setNewState(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-base dark:bg-brand-bark dark:border-brand-sage/30 dark:text-brand-cream"
            >
              <option value="">Select state</option>
              <option value="CO">Colorado</option>
              <option value="WY">Wyoming</option>
              <option value="MT">Montana</option>
              <option value="ID">Idaho</option>
              <option value="NM">New Mexico</option>
              <option value="AZ">Arizona</option>
              <option value="UT">Utah</option>
              <option value="NV">Nevada</option>
              <option value="OR">Oregon</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
              Species
            </label>
            <select
              value={newSpecies}
              onChange={(e) => setNewSpecies(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-base dark:bg-brand-bark dark:border-brand-sage/30 dark:text-brand-cream"
            >
              <option value="">Select species</option>
              <option value="Elk">Elk</option>
              <option value="Mule Deer">Mule Deer</option>
              <option value="Antelope">Antelope</option>
              <option value="Moose">Moose</option>
              <option value="Bighorn Sheep">Bighorn Sheep</option>
              <option value="Mountain Goat">Mountain Goat</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
              Point Type
            </label>
            <select
              value={newPointType}
              onChange={(e) => setNewPointType(e.target.value)}
              className="w-full min-h-[44px] rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-base dark:bg-brand-bark dark:border-brand-sage/30 dark:text-brand-cream"
            >
              <option value="preference">Preference</option>
              <option value="bonus">Bonus</option>
              <option value="loyalty">Loyalty</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
                Points
              </label>
              <input
                type="number"
                value={newPoints}
                onChange={(e) => setNewPoints(parseInt(e.target.value) || 0)}
                min={0}
                max={30}
                className="w-full min-h-[44px] rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-base dark:bg-brand-bark dark:border-brand-sage/30 dark:text-brand-cream"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
                Year Started
              </label>
              <input
                type="number"
                value={newYearStarted}
                onChange={(e) => setNewYearStarted(parseInt(e.target.value) || 2020)}
                min={2000}
                max={2030}
                className="w-full min-h-[44px] rounded-xl border border-brand-sage/20 bg-white px-4 py-2.5 text-base dark:bg-brand-bark dark:border-brand-sage/30 dark:text-brand-cream"
              />
            </div>
          </div>

          <Button fullWidth onClick={handleAddPoints} disabled={!newState || !newSpecies}>
            Add Points
          </Button>
        </div>
      </Sheet>
    </div>
  );
}
