"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export default function OnboardingPage() {
  const router = useRouter();
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);

  useEffect(() => {
    // Check if user is already onboarded
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

      {/* Logo */}
      <div className="px-4 pt-6 pb-2 text-center">
        <h1 className="text-xl font-bold text-brand-forest dark:text-brand-cream">
          HuntLogic
        </h1>
        <p className="text-xs font-medium tracking-wider uppercase text-brand-sage">
          Concierge
        </p>
      </div>

      {/* Onboarding Flow */}
      <div className="px-4 py-6">
        <OnboardingFlow />
      </div>

      {/* Safe area bottom padding */}
      <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
    </div>
  );
}
