"use client";

import { useState, useEffect } from "react";
import { Shield, Lock, Check, AlertTriangle, X, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface StateNeeded {
  code: string;
  name: string;
  agencyName?: string;
  agencyUrl?: string;
  hasCredential: boolean;
}

interface CredentialLinkModalProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  statesNeeded: StateNeeded[];
}

interface CredentialForm {
  username: string;
  password: string;
  showPassword: boolean;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function CredentialLinkModal({
  open,
  onClose,
  onComplete,
  statesNeeded,
}: CredentialLinkModalProps) {
  const [forms, setForms] = useState<Record<string, CredentialForm>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedStates, setSavedStates] = useState<Set<string>>(new Set());

  // Initialize forms for states that need credentials
  useEffect(() => {
    if (!open) return;

    const initialForms: Record<string, CredentialForm> = {};
    const alreadyLinked = new Set<string>();

    statesNeeded.forEach((state) => {
      if (state.hasCredential) {
        alreadyLinked.add(state.code);
      } else {
        initialForms[state.code] = {
          username: "",
          password: "",
          showPassword: false,
        };
      }
    });

    setForms(initialForms);
    setSavedStates(alreadyLinked);
    setError(null);
  }, [open, statesNeeded]);

  // Check if all states are covered
  const allLinked =
    statesNeeded.length > 0 &&
    statesNeeded.every(
      (s) => s.hasCredential || savedStates.has(s.code)
    );

  // Count how many still need credentials
  const missingCount = statesNeeded.filter(
    (s) => !s.hasCredential && !savedStates.has(s.code)
  ).length;

  function updateForm(
    stateCode: string,
    field: keyof CredentialForm,
    value: string | boolean
  ) {
    setForms((prev) => ({
      ...prev,
      [stateCode]: {
        ...prev[stateCode],
        [field]: value,
      },
    }));
  }

