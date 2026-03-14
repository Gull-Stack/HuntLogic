"use client";

import { useState, useEffect } from "react";
import { PlaybookView } from "@/components/hunt/PlaybookView";
import { SkeletonList } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { BookOpen } from "lucide-react";
import type { PlaybookData } from "@/services/intelligence/types";
import { fetchWithCache, invalidateCache } from "@/lib/api/cache";

export default function PlaybookPage() {
  const [playbook, setPlaybook] = useState<PlaybookData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [profileComplete] = useState(true);

  useEffect(() => {
    async function fetchPlaybook() {
      try {
        const data = await fetchWithCache<{ playbook: PlaybookData | null }>(
          "/api/v1/playbook",
          { staleMs: 60_000 }
        );
        setPlaybook(data.playbook ?? null);
      } catch (err) {
        // fetchWithCache throws on non-ok responses; treat 404 as no playbook
        console.error("[playbook] Failed to fetch:", err);
        setPlaybook(null);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlaybook();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/v1/playbook", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setPlaybook(data.playbook ?? null);
        invalidateCache("/api/v1/playbook");
      }
    } catch (err) {
      console.error("[playbook] Failed to refresh:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-56 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        <SkeletonList count={3} />
      </div>
    );
  }

  if (!profileComplete && !playbook) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
            Playbook
          </h1>
          <p className="mt-1 text-sm text-brand-sage">
            Your personalized multi-year hunting strategy
          </p>
        </div>
        <EmptyState
          icon={<BookOpen className="h-8 w-8" />}
          title="Complete Your Profile First"
          description="We need to know more about your hunting goals before we can build your strategy."
          actionLabel="Continue Setup"
          actionHref="/onboarding"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          Playbook
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Your personalized multi-year hunting strategy
        </p>
      </div>

      <PlaybookView
        playbook={playbook}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />
    </div>
  );
}
