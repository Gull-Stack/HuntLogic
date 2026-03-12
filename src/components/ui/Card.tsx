"use client";

import { cn } from "@/lib/utils";

type CardVariant = "default" | "elevated" | "outlined" | "interactive";

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  className?: string;
  onClick?: () => void;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
}

interface CardFooterProps {
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<CardVariant, string> = {
  default: "bg-white border border-brand-sage/10 shadow-sm dark:bg-brand-bark dark:border-brand-sage/20",
  elevated: "bg-white border border-brand-sage/10 shadow-md dark:bg-brand-bark dark:border-brand-sage/20",
  outlined: "bg-transparent border border-brand-sage/20 dark:border-brand-sage/30",
  interactive:
    "bg-white border border-brand-sage/10 shadow-sm transition-all duration-200 active:scale-[0.98] hover:shadow-md cursor-pointer dark:bg-brand-bark dark:border-brand-sage/20",
};

export function Card({
  children,
  variant = "default",
  className,
  onClick,
}: CardProps) {
  const Component = onClick ? "button" : "div";
  return (
    <Component
      onClick={onClick}
      className={cn(
        "w-full rounded-xl p-4 text-left",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </Component>
  );
}

export function CardHeader({ children, className }: CardHeaderProps) {
  return (
    <div className={cn("mb-3", className)}>
      {children}
    </div>
  );
}

export function CardContent({ children, className }: CardContentProps) {
  return <div className={cn("", className)}>{children}</div>;
}

export function CardFooter({ children, className }: CardFooterProps) {
  return (
    <div className={cn("mt-4 pt-3 border-t border-brand-sage/10", className)}>
      {children}
    </div>
  );
}
