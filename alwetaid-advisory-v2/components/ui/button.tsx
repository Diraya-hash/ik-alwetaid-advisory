"use client";

import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline" | "sand";
type Size = "sm" | "md" | "lg";

interface ButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  variant?: Variant;
  size?: Size;
  href?: string;
  type?: "button" | "submit" | "reset";
}

const variants: Record<Variant, string> = {
  primary: "bg-emerald text-canvas hover:bg-emerald-600",
  secondary: "bg-ink text-canvas hover:bg-ink-700",
  ghost: "text-emerald hover:bg-emerald-50",
  outline:
    "border border-emerald/20 text-emerald bg-transparent hover:bg-emerald-50 hover:border-emerald/40",
  sand: "bg-sand-100 text-emerald hover:bg-sand-200",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-4 text-[13px]",
  md: "h-11 px-6 text-[14px]",
  lg: "h-12 px-7 text-[15px]",
};

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium tracking-tight transition-all disabled:opacity-50 disabled:pointer-events-none";

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", href, ...props }, ref) => {
    const classes = cn(base, variants[variant], sizes[size], className);

    if (href) {
      const isExternal = href.startsWith("http") || href.startsWith("mailto:");
      if (isExternal) {
        return (
          <a href={href} className={classes}>
            {props.children}
          </a>
        );
      }
      return (
        <Link href={href} className={classes}>
          {props.children}
        </Link>
      );
    }

    return <button ref={ref} className={classes} {...props} />;
  }
);
Button.displayName = "Button";
