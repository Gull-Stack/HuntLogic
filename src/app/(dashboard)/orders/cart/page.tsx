"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton, SkeletonList } from "@/components/ui/Skeleton";
import {
  ShoppingCart,
  Plus,
  Trash2,
  CreditCard,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  DollarSign,
  Crosshair,
  FileText,
  Loader2,
  Shield,
} from "lucide-react";
import DynamicFormFields, {
  type FormSchema,
} from "@/components/concierge/DynamicFormFields";
import { CredentialLinkModal } from "@/components/concierge/CredentialLinkModal";
import { fetchWithCache, invalidateCache } from "@/lib/api/cache";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface OrderItem {
  id: string;
  stateCode: string;
  stateName?: string;
  speciesSlug: string;
  speciesName?: string;
  residency: "resident" | "non_resident";
  huntType?: string;
  choiceRank?: number;
  stateFee: number;
  serviceFee: number;
  status: string;
}

interface Order {
  id: string;
  status: string;
  items: OrderItem[];
  stateFeesSubtotal: number;
  serviceFeesSubtotal: number;
  grandTotal: number;
  createdAt: string;
  metadata?: {
    orderNumber?: string;
  };
}

interface StateOption {
  code: string;
  name: string;
  agencyName?: string;
  agencyUrl?: string;
}

interface UserCredential {
  id: string;
  stateCode: string;
  status: string;
  lastVerified?: string;
}

interface SpeciesOption {
  slug: string;
  name: string;
  states?: string[];
}

interface FeePreview {
  stateFee: number;
  serviceFee: number;
  total: number;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
}

