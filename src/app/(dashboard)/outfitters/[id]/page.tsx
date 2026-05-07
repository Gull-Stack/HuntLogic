"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Star,
  ExternalLink,
  Phone,
  Mail,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";
import Link from "next/link";

interface Outfitter {
  id: string;
  name: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  stateCode: string;
  speciesSlugs: string[];
  unitCodes: string[];
  huntTypes: string[];
  priceRange: string | null;
  rating: number;
  reviewCount: number;
  description: string | null;
  verified: boolean;
}

interface Review {
  id: string;
  year: number;
  rating: number;
  review: string | null;
  huntSuccess: boolean | null;
  verifiedClient: boolean;
  userName: string | null;
  createdAt: string;
}

export default function OutfitterDetailPage() {
  const params = useParams();
  const [outfitter, setOutfitter] = useState<Outfitter | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [reviewYear] = useState(new Date().getFullYear());
  const [reviewSuccess] = useState<boolean | undefined>();
  const [submitting, setSubmitting] = useState(false);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/v1/outfitters/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setOutfitter(data.outfitter);
        setReviews(data.reviews ?? []);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [params.id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewRating) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/v1/outfitters/${params.id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          year: reviewYear,
          rating: reviewRating,
          review: reviewText || undefined,
          huntSuccess: reviewSuccess,
        }),
      });

      if (res.ok) {
        setShowReviewForm(false);
        setReviewRating(0);
        setReviewText("");
        fetchDetail();
      }
    } catch {
      // Silent fail
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 rounded-lg bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20" />
        <div className="h-48 rounded-xl bg-brand-sage/10 motion-safe:animate-pulse dark:bg-brand-sage/20" />
      </div>
    );
  }

  if (!outfitter) return null;

  return (
    <div className="space-y-6">
      <Link
        href="/outfitters"
        className="flex items-center gap-1 text-sm text-brand-sage hover:text-brand-forest"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Directory
      </Link>

      {/* Outfitter Info */}
      <div className="rounded-xl border border-brand-sage/10 bg-white p-5 shadow-sm dark:border-brand-sage/20 dark:bg-brand-bark">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-brand-bark dark:text-brand-cream">
              {outfitter.name}
            </h1>
            <div className="mt-1 flex items-center gap-2">
              <div className="flex">
                {Array.from({ length: 5 }, (_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-4 w-4",
                      i < Math.round(outfitter.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-brand-sage/30"
                    )}
                  />
                ))}
              </div>
              <span className="text-sm text-brand-sage">
                {outfitter.rating.toFixed(1)} ({outfitter.reviewCount} reviews)
              </span>
              {outfitter.verified && (
                <span className="flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                  <CheckCircle className="h-3 w-3" />
                  Verified
                </span>
              )}
            </div>
          </div>
          <span className="rounded-full bg-brand-forest/10 px-3 py-1 text-sm font-medium text-brand-forest dark:bg-brand-sage/20 dark:text-brand-cream">
            {outfitter.stateCode}
          </span>
        </div>

        {outfitter.description && (
          <p className="mt-3 text-sm text-brand-bark/80 dark:text-brand-cream/80">
            {outfitter.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {(outfitter.speciesSlugs as string[]).map((s) => (
            <span
              key={s}
              className="rounded-full bg-brand-sage/10 px-2.5 py-1 text-xs font-medium text-brand-sage dark:bg-brand-sage/20"
            >
              {s}
            </span>
          ))}
          {(outfitter.huntTypes as string[]).map((t) => (
            <span
              key={t}
              className="rounded-full bg-brand-forest/10 px-2.5 py-1 text-xs font-medium text-brand-forest dark:bg-brand-sage/20 dark:text-brand-cream"
            >
              {t}
            </span>
          ))}
          {outfitter.priceRange && (
            <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700 capitalize dark:bg-amber-900/30 dark:text-amber-400">
              {outfitter.priceRange}
            </span>
          )}
        </div>

        {/* Contact */}
        <div className="mt-4 flex flex-wrap gap-3">
          {outfitter.website && (
            <a
              href={outfitter.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex min-h-[44px] items-center gap-1.5 rounded-[8px] bg-gradient-cta px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md motion-safe:hover:-translate-y-0.5"
            >
              <ExternalLink className="h-4 w-4" />
              Visit Website
            </a>
          )}
          {outfitter.phone && (
            <a
              href={`tel:${outfitter.phone}`}
              className="flex min-h-[44px] items-center gap-1.5 rounded-[8px] border border-brand-sage/20 px-4 py-2 text-sm font-medium text-brand-bark dark:border-brand-sage/30 dark:text-brand-cream"
            >
              <Phone className="h-4 w-4" />
              {outfitter.phone}
            </a>
          )}
          {outfitter.email && (
            <a
              href={`mailto:${outfitter.email}`}
              className="flex min-h-[44px] items-center gap-1.5 rounded-[8px] border border-brand-sage/20 px-4 py-2 text-sm font-medium text-brand-bark dark:border-brand-sage/30 dark:text-brand-cream"
            >
              <Mail className="h-4 w-4" />
              Email
            </a>
          )}
        </div>
      </div>

      {/* Reviews */}
      <div className="rounded-xl border border-brand-sage/10 bg-white p-5 shadow-sm dark:border-brand-sage/20 dark:bg-brand-bark">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-brand-bark dark:text-brand-cream">
            Reviews ({reviews.length})
          </h2>
          <button
            onClick={() => setShowReviewForm(!showReviewForm)}
            className="flex min-h-[44px] items-center rounded-[8px] border border-brand-sage/20 px-3 py-2 text-sm font-medium text-brand-sage dark:border-brand-sage/30"
          >
            Write a Review
          </button>
        </div>

        {showReviewForm && (
          <form
            onSubmit={submitReview}
            className="mb-4 rounded-lg border border-brand-sage/10 p-3 dark:border-brand-sage/20"
          >
            <div className="mb-2 flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setReviewRating(s)}
                  className="min-h-[44px] min-w-[44px] p-2"
                >
                  <Star
                    className={cn(
                      "h-5 w-5",
                      s <= reviewRating
                        ? "fill-amber-400 text-amber-400"
                        : "text-brand-sage/30"
                    )}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={3}
              placeholder="Share your experience..."
              className="w-full rounded-[10px] border border-brand-sage/20 bg-white px-3 py-2 text-sm text-brand-bark dark:border-brand-sage/30 dark:bg-brand-bark/50 dark:text-brand-cream"
            />
            <button
              type="submit"
              disabled={submitting || !reviewRating}
              className="mt-2 flex min-h-[44px] items-center rounded-[8px] bg-gradient-cta px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </form>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-brand-sage">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((r) => (
              <div
                key={r.id}
                className="border-b border-brand-sage/10 pb-3 last:border-0 dark:border-brand-sage/20"
              >
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {Array.from({ length: 5 }, (_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < r.rating
                            ? "fill-amber-400 text-amber-400"
                            : "text-brand-sage/30"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-brand-sage">
                    {r.userName ?? "Anonymous"} · {r.year}
                  </span>
                  {r.verifiedClient && (
                    <span className="text-[10px] text-blue-600">Verified</span>
                  )}
                </div>
                {r.review && (
                  <p className="mt-1 text-sm text-brand-bark/80 dark:text-brand-cream/80">
                    {r.review}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
