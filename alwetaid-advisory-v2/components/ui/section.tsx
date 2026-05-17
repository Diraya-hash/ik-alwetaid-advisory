import * as React from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends React.HTMLAttributes<HTMLElement> {
  containerClassName?: string;
  tone?: "default" | "subtle" | "dark" | "sand";
}

const tones = {
  default: "bg-canvas",
  subtle: "bg-canvas-subtle",
  dark: "bg-emerald text-canvas",
  sand: "bg-sand-50",
};

export function Section({
  className,
  containerClassName,
  tone = "default",
  children,
  ...props
}: SectionProps) {
  return (
    <section
      className={cn("relative py-20 lg:py-28", tones[tone], className)}
      {...props}
    >
      <div
        className={cn(
          "relative max-w-6xl mx-auto px-6 lg:px-10",
          containerClassName
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function SectionEyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "text-[11px] uppercase tracking-[0.22em] text-emerald/70 font-medium mb-5 inline-flex items-center gap-2",
        className
      )}
    >
      <span className="h-px w-6 bg-emerald/40" />
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  className,
  as: As = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <As
      className={cn(
        "font-display text-display-md font-medium text-ink leading-tight tracking-tighter max-w-3xl",
        className
      )}
    >
      {children}
    </As>
  );
}
