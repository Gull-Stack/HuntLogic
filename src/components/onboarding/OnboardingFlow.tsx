"use client";

import { useState, useEffect, useCallback } from "react";
import { ProgressIndicator } from "./ProgressIndicator";
import { QuestionCard } from "./QuestionCard";
import { CompletionScreen } from "./CompletionScreen";
import { Skeleton } from "@/components/ui/Skeleton";
import type {
  OnboardingQuestion,
  OnboardingAnswer,
  OnboardingResult,
} from "@/services/onboarding/types";

interface OnboardingFlowProps {
  initialProgress?: number;
}

export function OnboardingFlow({ initialProgress = 0 }: OnboardingFlowProps) {
  const [currentQuestion, setCurrentQuestion] = useState<OnboardingQuestion | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [progress, setProgress] = useState(initialProgress);
  const [isComplete, setIsComplete] = useState(false);
  const [, setSlideDirection] = useState<"left" | "right">("left");
  const [summary, setSummary] = useState<{
    species?: string[];
    orientation?: string;
    budget?: string;
    timeline?: string;
  }>({});

  const fetchNextQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/onboarding/next-question");
      if (!res.ok) {
        // If 404 or error, we treat it as no more questions (mock scenario)
        setIsComplete(true);
        setProgress(100);
        return;
      }
      const data = await res.json();

      if (data.playbook_ready) {
        setIsComplete(true);
        setProgress(100);
        if (data.summary) setSummary(data.summary);
        return;
      }

      setCurrentQuestion(data.question || data);
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
    } catch {
      // In development/demo mode, show mock question
      setCurrentQuestion(getMockQuestion(progress));
    } finally {
      setIsLoading(false);
    }
  }, [progress]);

  useEffect(() => {
    fetchNextQuestion();
  }, []);

  const handleAnswer = async (answer: OnboardingAnswer) => {
    setIsSubmitting(true);
    setSlideDirection("left");

    try {
      const res = await fetch("/api/v1/onboarding/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      });

      if (res.ok) {
        const result: OnboardingResult = await res.json();
        setProgress(result.completeness);

        if (result.isPlaybookReady) {
          setIsComplete(true);
          return;
        }
      }
    } catch {
      // In dev mode, simulate progress
      setProgress((prev) => Math.min(100, prev + 15));
      if (progress + 15 >= 60) {
        setIsComplete(true);
        return;
      }
    } finally {
      setIsSubmitting(false);
    }

    // Fetch next question
    await fetchNextQuestion();
  };

  const handleSkip = async () => {
    if (!currentQuestion) return;
    setSlideDirection("left");

    // Advance progress slightly on skip
    setProgress((prev) => Math.min(100, prev + 5));

    await fetchNextQuestion();
  };

  const handleContinueRefining = () => {
    setIsComplete(false);
    fetchNextQuestion();
  };

  if (isComplete) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <CompletionScreen
          summary={summary}
          onContinueRefining={handleContinueRefining}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-lg mx-auto">
      {/* Progress */}
      <div className="w-full mb-8">
        <ProgressIndicator progress={progress} />
      </div>

      {/* Question area */}
      <div className="w-full flex-1">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton variant="text" className="h-7 w-4/5" />
            <Skeleton variant="text" className="h-5 w-2/3" />
            <div className="space-y-2 mt-6">
              <Skeleton variant="custom" className="h-14 w-full rounded-xl" />
              <Skeleton variant="custom" className="h-14 w-full rounded-xl" />
              <Skeleton variant="custom" className="h-14 w-full rounded-xl" />
            </div>
          </div>
        ) : currentQuestion ? (
          <div
            key={currentQuestion.questionId}
            className="animate-slide-up"
          >
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Mock question for development/demo when API isn't available
function getMockQuestion(currentProgress: number): OnboardingQuestion {
  const mockQuestions: OnboardingQuestion[] = [
    {
      questionId: "species-interest",
      category: "species_interest",
      text: "What species are you most excited to hunt?",
      options: [
        { value: "elk", label: "Elk", description: "Rocky Mountain & Roosevelt" },
        { value: "mule_deer", label: "Mule Deer", description: "Western mule deer" },
        { value: "whitetail", label: "Whitetail Deer", description: "Across all states" },
        { value: "antelope", label: "Pronghorn Antelope", description: "Speed goats" },
        { value: "moose", label: "Moose", description: "Shiras & Canadian" },
        { value: "sheep", label: "Bighorn Sheep", description: "Once-in-a-lifetime" },
      ],
      responseType: "multi_select",
      canSkip: false,
      metadata: {
        weight: 20,
        promptSlug: "species-interest",
        estimatedRemainingQuestions: 6,
      },
    },
    {
      questionId: "hunt-orientation",
      category: "hunt_orientation",
      text: "What matters most to you in a hunt?",
      options: [
        { value: "trophy", label: "Trophy Quality", description: "Maximize antler/horn size" },
        { value: "opportunity", label: "High Draw Odds", description: "Get tags frequently" },
        { value: "meat", label: "Filling the Freezer", description: "Harvest success" },
        { value: "experience", label: "The Experience", description: "Scenery, adventure, solitude" },
        { value: "balanced", label: "Balanced Approach", description: "A mix of everything" },
      ],
      responseType: "single_select",
      canSkip: false,
      metadata: {
        weight: 15,
        promptSlug: "hunt-orientation",
        estimatedRemainingQuestions: 5,
      },
    },
    {
      questionId: "budget",
      category: "budget",
      text: "What's your annual hunting budget?",
      options: [
        { value: "under_2000", label: "Under $2,000", description: "Budget-conscious" },
        { value: "2000_5000", label: "$2,000 - $5,000", description: "Moderate investment" },
        { value: "5000_10000", label: "$5,000 - $10,000", description: "Serious commitment" },
        { value: "over_10000", label: "$10,000+", description: "Premium experiences" },
      ],
      responseType: "single_select",
      canSkip: true,
      metadata: {
        weight: 10,
        promptSlug: "budget",
        estimatedRemainingQuestions: 4,
      },
    },
  ];

  const idx = Math.floor(currentProgress / 20) % mockQuestions.length;
  return mockQuestions[idx]!;
}
