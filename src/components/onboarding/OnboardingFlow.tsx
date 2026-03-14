"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ProgressIndicator } from "./ProgressIndicator";
import { QuestionCard } from "./QuestionCard";
import { CompletionScreen } from "./CompletionScreen";
import { Skeleton } from "@/components/ui/Skeleton";
import { invalidateCache } from "@/lib/api/cache";
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
  const [questionNumber, setQuestionNumber] = useState(1);
  const [history, setHistory] = useState<{ question: OnboardingQuestion; progress: number }[]>([]);
  const [summary, setSummary] = useState<{
    species?: string[];
    orientation?: string;
    budget?: string;
    timeline?: string;
  }>({});

  // Track mock question index so we advance through all 3 questions reliably
  const mockIndexRef = useRef(0);
  const isMockFlowRef = useRef(false);

  const showMockQuestion = useCallback((index: number) => {
    const q = MOCK_QUESTIONS[index % MOCK_QUESTIONS.length]!;
    const remaining = MOCK_QUESTIONS.length - index - 1;
    setCurrentQuestion({
      ...q,
      metadata: {
        ...q.metadata,
        estimatedRemainingQuestions: Math.max(0, remaining),
      },
    });
    setQuestionNumber(index + 1);
    isMockFlowRef.current = true;
  }, []);

  const fetchNextQuestion = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/v1/onboarding/next-question");
      if (!res.ok) {
        console.warn("[onboarding] API returned error, using built-in questions");
        showMockQuestion(mockIndexRef.current);
        return;
      }
      const data = await res.json();

      // API returns { data: question } or { data: null, meta: { status: "playbook_ready" } }
      if (!data.data || data.meta?.status === "playbook_ready") {
        setIsComplete(true);
        setProgress(100);
        if (data.summary) setSummary(data.summary);
        return;
      }

      isMockFlowRef.current = false;
      setCurrentQuestion(data.data);
      if (data.progress !== undefined) {
        setProgress(data.progress);
      }
      setQuestionNumber((prev) => prev + 1);
    } catch {
      // API unavailable — show mock question
      showMockQuestion(mockIndexRef.current);
    } finally {
      setIsLoading(false);
    }
  }, [showMockQuestion]);

  useEffect(() => {
    fetchNextQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBack = () => {
    if (history.length === 0) return;
    const prev = history[history.length - 1]!;
    setHistory((h) => h.slice(0, -1));
    setCurrentQuestion(prev.question);
    setProgress(prev.progress);
    setQuestionNumber((n) => Math.max(1, n - 1));
    setSlideDirection("right");
    if (isMockFlowRef.current && mockIndexRef.current > 0) {
      mockIndexRef.current--;
    }
  };

  const advanceMockFlow = () => {
    mockIndexRef.current++;
    const newProgress = Math.round(
      (mockIndexRef.current / MOCK_QUESTIONS.length) * 100
    );
    setProgress(newProgress);

    if (mockIndexRef.current >= MOCK_QUESTIONS.length) {
      setIsComplete(true);
      setProgress(100);
      return true;
    }
    showMockQuestion(mockIndexRef.current);
    return false;
  };

  const handleAnswer = async (answer: OnboardingAnswer) => {
    setIsSubmitting(true);
    setSlideDirection("left");

    // Save current question to history before advancing
    if (currentQuestion) {
      setHistory((h) => [...h, { question: currentQuestion, progress }]);
    }

    try {
      const res = await fetch("/api/v1/onboarding/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(answer),
      });

      if (res.ok) {
        const json = await res.json();
        const result: OnboardingResult = json.data ?? json;
        setProgress(result.completeness);

        invalidateCache("/api/v1/profile");
        invalidateCache("/api/v1/onboarding");

        if (result.isPlaybookReady) {
          setIsComplete(true);
          setIsSubmitting(false);
          return;
        }

        // API worked — fetch real next question
        setIsSubmitting(false);
        await fetchNextQuestion();
        return;
      }
    } catch {
      // API unavailable
    }

    setIsSubmitting(false);

    // Mock flow — advance to next mock question or complete
    if (isMockFlowRef.current) {
      if (advanceMockFlow()) return;
    } else {
      await fetchNextQuestion();
    }
  };

  const handleSkip = async () => {
    if (!currentQuestion) return;
    setSlideDirection("left");

    // Save current question to history before skipping
    setHistory((h) => [...h, { question: currentQuestion, progress }]);

    // Persist the skip on the server
    try {
      await fetch("/api/v1/onboarding/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId: currentQuestion.questionId }),
      });
      invalidateCache("/api/v1/profile");
      invalidateCache("/api/v1/onboarding");
    } catch {
      // If skip API fails, still advance locally
    }

    // Mock flow — advance to next mock question or complete
    if (isMockFlowRef.current) {
      if (advanceMockFlow()) return;
    } else {
      setProgress((prev) => Math.min(100, prev + 5));
      await fetchNextQuestion();
    }
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
        <ProgressIndicator
          progress={progress}
          questionLabel={
            currentQuestion?.metadata?.estimatedRemainingQuestions != null
              ? `Question ${questionNumber} of ${questionNumber + currentQuestion.metadata.estimatedRemainingQuestions}`
              : undefined
          }
        />
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
            className="motion-safe:animate-slide-up"
          >
            <QuestionCard
              question={currentQuestion}
              onAnswer={handleAnswer}
              onSkip={handleSkip}
              onBack={history.length > 0 ? handleBack : undefined}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}

// Mock questions for when the API isn't available
const MOCK_QUESTIONS: OnboardingQuestion[] = [
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
      estimatedRemainingQuestions: 2,
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
      estimatedRemainingQuestions: 1,
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
      estimatedRemainingQuestions: 0,
    },
  },
];
