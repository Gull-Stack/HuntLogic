"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  Award,
  Target,
  Crosshair,
  ChevronRight,
  Settings,
  Bell,
  Edit3,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ProfileData {
  name: string;
  email: string;
  avatarUrl: string | null;
  completeness: number;
  statesActive: number;
  speciesTracked: number;
  totalPoints: number;
  onboardingComplete: boolean;
}

const mockProfile: ProfileData = {
  name: "Hunter",
  email: "hunter@example.com",
  avatarUrl: null,
  completeness: 72,
  statesActive: 4,
  speciesTracked: 3,
  totalPoints: 12,
  onboardingComplete: true,
};

const settingsLinks = [
  { href: "/profile/points", label: "Manage Points", icon: Award, description: "Track preference & bonus points" },
  { href: "/settings", label: "Preferences", icon: Settings, description: "App settings & notifications" },
  { href: "/settings", label: "Notification Settings", icon: Bell, description: "Manage alerts & reminders" },
];

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/v1/profile");
        if (res.ok) {
          const data = await res.json();
          setProfile(data.data);
        }
      } catch {
        setProfile(mockProfile);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (isLoading || !profile) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center py-8">
          <div className="h-20 w-20 motion-safe:animate-pulse rounded-full bg-brand-sage/10" />
          <div className="mt-3 h-6 w-32 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-4 w-44 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
      </div>
    );
  }

  const circumference = 2 * Math.PI * 42;
  const dashOffset = circumference - (profile.completeness / 100) * circumference;

  return (
    <div className="space-y-6">
      {/* Avatar + name */}
      <div className="flex flex-col items-center pt-4 pb-2">
        {/* Completeness ring around avatar */}
        <div className="relative">
          <svg className="h-24 w-24" viewBox="0 0 100 100">
            {/* Background ring */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              className="text-brand-sage/10 dark:text-brand-sage/20"
            />
            {/* Progress ring */}
            <circle
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke="currentColor"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              className="text-brand-forest dark:text-brand-sage"
              transform="rotate(-90 50 50)"
              style={{ transition: "stroke-dashoffset 0.5s ease" }}
            />
          </svg>

          {/* Avatar */}
          <div className="absolute inset-0 flex items-center justify-center">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-16 w-16 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-forest text-xl font-bold text-brand-cream">
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          {/* Percentage label */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-brand-forest px-2 py-0.5 text-[10px] font-bold text-white dark:bg-brand-sage">
            {profile.completeness}%
          </div>
        </div>

        <h1 className="mt-4 text-xl font-bold text-brand-bark dark:text-brand-cream">
          {profile.name}
        </h1>
        <p className="text-sm text-brand-sage">{profile.email}</p>
      </div>

      {/* Continue setup CTA */}
      {!profile.onboardingComplete && (
        <Card variant="interactive">
          <Link href="/onboarding" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-sunset/10 text-brand-sunset">
              <Edit3 className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-brand-bark dark:text-brand-cream">
                Continue Profile Setup
              </p>
              <p className="text-sm text-brand-sage">
                Complete your profile for better recommendations
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-brand-sage" />
          </Link>
        </Card>
      )}

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "States Active", value: profile.statesActive, icon: Target, color: "text-brand-forest dark:text-brand-sage" },
          { label: "Species", value: profile.speciesTracked, icon: Crosshair, color: "text-brand-sky" },
          { label: "Total Points", value: profile.totalPoints, icon: Award, color: "text-brand-sunset" },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="text-center p-3">
              <Icon className={cn("h-5 w-5 mx-auto", stat.color)} />
              <p className="mt-1 text-lg font-bold text-brand-bark dark:text-brand-cream">
                {stat.value}
              </p>
              <p className="text-[11px] text-brand-sage">{stat.label}</p>
            </Card>
          );
        })}
      </div>

      {/* Settings links */}
      <div className="space-y-2">
        {settingsLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link key={link.href + link.label} href={link.href}>
              <Card variant="interactive" className="flex items-center gap-3 mb-2">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-sage/10 dark:bg-brand-sage/20">
                  <Icon className="h-5 w-5 text-brand-sage" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                    {link.label}
                  </p>
                  <p className="text-xs text-brand-sage">{link.description}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-brand-sage" />
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
