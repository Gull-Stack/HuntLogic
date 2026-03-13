"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Plus, Users, Calendar, ChevronRight } from "lucide-react";
import Link from "next/link";

interface Group {
  id: string;
  name: string;
  description: string | null;
  targetYear: number | null;
  memberCount: number;
  pendingCount: number;
  isOwner: boolean;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newYear, setNewYear] = useState(new Date().getFullYear() + 1);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/groups");
      if (res.ok) {
        const data = await res.json();
        setGroups(data.groups ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) return;

    setCreating(true);
    try {
      const res = await fetch("/api/v1/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          description: newDescription || undefined,
          targetYear: newYear,
        }),
      });

      if (res.ok) {
        setShowCreate(false);
        setNewName("");
        setNewDescription("");
        fetchGroups();
      }
    } catch {
      // Silent fail
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-8 w-48 rounded-lg bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20" />
          <div className="h-10 w-36 rounded-[8px] bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20" />
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="h-28 rounded-xl bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
            Hunt Groups
          </h1>
          <p className="mt-1 text-sm text-brand-sage">
            Plan hunts with family and friends
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex min-h-[44px] items-center gap-2 rounded-[8px] bg-gradient-cta px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md motion-safe:hover:-translate-y-0.5"
        >
          <Plus className="h-4 w-4" />
          Create Group
        </button>
      </div>

      {/* Create Form */}
      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-brand-sage/10 bg-white p-5 shadow-sm dark:border-brand-sage/20 dark:bg-brand-bark"
        >
          <h3 className="mb-3 text-sm font-semibold text-brand-bark dark:text-brand-cream">
            New Hunt Group
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Group name..."
              className="min-h-[44px] rounded-[10px] border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark placeholder:text-brand-sage/50 dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
              required
            />
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (optional)"
              className="min-h-[44px] rounded-[10px] border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark placeholder:text-brand-sage/50 dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
            />
            <input
              type="number"
              value={newYear}
              onChange={(e) => setNewYear(parseInt(e.target.value) || 0)}
              min={2024}
              max={2035}
              className="min-h-[44px] rounded-[10px] border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
            />
          </div>
          <div className="mt-3 flex gap-2">
            <button
              type="submit"
              disabled={creating}
              className="flex min-h-[44px] items-center rounded-[8px] bg-gradient-cta px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="flex min-h-[44px] items-center rounded-[8px] border border-brand-sage/20 px-4 py-2 text-sm font-medium text-brand-sage dark:border-brand-sage/30"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Groups List */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-brand-sage/10 bg-white p-8 text-center dark:border-brand-sage/20 dark:bg-brand-bark">
          <Users className="mx-auto h-10 w-10 text-brand-sage/30" />
          <p className="mt-3 text-sm font-medium text-brand-bark dark:text-brand-cream">
            No groups yet
          </p>
          <p className="mt-1 text-xs text-brand-sage">
            Create a group to start planning hunts with family and friends
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Link
              key={group.id}
              href={`/groups/${group.id}`}
              className="flex items-center justify-between rounded-xl border border-brand-sage/10 bg-white p-4 shadow-sm transition-all hover:shadow-md dark:border-brand-sage/20 dark:bg-brand-bark motion-safe:hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-forest/10 dark:bg-brand-sage/20">
                  <Users className="h-5 w-5 text-brand-forest dark:text-brand-sage" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                    {group.name}
                  </h3>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-brand-sage">
                    <span>{group.memberCount} members</span>
                    {group.pendingCount > 0 && (
                      <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        {group.pendingCount} pending
                      </span>
                    )}
                    {group.targetYear && (
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {group.targetYear}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-brand-sage/40" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
