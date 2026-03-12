"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Check, Sparkles } from "lucide-react";

interface CompletionScreenProps {
  summary?: {
    species?: string[];
    orientation?: string;
    budget?: string;
    timeline?: string;
  };
  onContinueRefining?: () => void;
}

export function CompletionScreen({
  summary,
  onContinueRefining,
}: CompletionScreenProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center px-4 py-8 text-center animate-fade-in">
      {/* Celebration visual */}
      <div className="relative mb-6">
        {/* Glow effect */}
        <div className="absolute inset-0 animate-pulse rounded-full bg-success/20 blur-xl" />
        <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-success/10">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success text-white">
            <Check className="h-8 w-8" strokeWidth={3} />
          </div>
        </div>

        {/* Confetti dots via CSS */}
        <div className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-brand-sunset animate-bounce" style={{ animationDelay: "0.1s" }} />
        <div className="absolute -top-1 -left-3 h-2 w-2 rounded-full bg-brand-sky animate-bounce" style={{ animationDelay: "0.3s" }} />
        <div className="absolute -bottom-1 -right-4 h-2.5 w-2.5 rounded-full bg-warning animate-bounce" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-1 left-[-16px] h-2 w-2 rounded-full bg-brand-forest animate-bounce" style={{ animationDelay: "0.2s" }} />
      </div>

      {/* Headline */}
      <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream md:text-3xl">
        Your Hunt Strategy is Ready
      </h1>
      <p className="mt-2 max-w-sm text-base text-brand-sage">
        We have enough to build your personalized playbook. Let&apos;s make this
        season count.
      </p>

      {/* Summary */}
      {summary && (
        <div className="mt-6 w-full max-w-sm rounded-xl border border-brand-sage/10 bg-white/50 p-4 dark:bg-brand-bark/50 dark:border-brand-sage/20">
          <h3 className="mb-3 flex items-center justify-center gap-2 text-sm font-semibold text-brand-bark dark:text-brand-cream">
            <Sparkles className="h-4 w-4 text-brand-sunset" />
            What we learned
          </h3>
          <div className="space-y-2 text-sm text-brand-sage">
            {summary.species && summary.species.length > 0 && (
              <div className="flex justify-between">
                <span>Species</span>
                <span className="font-medium text-brand-bark dark:text-brand-cream">
                  {summary.species.join(", ")}
                </span>
              </div>
            )}
            {summary.orientation && (
              <div className="flex justify-between">
                <span>Orientation</span>
                <span className="font-medium text-brand-bark dark:text-brand-cream capitalize">
                  {summary.orientation}
                </span>
              </div>
            )}
            {summary.budget && (
              <div className="flex justify-between">
                <span>Budget</span>
                <span className="font-medium text-brand-bark dark:text-brand-cream">
                  {summary.budget}
                </span>
              </div>
            )}
            {summary.timeline && (
              <div className="flex justify-between">
                <span>Timeline</span>
                <span className="font-medium text-brand-bark dark:text-brand-cream">
                  {summary.timeline}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CTAs */}
      <div className="mt-8 w-full max-w-sm space-y-3">
        <Button
          fullWidth
          size="lg"
          onClick={() => router.push("/playbook")}
          iconRight={<Sparkles className="h-5 w-5" />}
        >
          View Your Playbook
        </Button>

        {onContinueRefining && (
          <button
            onClick={onContinueRefining}
            className="block w-full text-center text-sm font-medium text-brand-sage hover:text-brand-bark transition-colors dark:hover:text-brand-cream"
          >
            Keep refining for more precision
          </button>
        )}
      </div>
    </div>
  );
}
