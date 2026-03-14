"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { Check, Send, ChevronLeft, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { OnboardingQuestion, OnboardingAnswer } from "@/services/onboarding/types";

interface PointsEntry {
  state: string;
  species: string;
  points: number;
}

const FALLBACK_STATES = [
  { value: "CO", label: "Colorado" },
  { value: "WY", label: "Wyoming" },
  { value: "MT", label: "Montana" },
  { value: "ID", label: "Idaho" },
  { value: "NM", label: "New Mexico" },
  { value: "AZ", label: "Arizona" },
  { value: "UT", label: "Utah" },
  { value: "NV", label: "Nevada" },
  { value: "OR", label: "Oregon" },
  { value: "WA", label: "Washington" },
];

const SPECIES_OPTIONS = [
  { value: "elk", label: "Elk" },
  { value: "mule_deer", label: "Mule Deer" },
  { value: "antelope", label: "Antelope" },
  { value: "moose", label: "Moose" },
  { value: "bighorn_sheep", label: "Bighorn Sheep" },
  { value: "mountain_goat", label: "Mountain Goat" },
];

interface QuestionCardProps {
  question: OnboardingQuestion;
  onAnswer: (answer: OnboardingAnswer) => void;
  onSkip: () => void;
  onBack?: () => void;
  isSubmitting?: boolean;
}

