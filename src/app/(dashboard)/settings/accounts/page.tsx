"use client";

import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  Shield,
  Link2,
  Unlink,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Lock,
} from "lucide-react";
import Link from "next/link";

interface LinkedState {
  id: string;
  stateCode: string;
  status: string;
  lastVerified: string | null;
  createdAt: string;
}

const ALL_STATES = [
  { code: "CO", name: "Colorado", portal: "CPW" },
  { code: "WY", name: "Wyoming", portal: "WGFD" },
  { code: "MT", name: "Montana", portal: "FWP" },
  { code: "AZ", name: "Arizona", portal: "AZGFD" },
  { code: "NM", name: "New Mexico", portal: "NMDGF" },
  { code: "ID", name: "Idaho", portal: "IDFG" },
  { code: "UT", name: "Utah", portal: "DWR" },
  { code: "NV", name: "Nevada", portal: "NDOW" },
  { code: "OR", name: "Oregon", portal: "ODFW" },
];

export default function AccountsPage() {
  const [linked, setLinked] = useState<LinkedState[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<string | null>(null);
  const [unlinkConfirm, setUnlinkConfirm] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const fetchLinked = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/credentials");
      if (res.ok) {
        const data = await res.json();
        setLinked(data.credentials ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLinked();
  }, [fetchLinked]);

  const handleLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalState || !username || !password) return;

    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/v1/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateCode: modalState,
          username,
          password,
        }),
      });

      if (res.ok) {
        setModalState(null);
        setUsername("");
        setPassword("");
        fetchLinked();
      } else {
        const data = await res.json();
        setError(data.error ?? "Failed to link account");
      }
    } catch {
      setError("Failed to link account");
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (stateCode: string) => {
    try {
      await fetch(`/api/v1/credentials?stateCode=${stateCode}`, {
        method: "DELETE",
      });
      setUnlinkConfirm(null);
      fetchLinked();
    } catch {
      // Silent fail
    }
  };

  const getLinkedState = (code: string) =>
    linked.find((l) => l.stateCode === code);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-6 w-32 rounded-lg bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20" />
        <div className="h-48 rounded-xl bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/settings"
        className="flex items-center gap-1 text-sm text-brand-sage hover:text-brand-forest"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>

      <div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          State Accounts
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Link your state wildlife agency portal accounts for streamlined
          applications
        </p>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
        <Shield className="mt-0.5 h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div>
          <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
            Your credentials are protected
          </p>
          <p className="mt-0.5 text-xs text-blue-600/80 dark:text-blue-400/80">
            All credentials are encrypted using AES-256-GCM encryption. We never
            see or store your plain-text password.
          </p>
        </div>
      </div>

      {/* State list */}
      <div className="space-y-3">
        {ALL_STATES.map((state) => {
          const linkedData = getLinkedState(state.code);
          const isActive = linkedData?.status === "active";
          const isExpired = linkedData?.status === "expired";

          return (
            <div
              key={state.code}
              className="flex items-center justify-between rounded-xl border border-brand-sage/10 bg-white p-4 dark:border-brand-sage/20 dark:bg-brand-bark"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold",
                    isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : isExpired
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                        : "bg-brand-sage/10 text-brand-sage dark:bg-brand-sage/20"
                  )}
                >
                  {state.code}
                </div>
                <div>
                  <p className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                    {state.name}
                  </p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-brand-sage">
                      {state.portal}
                    </span>
                    {isActive && (
                      <span className="flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3 w-3" />
                        Linked
                      </span>
                    )}
                    {isExpired && (
                      <span className="flex items-center gap-0.5 text-xs text-amber-600 dark:text-amber-400">
                        <AlertCircle className="h-3 w-3" />
                        Expired
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {linkedData ? (
                  <>
                    <button
                      onClick={() => setModalState(state.code)}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-[8px] border border-brand-sage/20 px-3 py-2 text-sm text-brand-sage transition-colors hover:bg-brand-sage/5 dark:border-brand-sage/30"
                    >
                      <Link2 className="h-3.5 w-3.5" />
                      Update
                    </button>
                    <button
                      onClick={() => setUnlinkConfirm(state.code)}
                      className="flex min-h-[44px] items-center gap-1.5 rounded-[8px] border border-red-200 px-3 py-2 text-sm text-red-500 transition-colors hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
                    >
                      <Unlink className="h-3.5 w-3.5" />
                      Unlink
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setModalState(state.code)}
                    className="flex min-h-[44px] items-center gap-1.5 rounded-[8px] bg-gradient-cta px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md motion-safe:hover:-translate-y-0.5"
                  >
                    <Link2 className="h-4 w-4" />
                    Link Account
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Link Modal */}
      {modalState && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/50"
            onClick={() => {
              setModalState(null);
              setError("");
            }}
          />
          <div className="fixed inset-x-4 top-1/2 z-[201] max-w-md mx-auto -translate-y-1/2 rounded-xl border border-brand-sage/10 bg-white p-6 shadow-xl dark:border-brand-sage/20 dark:bg-brand-bark">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
                Link {ALL_STATES.find((s) => s.code === modalState)?.name}{" "}
                Account
              </h3>
              <button
                onClick={() => {
                  setModalState(null);
                  setError("");
                }}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage hover:bg-brand-sage/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-4 flex items-start gap-2 rounded-lg bg-brand-sage/5 p-3 dark:bg-brand-sage/10">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-sage" />
              <p className="text-xs text-brand-sage">
                Your credentials are encrypted with AES-256 and never stored in
                plain text.
              </p>
            </div>

            <form onSubmit={handleLink} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                  Username / Customer ID
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="mt-1 w-full rounded-[10px] border border-brand-sage/20 bg-white px-4 py-3 text-sm text-brand-bark outline-none focus:border-brand-forest dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="mt-1 w-full rounded-[10px] border border-brand-sage/20 bg-white px-4 py-3 text-sm text-brand-bark outline-none focus:border-brand-forest dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}

              <button
                type="submit"
                disabled={saving || !username || !password}
                className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-[8px] bg-gradient-cta px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 motion-safe:animate-spin" />
                    Encrypting...
                  </>
                ) : (
                  <>
                    <Shield className="h-4 w-4" />
                    Link Account
                  </>
                )}
              </button>
            </form>
          </div>
        </>
      )}

      {/* Unlink Confirmation Modal */}
      {unlinkConfirm && (
        <>
          <div
            className="fixed inset-0 z-[200] bg-black/50"
            onClick={() => setUnlinkConfirm(null)}
          />
          <div className="fixed inset-x-4 top-1/2 z-[201] max-w-sm mx-auto -translate-y-1/2 rounded-xl border border-brand-sage/10 bg-white p-6 shadow-xl dark:border-brand-sage/20 dark:bg-brand-bark">
            <h3 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
              Unlink {unlinkConfirm}?
            </h3>
            <p className="mt-2 text-sm text-brand-sage">
              This will permanently delete your stored credentials for{" "}
              {ALL_STATES.find((s) => s.code === unlinkConfirm)?.name}.
            </p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => setUnlinkConfirm(null)}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-[8px] border border-brand-sage/20 py-2 text-sm font-medium text-brand-sage dark:border-brand-sage/30"
              >
                Cancel
              </button>
              <button
                onClick={() => handleUnlink(unlinkConfirm)}
                className="flex min-h-[44px] flex-1 items-center justify-center rounded-[8px] bg-red-500 py-2 text-sm font-semibold text-white"
              >
                Unlink
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