const HUNT_TYPES = [
  { value: "", label: "Any" },
  { value: "rifle", label: "Rifle" },
  { value: "archery", label: "Archery" },
  { value: "muzzleloader", label: "Muzzleloader" },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CartPage() {
  const router = useRouter();

  // Order state
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add-item form state
  const [states, setStates] = useState<StateOption[]>([]);
  const [species, setSpecies] = useState<SpeciesOption[]>([]);
  const [filteredSpecies, setFilteredSpecies] = useState<SpeciesOption[]>([]);
  const [selectedState, setSelectedState] = useState("");
  const [selectedSpecies, setSelectedSpecies] = useState("");
  const [residency, setResidency] = useState<"resident" | "non_resident">("non_resident");
  const [huntType, setHuntType] = useState("");
  const [feePreview, setFeePreview] = useState<FeePreview | null>(null);
  const [isFetchingFees, setIsFetchingFees] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Dynamic form state
  const [formConfig, setFormConfig] = useState<FormSchema | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isLoadingFormConfig, setIsLoadingFormConfig] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(false);

  // Credential state
  const [userCredentials, setUserCredentials] = useState<UserCredential[]>([]);
  const [showCredentialModal, setShowCredentialModal] = useState(false);

  /* ---- Fetch user credentials ---- */
  const fetchCredentials = useCallback(async () => {
    try {
      const res = await fetch("/api/v1/credentials");
      if (!res.ok) return;
      const data = await res.json();
      setUserCredentials(data.credentials || []);
    } catch {
      // Silently fail — credentials check is non-blocking
    }
  }, []);

  /* ---- Fetch or create draft order ---- */
  const fetchOrCreateDraft = useCallback(async () => {
    try {
      // Try to find an existing draft
      const data = await fetchWithCache<{ orders: Order[] }>(
        "/api/v1/concierge/orders?status=draft",
        { staleMs: 10_000 }
      );
      const drafts = data.orders || [];

      if (drafts.length > 0) {
        setOrder(drafts[0]!);
      } else {
        // Create new draft
        const res = await fetch("/api/v1/concierge/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "draft" }),
        });
        if (!res.ok) throw new Error("Failed to create order");
        const newOrder = await res.json();
        setOrder(newOrder.order);
        invalidateCache("/api/v1/concierge/orders");
      }
    } catch (err) {
      console.error("[cart] Failed to load cart:", err);
      setError("Failed to load your cart. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* ---- Refresh order data ---- */
  const refreshOrder = useCallback(async () => {
    if (!order) return;
    try {
      invalidateCache(`/api/v1/concierge/orders/${order.id}`);
      const data = await fetchWithCache<{ order: Order }>(
        `/api/v1/concierge/orders/${order.id}`,
        { staleMs: 0 }
      );
      setOrder(data.order);
    } catch (err) {
      console.error("[cart] Failed to refresh order:", err);
    }
  }, [order]);

  /* ---- Fetch reference data ---- */
  useEffect(() => {
    fetchOrCreateDraft();
    fetchCredentials();

    // Fetch states
    fetchWithCache<{ states: StateOption[] }>("/api/v1/explore/states", {
      staleMs: 300_000,
    })
      .then((data) => setStates(data.states || []))
      .catch(() => {});

    // Fetch species
    fetchWithCache<{ species: SpeciesOption[] }>("/api/v1/explore/species", {
      staleMs: 300_000,
    })
      .then((data) => setSpecies(data.species || []))
      .catch(() => {});
  }, [fetchOrCreateDraft, fetchCredentials]);

  /* ---- Filter species by selected state ---- */
  useEffect(() => {
    if (!selectedState) {
      setFilteredSpecies(species);
    } else {
      const filtered = species.filter(
        (sp) => !sp.states || sp.states.length === 0 || sp.states.includes(selectedState)
      );
      setFilteredSpecies(filtered);
    }
    // Reset species selection when state changes
    setSelectedSpecies("");
    setFeePreview(null);
  }, [selectedState, species]);

  /* ---- Fetch fee preview ---- */
  useEffect(() => {
    if (!selectedState || !selectedSpecies) {
      setFeePreview(null);
      return;
    }

    let cancelled = false;
    setIsFetchingFees(true);

    const params = new URLSearchParams({
      stateCode: selectedState,
      speciesSlug: selectedSpecies,
      residency,
      ...(huntType && { huntType }),
    });

    fetch(`/api/v1/concierge/fees?${params.toString()}`)
      .then((res) => {
        if (!res.ok) throw new Error("Fee lookup failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setFeePreview({
            stateFee: data.stateFee ?? 0,
            serviceFee: data.serviceFee ?? 0,
            total: data.total ?? (data.stateFee ?? 0) + (data.serviceFee ?? 0),
          });
        }
      })
      .catch(() => {
        if (!cancelled) setFeePreview(null);
      })
      .finally(() => {
        if (!cancelled) setIsFetchingFees(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedState, selectedSpecies, residency, huntType]);

  /* ---- Fetch form config when state changes ---- */
  useEffect(() => {
    // Reset form data and config on state change
    setFormData({});
    setFormConfig(null);
    setIsFormExpanded(false);

    if (!selectedState) return;

    let cancelled = false;
    setIsLoadingFormConfig(true);

    fetch(
      `/api/v1/concierge/form-config?stateCode=${encodeURIComponent(selectedState)}&year=2026`
    )
      .then((res) => {
        if (!res.ok) throw new Error("Form config fetch failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          const configs = data?.data?.formConfig;
          if (configs && configs.length > 0 && configs[0].schema) {
            setFormConfig(configs[0].schema as FormSchema);
            setIsFormExpanded(true);
          } else {
            setFormConfig(null);
          }
        }
      })
      .catch(() => {
        if (!cancelled) setFormConfig(null);
      })
      .finally(() => {
        if (!cancelled) setIsLoadingFormConfig(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedState]);

  /* ---- Add item ---- */
  async function handleAddItem() {
    if (!order || !selectedState || !selectedSpecies) return;
    setIsAddingItem(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/concierge/orders/${order.id}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stateCode: selectedState,
          speciesSlug: selectedSpecies,
          residency,
          ...(huntType && { huntType }),
          ...(Object.keys(formData).length > 0 && { formData }),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to add item");
      }

      // Reset form
      setSelectedState("");
      setSelectedSpecies("");
      setResidency("non_resident");
      setHuntType("");
      setFeePreview(null);
      setFormData({});
      setFormConfig(null);
      setIsFormExpanded(false);

      // Refresh order
      invalidateCache(`/api/v1/concierge/orders/${order.id}`);
      invalidateCache("/api/v1/concierge/orders");
      await refreshOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add item");
    } finally {
      setIsAddingItem(false);
    }
  }

  /* ---- Remove item ---- */
  async function handleRemoveItem(itemId: string) {
    if (!order) return;
    setRemovingItemId(itemId);
    setError(null);

    try {
      const res = await fetch(
        `/api/v1/concierge/orders/${order.id}/items/${itemId}`,
        { method: "DELETE" }
      );

      if (!res.ok) throw new Error("Failed to remove item");

      invalidateCache(`/api/v1/concierge/orders/${order.id}`);
      invalidateCache("/api/v1/concierge/orders");
      await refreshOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove item");
    } finally {
      setRemovingItemId(null);
    }
  }

  /* ---- Proceed with Stripe checkout (after credentials confirmed) ---- */
  async function proceedToStripe() {
    if (!order || order.items.length === 0) return;
    setIsCheckingOut(true);
    setError(null);

    try {
      // Link credentials to order items before checkout
      await fetch(`/api/v1/concierge/orders/${order.id}/link-credentials`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      const res = await fetch(`/api/v1/concierge/orders/${order.id}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) throw new Error("Checkout failed");

      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start checkout");
      setIsCheckingOut(false);
    }
  }

  /* ---- Checkout — guard with credential check ---- */
  async function handleCheckout() {
    if (!order || order.items.length === 0) return;

    // Check if all states in the order have credentials
    const orderStateCodes = [...new Set(order.items.map((item) => item.stateCode))];
    const credStateCodes = userCredentials
      .filter((c) => c.status === "active")
      .map((c) => c.stateCode);
    const missingCreds = orderStateCodes.filter(
      (code) => !credStateCodes.includes(code)
    );

    if (missingCreds.length > 0) {
      setShowCredentialModal(true);
      return;
    }

    // All credentials present — proceed directly
    await proceedToStripe();
  }

  /* ---- Credential modal complete handler ---- */
  async function handleCredentialComplete() {
    setShowCredentialModal(false);
    await fetchCredentials();
    await proceedToStripe();
  }

  /* ---- Build statesNeeded for the credential modal ---- */
  function getStatesNeeded() {
    if (!order) return [];

    const orderStateCodes = [...new Set(order.items.map((item) => item.stateCode))];
    const credStateCodes = new Set(
      userCredentials.filter((c) => c.status === "active").map((c) => c.stateCode)
    );

    return orderStateCodes.map((code) => {
      const stateInfo = states.find((s) => s.code === code);
      return {
        code,
        name: stateInfo?.name || code,
        agencyName: stateInfo?.agencyName,
        agencyUrl: stateInfo?.agencyUrl,
        hasCredential: credStateCodes.has(code),
      };
    });
  }

  /* ---- Helper: check if a cart item's state has a credential ---- */
  function hasCredentialForState(stateCode: string): boolean {
    return userCredentials.some(
      (c) => c.stateCode === stateCode && c.status === "active"
    );
  }

  /* ---- Loading state ---- */
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="h-7 w-48 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
          <div className="mt-1 h-5 w-64 motion-safe:animate-pulse rounded-lg bg-brand-sage/10" />
        </div>
        <SkeletonList count={2} />
      </div>
    );
  }

  const hasItems = order && order.items.length > 0;

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push("/orders")}
        className="flex items-center gap-2 text-sm text-brand-sage hover:text-brand-forest transition-colors dark:hover:text-brand-cream"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </button>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-bark dark:text-brand-cream">
          Order Builder
        </h1>
        <p className="mt-1 text-sm text-brand-sage">
          Add applications to your order and checkout when ready
        </p>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-danger/20 bg-danger/5 p-4">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content — 2 columns */}
        <div className="space-y-6 lg:col-span-2">
          {/* Current items */}
          <Card>
            <CardContent>
              <h2 className="mb-4 text-lg font-semibold text-brand-bark dark:text-brand-cream">
                <ShoppingCart className="mr-2 inline h-5 w-5" />
                Cart Items
                {hasItems && (
                  <span className="ml-2 text-sm font-normal text-brand-sage">
                    ({order.items.length})
                  </span>
                )}
              </h2>

              {!hasItems ? (
                <EmptyState
                  icon={<ShoppingCart className="h-8 w-8" />}
                  title="Your cart is empty"
                  description="Browse recommendations or use the form below to add applications."
                  actionLabel="View Recommendations"
                  actionHref="/recommendations"
                  className="py-8"
                />
              ) : (
                <div className="space-y-3">
                  {order.items.map((item) => {
                    const hasCred = hasCredentialForState(item.stateCode);
                    return (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-brand-sage/10 p-4 dark:border-brand-sage/20"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-brand-forest/10 dark:bg-brand-sage/20">
                          <Crosshair className="h-5 w-5 text-brand-forest dark:text-brand-cream" />
                          <span
                            className={cn(
                              "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-white dark:border-brand-bark",
                              hasCred ? "bg-brand-forest" : "bg-amber-400"
                            )}
                            title={hasCred ? "Portal credentials linked" : "Portal credentials needed"}
                          >
                            <Shield className="h-2.5 w-2.5 text-white" />
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
                            {item.stateName || item.stateCode} &mdash;{" "}
                            {item.speciesName || item.speciesSlug}
                          </p>
                          <p className="text-xs text-brand-sage">
                            {item.residency === "resident" ? "Resident" : "Non-Resident"}
                            {item.huntType
                              ? ` / ${item.huntType.charAt(0).toUpperCase() + item.huntType.slice(1)}`
                              : ""}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                            {formatCurrency(item.stateFee + item.serviceFee)}
                          </p>
                          <p className="text-[10px] text-brand-sage">
                            State: {formatCurrency(item.stateFee)} + Service:{" "}
                            {formatCurrency(item.serviceFee)}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          disabled={removingItemId === item.id}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-brand-sage transition-colors hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                          aria-label="Remove item"
                        >
                          {removingItemId === item.id ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-brand-sage border-t-transparent" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Add Application Form */}
          <Card>
            <CardContent>
              <h2 className="mb-4 text-lg font-semibold text-brand-bark dark:text-brand-cream">
                <Plus className="mr-2 inline h-5 w-5" />
                Add Application
              </h2>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* State */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-bark dark:text-brand-cream">
                    State
                  </label>
                  <div className="relative">
                    <select
                      value={selectedState}
                      onChange={(e) => setSelectedState(e.target.value)}
                      className="w-full appearance-none rounded-[8px] border border-brand-sage/20 bg-white px-3 py-2.5 pr-10 text-sm text-brand-bark transition-colors focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest/20 dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream min-h-[44px]"
                    >
                      <option value="">Select state...</option>
                      {states.map((state) => (
                        <option key={state.code} value={state.code}>
                          {state.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage" />
                  </div>
                </div>

                {/* Species */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-bark dark:text-brand-cream">
                    Species
                  </label>
                  <div className="relative">
                    <select
                      value={selectedSpecies}
                      onChange={(e) => setSelectedSpecies(e.target.value)}
                      disabled={!selectedState}
                      className="w-full appearance-none rounded-[8px] border border-brand-sage/20 bg-white px-3 py-2.5 pr-10 text-sm text-brand-bark transition-colors focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest/20 disabled:opacity-50 dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream min-h-[44px]"
                    >
                      <option value="">Select species...</option>
                      {filteredSpecies.map((sp) => (
                        <option key={sp.slug} value={sp.slug}>
                          {sp.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage" />
                  </div>
                </div>

                {/* Residency */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-bark dark:text-brand-cream">
                    Residency
                  </label>
                  <div className="flex rounded-[8px] border border-brand-sage/20 p-1 dark:border-brand-sage/30">
                    <button
                      type="button"
                      onClick={() => setResidency("resident")}
                      className={cn(
                        "flex-1 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors min-h-[36px]",
                        residency === "resident"
                          ? "bg-brand-forest text-white"
                          : "text-brand-sage hover:bg-brand-sage/5 dark:hover:bg-brand-sage/10"
                      )}
                    >
                      Resident
                    </button>
                    <button
                      type="button"
                      onClick={() => setResidency("non_resident")}
                      className={cn(
                        "flex-1 rounded-[6px] px-3 py-2 text-sm font-medium transition-colors min-h-[36px]",
                        residency === "non_resident"
                          ? "bg-brand-forest text-white"
                          : "text-brand-sage hover:bg-brand-sage/5 dark:hover:bg-brand-sage/10"
                      )}
                    >
                      Non-Resident
                    </button>
                  </div>
                </div>

                {/* Hunt Type */}
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-brand-bark dark:text-brand-cream">
                    Hunt Type
                    <span className="ml-1 text-xs font-normal text-brand-sage">(optional)</span>
                  </label>
                  <div className="relative">
                    <select
                      value={huntType}
                      onChange={(e) => setHuntType(e.target.value)}
                      className="w-full appearance-none rounded-[8px] border border-brand-sage/20 bg-white px-3 py-2.5 pr-10 text-sm text-brand-bark transition-colors focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest/20 dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream min-h-[44px]"
                    >
                      {HUNT_TYPES.map((ht) => (
                        <option key={ht.value} value={ht.value}>
                          {ht.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage" />
                  </div>
                </div>
              </div>

              {/* Fee Preview */}
              {(isFetchingFees || feePreview) && (
                <div className="mt-4 rounded-xl border border-brand-sage/10 bg-brand-sage/5 p-4 dark:border-brand-sage/20 dark:bg-brand-sage/10">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="h-4 w-4 text-brand-forest dark:text-brand-cream" />
                    <span className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                      Fee Preview
                    </span>
                  </div>
                  {isFetchingFees ? (
                    <div className="space-y-2">
                      <Skeleton variant="text" className="h-4 w-40" />
                      <Skeleton variant="text" className="h-4 w-32" />
                    </div>
                  ) : feePreview ? (
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-brand-sage">State Fee</span>
                        <span className="text-brand-bark dark:text-brand-cream">
                          {formatCurrency(feePreview.stateFee)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-brand-sage">Service Fee</span>
                        <span className="text-brand-bark dark:text-brand-cream">
                          {formatCurrency(feePreview.serviceFee)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-brand-sage/10 pt-1 dark:border-brand-sage/20">
                        <span className="font-medium text-brand-bark dark:text-brand-cream">
                          Total
                        </span>
                        <span className="font-semibold text-brand-forest dark:text-brand-cream">
                          {formatCurrency(feePreview.total)}
                        </span>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* Application Details — Dynamic Form */}
              {selectedState && (isLoadingFormConfig || formConfig) && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => setIsFormExpanded((prev) => !prev)}
                    className="flex w-full items-center justify-between rounded-xl border border-brand-sage/10 bg-brand-sage/5 px-4 py-3 transition-colors hover:bg-brand-sage/10 dark:border-brand-sage/20 dark:bg-brand-sage/10 dark:hover:bg-brand-sage/15"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-brand-forest dark:text-brand-cream" />
                      <span className="text-sm font-medium text-brand-bark dark:text-brand-cream">
                        Application Details
                      </span>
                      <span className="text-[10px] text-brand-sage">
                        (optional)
                      </span>
                    </div>
                    <ChevronRight
                      className={cn(
                        "h-4 w-4 text-brand-sage transition-transform duration-200",
                        isFormExpanded && "rotate-90"
                      )}
                    />
                  </button>

                  {isFormExpanded && (
                    <div className="mt-3 rounded-xl border border-brand-sage/10 p-4 dark:border-brand-sage/20">
                      {isLoadingFormConfig ? (
                        <div className="flex items-center justify-center py-6">
                          <Loader2 className="h-5 w-5 animate-spin text-brand-sage" />
                          <span className="ml-2 text-sm text-brand-sage">
                            Loading form fields...
                          </span>
                        </div>
                      ) : formConfig ? (
                        <>
                          <p className="mb-4 text-xs text-brand-sage">
                            Fill in state-specific details now, or skip and our
                            team will collect this information later.
                          </p>
                          <DynamicFormFields
                            schema={formConfig}
                            values={formData}
                            onChange={setFormData}
                          />
                        </>
                      ) : null}
                    </div>
                  )}
                </div>
              )}

              {/* Add button */}
              <div className="mt-4">
                <Button
                  variant="secondary"
                  size="md"
                  fullWidth
                  disabled={!selectedState || !selectedSpecies || isFetchingFees}
                  isLoading={isAddingItem}
                  iconLeft={<Plus className="h-4 w-4" />}
                  onClick={handleAddItem}
                >
                  Add to Order
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar — Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <Card>
              <CardContent>
                <h2 className="mb-4 text-lg font-semibold text-brand-bark dark:text-brand-cream">
                  Order Summary
                </h2>

                {!hasItems ? (
                  <p className="text-sm text-brand-sage">
                    No items in your order yet.
                  </p>
                ) : (
                  <>
                    {/* Item summary */}
                    <div className="space-y-2 mb-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="truncate text-brand-bark dark:text-brand-cream">
                            {item.stateCode} &mdash;{" "}
                            {item.speciesName || item.speciesSlug}
                          </span>
                          <span className="shrink-0 ml-2 text-brand-sage">
                            {formatCurrency(item.stateFee + item.serviceFee)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Fee breakdown */}
                    <div className="space-y-2 border-t border-brand-sage/10 pt-4 dark:border-brand-sage/20">
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-sage">State Fees</span>
                        <span className="text-brand-bark dark:text-brand-cream">
                          {formatCurrency(order.stateFeesSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-brand-sage">Service Fees</span>
                        <span className="text-brand-bark dark:text-brand-cream">
                          {formatCurrency(order.serviceFeesSubtotal)}
                        </span>
                      </div>
                      <div className="flex justify-between border-t border-brand-sage/10 pt-2 dark:border-brand-sage/20">
                        <span className="text-base font-semibold text-brand-bark dark:text-brand-cream">
                          Grand Total
                        </span>
                        <span className="text-lg font-bold text-brand-forest dark:text-brand-cream">
                          {formatCurrency(order.grandTotal)}
                        </span>
                      </div>
                    </div>

                    {/* Checkout button */}
                    <div className="mt-6">
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        isLoading={isCheckingOut}
                        iconLeft={<CreditCard className="h-5 w-5" />}
                        onClick={handleCheckout}
                      >
                        Proceed to Checkout
                      </Button>
                      <p className="mt-2 text-center text-[10px] text-brand-sage">
                        Secure checkout powered by Stripe
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Credential Link Modal */}
      <CredentialLinkModal
        open={showCredentialModal}
        onClose={() => setShowCredentialModal(false)}
        onComplete={handleCredentialComplete}
        statesNeeded={getStatesNeeded()}
      />
    </div>
  );
}
