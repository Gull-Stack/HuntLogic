"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();
  const { update } = useSession();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    async function checkOnboardingStatus() {
      try {
        const res = await fetch("/api/v1/profile");
        if (res.ok) {
          const profile = await res.json();
          if (profile.onboardingComplete) {
            router.replace("/dashboard");
            return;
          }
        }
      } catch {
        // Continue to onboarding if can't check
      }
      setIsCheckingStatus(false);
    }

    checkOnboardingStatus();
  }, [router]);

  const handleSkipOnboarding = async () => {
    await fetch("/api/v1/onboarding/complete", { method: "POST" });
    await update({ onboardingComplete: true });
    router.push("/dashboard");
  };

  if (isCheckingStatus) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-cream dark:bg-brand-forest">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-sage/20 border-t-brand-forest" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream bg-pattern dark:bg-brand-forest">
      {/* Safe area top padding */}
      <div style={{ paddingTop: "env(safe-area-inset-top)" }} />

      {/* Header with logo and skip */}
      <div className="mx-auto w-full max-w-2xl flex items-center justify-between px-4 sm:px-8 pt-6 pb-2">
        <div className="w-16" />
        <div className="text-center">
          <h1 className="text-xl font-bold text-brand-forest dark:text-brand-cream">
            {process.env.NEXT_PUBLIC_BRAND_NAME || "HuntLogic"}
          </h1>
          <p className="text-xs font-medium tracking-wider uppercase text-brand-sage">
            Concierge
          </p>
        </div>
        <button
          onClick={handleSkipOnboarding}
          className="w-16 text-right text-sm font-medium text-brand-sage hover:text-brand-forest transition-colors dark:hover:text-brand-cream"
        >
          Skip
        </button>
      </div>

      {/* Onboarding Flow */}
      <div className="mx-auto w-full max-w-2xl px-4 sm:px-8 py-6 md:py-12">
        <OnboardingFlow />
      </div>

      {/* Safe area bottom padding */}
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}