  async function handleSave() {
    setError(null);

    // Validate all unfilled states have both fields
    const toSave: Array<{
      stateCode: string;
      username: string;
      password: string;
    }> = [];

    for (const state of statesNeeded) {
      if (state.hasCredential || savedStates.has(state.code)) continue;

      const form = forms[state.code];
      if (!form || !form.username.trim() || !form.password.trim()) {
        setError(
          `Please enter both username and password for ${state.name}.`
        );
        return;
      }

      toSave.push({
        stateCode: state.code,
        username: form.username.trim(),
        password: form.password.trim(),
      });
    }

    if (toSave.length === 0) {
      onComplete();
      return;
    }

    setSaving(true);

    try {
      // Save each credential sequentially to respect rate limits
      for (const cred of toSave) {
        const res = await fetch("/api/v1/credentials", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            stateCode: cred.stateCode,
            username: cred.username,
            password: cred.password,
          }),
        });

        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(
            data.error || `Failed to save credentials for ${cred.stateCode}`
          );
        }

        // Mark as saved
        setSavedStates((prev) => new Set([...prev, cred.stateCode]));
      }

      onComplete();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save credentials"
      );
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal card */}
      <div
        className={cn(
          "relative z-10 w-full max-w-xl mx-4",
          "max-h-[90vh] overflow-y-auto overscroll-contain",
          "rounded-2xl border border-brand-sage/20 bg-white shadow-2xl",
          "dark:border-brand-sage/30 dark:bg-brand-bark",
          // Full-screen on mobile
          "sm:mx-auto sm:max-h-[80vh]",
          "max-sm:fixed max-sm:inset-0 max-sm:rounded-none max-sm:max-w-none max-sm:mx-0"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Link state portal credentials"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-brand-sage/10 bg-white/95 px-6 py-4 backdrop-blur-sm dark:border-brand-sage/20 dark:bg-brand-bark/95">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-forest/10 dark:bg-brand-sage/20">
              <Shield className="h-5 w-5 text-brand-forest dark:text-brand-cream" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
                Link Portal Credentials
              </h2>
              <p className="text-xs text-brand-sage">
                {missingCount > 0
                  ? `${missingCount} state${missingCount !== 1 ? "s" : ""} need${missingCount === 1 ? "s" : ""} credentials`
                  : "All credentials linked"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage transition-colors hover:bg-brand-sage/10 dark:hover:bg-brand-sage/20 min-h-[44px] min-w-[44px]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Security notice */}
        <div className="mx-6 mt-4 flex items-start gap-3 rounded-xl border border-brand-forest/20 bg-brand-forest/5 p-3 dark:border-brand-sage/20 dark:bg-brand-sage/10">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-brand-forest dark:text-brand-cream" />
          <div>
            <p className="text-xs font-medium text-brand-forest dark:text-brand-cream">
              Encrypted with AES-256-GCM
            </p>
            <p className="mt-0.5 text-[11px] text-brand-sage">
              Your credentials are encrypted before storage. HuntLogic never
              stores passwords in plain text. We use your credentials only to
              submit applications on your behalf.
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-brand-forest/30 bg-brand-forest/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-brand-forest dark:border-brand-sage/30 dark:bg-brand-sage/20 dark:text-brand-cream">
            Secure
          </span>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mx-6 mt-3 flex items-start gap-2 rounded-xl border border-danger/20 bg-danger/5 p-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm text-danger">{error}</p>
          </div>
        )}

        {/* State credential forms */}
        <div className="space-y-4 p-6">
          {statesNeeded.map((state) => {
            const isLinked = state.hasCredential || savedStates.has(state.code);
            const form = forms[state.code];

            return (
              <div
                key={state.code}
                className={cn(
                  "rounded-xl border p-4 transition-colors",
                  isLinked
                    ? "border-brand-forest/30 bg-brand-forest/5 dark:border-brand-sage/30 dark:bg-brand-sage/10"
                    : "border-brand-sage/15 bg-white dark:border-brand-sage/20 dark:bg-brand-bark"
                )}
              >
                {/* State header */}
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                        {state.name}
                      </span>
                      <span className="rounded-md bg-brand-sage/10 px-1.5 py-0.5 text-[10px] font-medium text-brand-sage dark:bg-brand-sage/20">
                        {state.code}
                      </span>
                    </div>
                    {state.agencyName && (
                      <p className="mt-0.5 text-xs text-brand-sage">
                        {state.agencyName}
                        {state.agencyUrl && (
                          <>
                            {" "}
                            &mdash;{" "}
                            <a
                              href={state.agencyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-brand-forest underline decoration-brand-forest/30 hover:decoration-brand-forest dark:text-brand-cream"
                            >
                              Portal
                            </a>
                          </>
                        )}
                      </p>
                    )}
                  </div>

                  {isLinked && (
                    <div className="flex items-center gap-1.5 rounded-full bg-brand-forest/10 px-2.5 py-1 dark:bg-brand-sage/20">
                      <Check className="h-3.5 w-3.5 text-brand-forest dark:text-brand-cream" />
                      <span className="text-xs font-medium text-brand-forest dark:text-brand-cream">
                        Linked
                      </span>
                    </div>
                  )}
                </div>

                {/* Credential form (only for unlinked states) */}
                {!isLinked && form && (
                  <div className="space-y-3">
                    {/* Username */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-brand-bark dark:text-brand-cream">
                        Portal Username / Email
                      </label>
                      <input
                        type="text"
                        value={form.username}
                        onChange={(e) =>
                          updateForm(state.code, "username", e.target.value)
                        }
                        placeholder={`Your ${state.code} portal username`}
                        autoComplete="username"
                        className="w-full rounded-lg border border-brand-sage/20 bg-white px-3 py-2.5 text-sm text-brand-bark placeholder:text-brand-sage/50 transition-colors focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest/20 dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream dark:placeholder:text-brand-sage/40 min-h-[44px]"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label className="mb-1 block text-xs font-medium text-brand-bark dark:text-brand-cream">
                        Portal Password
                      </label>
                      <div className="relative">
                        <input
                          type={form.showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={(e) =>
                            updateForm(state.code, "password", e.target.value)
                          }
                          placeholder="Enter portal password"
                          autoComplete="current-password"
                          className="w-full rounded-lg border border-brand-sage/20 bg-white px-3 py-2.5 pr-10 text-sm text-brand-bark placeholder:text-brand-sage/50 transition-colors focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest/20 dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream dark:placeholder:text-brand-sage/40 min-h-[44px]"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            updateForm(
                              state.code,
                              "showPassword",
                              !form.showPassword
                            )
                          }
                          className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-md text-brand-sage transition-colors hover:bg-brand-sage/10 min-h-[44px] min-w-[44px]"
                          aria-label={
                            form.showPassword ? "Hide password" : "Show password"
                          }
                        >
                          {form.showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-brand-sage/10 bg-white/95 px-6 py-4 backdrop-blur-sm dark:border-brand-sage/20 dark:bg-brand-bark/95">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={onClose}
              className="min-h-[44px]"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              isLoading={saving}
              disabled={saving}
              iconLeft={
                allLinked ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Lock className="h-4 w-4" />
                )
              }
              onClick={handleSave}
              className="min-h-[44px]"
            >
              {allLinked ? "Continue to Checkout" : "Save & Continue"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
