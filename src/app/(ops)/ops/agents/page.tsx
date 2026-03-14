"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { SkeletonList } from "@/components/ui/Skeleton";
import { useOpsAuth } from "@/components/providers/OpsAuthProvider";
import { fetchWithCache } from "@/lib/api/cache";
import { Users, Shield, Mail, MapPin, Briefcase } from "lucide-react";

interface OpsAgent {
  id: string;
  name: string;
  email: string;
  role: "agent" | "supervisor" | "admin";
  assignedStates: string[];
  currentLoad: number;
  maxLoad: number;
  active: boolean;
}

const ROLE_BADGE: Record<string, { label: string; variant: "info" | "warning" | "success"; className?: string }> = {
  agent: { label: "Agent", variant: "info", className: "bg-blue-500/10 text-blue-400" },
  supervisor: { label: "Supervisor", variant: "warning", className: "bg-amber-500/10 text-amber-400" },
  admin: { label: "Admin", variant: "success", className: "bg-emerald-500/10 text-emerald-400" },
};

export default function OpsAgentsPage() {
  const router = useRouter();
  const { opsUser } = useOpsAuth();
  const [agents, setAgents] = useState<OpsAgent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isSupervisorOrAdmin =
    opsUser?.role === "supervisor" || opsUser?.role === "admin";

  useEffect(() => {
    // Redirect non-authorized users
    if (!isSupervisorOrAdmin && !isLoading) {
      router.replace("/ops");
      return;
    }

    async function fetchAgents() {
      try {
        const data = await fetchWithCache<{ agents: OpsAgent[] }>(
          "/api/v1/ops/agents",
          { staleMs: 30_000 }
        );
        setAgents(data.agents || []);
      } catch (err) {
        console.error("[ops/agents] Failed to fetch:", err);
        setError("Failed to load agents. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAgents();
  }, [isSupervisorOrAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-40 animate-pulse rounded-lg bg-white/5" />
          <div className="mt-1 h-5 w-56 animate-pulse rounded-lg bg-white/5" />
        </div>
        <SkeletonList count={4} />
      </div>
    );
  }

  if (!isSupervisorOrAdmin) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Agents</h1>
        <p className="mt-1 text-sm text-gray-400">
          Manage ops team members and assignments
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-center">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm font-medium text-blue-400 underline hover:text-blue-300"
          >
            Retry
          </button>
        </div>
      )}

      {/* Agent Cards */}
      {agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5 text-gray-500">
            <Users className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-semibold text-white">No agents found</h3>
          <p className="mt-1 max-w-sm text-sm text-gray-400">
            No ops agents have been configured yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agents.map((agent) => {
            const roleBadge = ROLE_BADGE[agent.role] ?? ROLE_BADGE.agent;
            const loadPercentage =
              agent.maxLoad > 0
                ? Math.round((agent.currentLoad / agent.maxLoad) * 100)
                : 0;
            const isOverloaded = loadPercentage >= 90;

            return (
              <div
                key={agent.id}
                className="rounded-xl border border-white/10 bg-gray-900 p-5 space-y-4"
              >
                {/* Agent header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600/20">
                      <span className="text-sm font-bold text-blue-400">
                        {agent.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">{agent.name}</p>
                      <div className="flex items-center gap-1 text-xs text-gray-400">
                        <Mail className="h-3 w-3" />
                        {agent.email}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={roleBadge.variant}
                      size="sm"
                      className={roleBadge.className}
                    >
                      {roleBadge.label}
                    </Badge>
                    <div
                      className={`h-2.5 w-2.5 rounded-full ${
                        agent.active ? "bg-emerald-400" : "bg-gray-500"
                      }`}
                      title={agent.active ? "Active" : "Inactive"}
                    />
                  </div>
                </div>

                {/* Assigned states */}
                {agent.assignedStates.length > 0 && (
                  <div>
                    <p className="flex items-center gap-1 text-xs font-medium text-gray-500 mb-1.5">
                      <MapPin className="h-3 w-3" />
                      Assigned States
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {agent.assignedStates.map((state) => (
                        <span
                          key={state}
                          className="inline-block rounded bg-white/5 px-2 py-0.5 text-xs font-medium text-gray-300"
                        >
                          {state}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Load meter */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-1 text-gray-500">
                      <Briefcase className="h-3 w-3" />
                      Current Load
                    </span>
                    <span
                      className={
                        isOverloaded ? "text-red-400 font-medium" : "text-gray-400"
                      }
                    >
                      {agent.currentLoad} / {agent.maxLoad}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverloaded
                          ? "bg-red-500"
                          : loadPercentage >= 70
                            ? "bg-amber-500"
                            : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(100, loadPercentage)}%` }}
                    />
                  </div>
                </div>

                {/* Status indicator */}
                <div className="flex items-center gap-2 pt-1 border-t border-white/5">
                  <Shield className="h-3.5 w-3.5 text-gray-500" />
                  <span
                    className={`text-xs font-medium ${
                      agent.active ? "text-emerald-400" : "text-gray-500"
                    }`}
                  >
                    {agent.active ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