export function QuestionCard({
  question,
  onAnswer,
  onSkip,
  onBack,
  isSubmitting = false,
}: QuestionCardProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [pointsEntries, setPointsEntries] = useState<PointsEntry[]>([
    { state: "", species: "", points: 0 },
  ]);

  const handleSingleSelect = (value: string) => {
    onAnswer({
      questionId: question.questionId,
      responseType: question.responseType,
      selectedValues: [value],
    });
  };

  const handleMultiSelectToggle = (value: string) => {
    setSelectedValues((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  };

  const handleMultiSubmit = () => {
    if (selectedValues.length === 0) return;
    onAnswer({
      questionId: question.questionId,
      responseType: question.responseType,
      selectedValues,
    });
  };

  const handleFreeTextSubmit = () => {
    if (!freeText.trim()) return;
    onAnswer({
      questionId: question.questionId,
      responseType: question.responseType,
      freeText: freeText.trim(),
    });
  };

  const handleStructuredSubmit = () => {
    // Build { "CO": { "elk": 3 }, "WY": { "elk": 5 } } format
    const structured: Record<string, Record<string, number>> = {};
    for (const entry of pointsEntries) {
      if (entry.state && entry.species) {
        if (!structured[entry.state]) structured[entry.state] = {};
        structured[entry.state]![entry.species] = entry.points;
      }
    }
    onAnswer({
      questionId: question.questionId,
      responseType: question.responseType,
      structured,
    });
  };

  const updatePointsEntry = (index: number, field: keyof PointsEntry, value: string | number) => {
    setPointsEntries((prev) =>
      prev.map((entry, i) => (i === index ? { ...entry, [field]: value } : entry))
    );
  };

  const addPointsEntry = () => {
    setPointsEntries((prev) => [...prev, { state: "", species: "", points: 0 }]);
  };

  const removePointsEntry = (index: number) => {
    setPointsEntries((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-lg mx-auto animate-fade-in">
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-1 text-sm text-brand-sage transition-colors hover:text-brand-bark dark:hover:text-brand-cream"
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </button>
      )}

      {/* Question text */}
      <h2 className="text-xl font-bold text-brand-bark dark:text-brand-cream md:text-2xl">
        {question.text}
      </h2>

      {question.metadata?.estimatedRemainingQuestions != null && question.metadata.estimatedRemainingQuestions > 0 && (
        <p className="mt-2 text-sm text-brand-sage">
          About {question.metadata.estimatedRemainingQuestions} question
          {question.metadata.estimatedRemainingQuestions !== 1 ? "s" : ""} remaining
        </p>
      )}

      {/* Response area */}
      <div className="mt-6 space-y-3">
        {question.responseType === "single_select" && (
          <div className="space-y-2">
            {question.options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleSingleSelect(option.value)}
                disabled={isSubmitting}
                className={cn(
                  "flex min-h-[56px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                  "border-brand-sage/20 bg-white hover:border-brand-forest/40 active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2",
                  "dark:bg-brand-bark dark:border-brand-sage/30 dark:hover:border-brand-sage/50",
                  "disabled:opacity-50"
                )}
              >
                <div>
                  <span className="text-base font-medium text-brand-bark dark:text-brand-cream">
                    {option.label}
                  </span>
                  {option.description && (
                    <p className="mt-0.5 text-sm text-brand-sage">
                      {option.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {question.responseType === "multi_select" && (
          <>
            <div className="space-y-2">
              {question.options.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                return (
                  <button
                    key={option.value}
                    onClick={() => handleMultiSelectToggle(option.value)}
                    disabled={isSubmitting}
                    className={cn(
                      "flex min-h-[56px] w-full items-center justify-between rounded-xl border px-4 py-3 text-left transition-all",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-forest focus-visible:ring-offset-2",
                      "active:scale-[0.98] disabled:opacity-50",
                      isSelected
                        ? "border-brand-forest bg-brand-forest/5 dark:border-brand-sage dark:bg-brand-sage/10"
                        : "border-brand-sage/20 bg-white hover:border-brand-forest/40 dark:bg-brand-bark dark:border-brand-sage/30"
                    )}
                  >
                    <div>
                      <span className="text-base font-medium text-brand-bark dark:text-brand-cream">
                        {option.label}
                      </span>
                      {option.description && (
                        <p className="mt-0.5 text-sm text-brand-sage">
                          {option.description}
                        </p>
                      )}
                    </div>
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border transition-colors",
                        isSelected
                          ? "border-brand-forest bg-brand-forest text-white dark:border-brand-sage dark:bg-brand-sage"
                          : "border-brand-sage/30"
                      )}
                    >
                      {isSelected && <Check className="h-4 w-4" />}
                    </div>
                  </button>
                );
              })}
            </div>
            <Button
              onClick={handleMultiSubmit}
              disabled={selectedValues.length === 0}
              isLoading={isSubmitting}
              fullWidth
              className="mt-4"
            >
              Continue ({selectedValues.length} selected)
            </Button>
          </>
        )}

        {question.responseType === "structured" && (
          <div className="space-y-4">
            {pointsEntries.map((entry, index) => {
              const stateOpts =
                question.options.length > 0
                  ? question.options
                  : FALLBACK_STATES;
              return (
                <div key={index} className="flex items-end gap-2">
                  {/* State */}
                  <div className="flex-1">
                    {index === 0 && (
                      <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
                        State
                      </label>
                    )}
                    <select
                      value={entry.state}
                      className="w-full min-h-[44px] rounded-[10px] border border-[#E0DDD5] bg-white px-3 py-2.5 text-sm text-brand-bark focus:outline-none focus:ring-2 focus:ring-brand-forest dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30"
                      onChange={(e) => updatePointsEntry(index, "state", e.target.value)}
                    >
                      <option value="">State</option>
                      {stateOpts.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Species */}
                  <div className="flex-1">
                    {index === 0 && (
                      <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
                        Species
                      </label>
                    )}
                    <select
                      value={entry.species}
                      className="w-full min-h-[44px] rounded-[10px] border border-[#E0DDD5] bg-white px-3 py-2.5 text-sm text-brand-bark focus:outline-none focus:ring-2 focus:ring-brand-forest dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30"
                      onChange={(e) => updatePointsEntry(index, "species", e.target.value)}
                    >
                      <option value="">Species</option>
                      {SPECIES_OPTIONS.map((sp) => (
                        <option key={sp.value} value={sp.value}>
                          {sp.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Points */}
                  <div className="w-20">
                    {index === 0 && (
                      <label className="block text-sm font-medium text-brand-bark dark:text-brand-cream mb-1.5">
                        Points
                      </label>
                    )}
                    <input
                      type="number"
                      min={0}
                      max={30}
                      value={entry.points}
                      placeholder="0"
                      className="w-full min-h-[44px] rounded-[10px] border border-[#E0DDD5] bg-white px-3 py-2.5 text-sm text-brand-bark focus:outline-none focus:ring-2 focus:ring-brand-forest dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30"
                      onChange={(e) =>
                        updatePointsEntry(index, "points", parseInt(e.target.value) || 0)
                      }
                    />
                  </div>

                  {/* Remove row */}
                  {pointsEntries.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removePointsEntry(index)}
                      className="mb-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-brand-sage hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={addPointsEntry}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-forest hover:text-brand-bark transition-colors dark:text-brand-sage dark:hover:text-brand-cream"
            >
              <Plus className="h-4 w-4" />
              Add another
            </button>

            <Button
              onClick={handleStructuredSubmit}
              isLoading={isSubmitting}
              fullWidth
            >
              Continue
            </Button>
          </div>
        )}

        {question.responseType === "free_text" && (
          <div className="space-y-3">
            <div className="relative">
              <textarea
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                placeholder="Type your answer..."
                rows={3}
                className="w-full rounded-[10px] border border-[#E0DDD5] bg-white px-4 py-3 pr-12 text-base text-brand-bark resize-none focus:outline-none focus:ring-2 focus:ring-brand-forest dark:bg-brand-bark dark:text-brand-cream dark:border-brand-sage/30"
              />
              <button
                onClick={handleFreeTextSubmit}
                disabled={!freeText.trim() || isSubmitting}
                className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-brand-forest text-white transition-colors disabled:opacity-40 hover:bg-brand-sage"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Skip link */}
      {question.canSkip && (
        <button
          onClick={onSkip}
          className="mt-6 block w-full text-center text-sm text-brand-sage hover:text-brand-bark transition-colors dark:hover:text-brand-cream"
        >
          Skip this question
        </button>
      )}
    </div>
  );
}
