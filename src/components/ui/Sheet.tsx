"use client";

import { cn } from "@/lib/utils";
import { useEffect, useCallback, useState, useRef } from "react";
import { X } from "lucide-react";

interface SheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  snapPoint?: "peek" | "half" | "full";
  className?: string;
}

const snapHeights: Record<string, string> = {
  peek: "max-h-[30vh]",
  half: "max-h-[50vh]",
  full: "max-h-[90vh]",
};

export function Sheet({
  isOpen,
  onClose,
  children,
  title,
  snapPoint = "half",
  className,
}: SheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef<number>(0);
  const currentY = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startY.current = e.touches[0]?.clientY ?? 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    currentY.current = e.touches[0]?.clientY ?? 0;
    const diff = currentY.current - startY.current;
    if (diff > 0 && sheetRef.current) {
      sheetRef.current.style.transform = `translateY(${diff}px)`;
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    const diff = currentY.current - startY.current;
    if (sheetRef.current) {
      sheetRef.current.style.transform = "";
    }
    if (diff > 100) {
      onClose();
    }
  }, [onClose]);

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-[200] bg-black/40 transition-opacity duration-300",
          isAnimating ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />

      {/* Sheet — mobile: bottom sheet, desktop: side panel */}
      <div
        ref={sheetRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          // Mobile: bottom sheet
          "fixed inset-x-0 bottom-0 z-[300] rounded-t-2xl bg-white transition-transform duration-300 dark:bg-brand-bark",
          // Desktop: side panel
          "lg:inset-y-0 lg:right-0 lg:left-auto lg:w-[420px] lg:rounded-t-none lg:rounded-l-2xl",
          snapHeights[snapPoint],
          "lg:max-h-full",
          isAnimating
            ? "translate-y-0 lg:translate-y-0 lg:translate-x-0"
            : "translate-y-full lg:translate-y-0 lg:translate-x-full",
          className
        )}
      >
        {/* Use flex column so content area gets a real bounded height */}
        <div className="flex flex-col h-full overflow-hidden">
          {/* Drag handle (mobile) */}
          <div className="flex justify-center pt-3 lg:hidden shrink-0">
            <div className="h-1.5 w-10 rounded-full bg-brand-sage/20" />
          </div>

          {/* Header */}
          {title && (
            <div className="shrink-0 flex items-center justify-between border-b border-brand-sage/10 px-4 py-3">
              <h3 className="text-lg font-semibold text-brand-bark dark:text-brand-cream">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-brand-sage hover:bg-brand-sage/10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Content — flex-1 gives it a real bounded height so children can use h-full/overflow */}
          <div className="flex-1 overflow-y-auto p-4 min-h-0">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
