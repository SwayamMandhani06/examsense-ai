import { HTMLAttributes } from "react";

type BadgeVariant =
  | "purple"
  | "blue"
  | "green"
  | "yellow"
  | "red"
  | "cyan"
  | "neutral"
  | "outline";
type BadgeSize = "sm" | "md";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  purple:
    "bg-primary/10 text-primary-light border-primary/25 shadow-[0_0_12px_rgba(139,92,246,0.15)]",
  blue:
    "bg-accent/10 text-indigo-400 border-accent/25 shadow-[0_0_12px_rgba(99,102,241,0.15)]",
  green:
    "bg-success/10 text-emerald-400 border-success/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]",
  yellow:
    "bg-warning/10 text-amber-400 border-warning/25 shadow-[0_0_12px_rgba(245,158,11,0.15)]",
  red:
    "bg-danger/10 text-rose-400 border-danger/25 shadow-[0_0_12px_rgba(239,68,68,0.15)]",
  cyan:
    "bg-accent-cyan/10 text-cyan-400 border-accent-cyan/25 shadow-[0_0_12px_rgba(6,182,212,0.15)]",
  neutral:
    "bg-surface text-text-muted border-border",
  outline:
    "bg-transparent text-text border-border hover:border-border-hover",
};

const dotColors: Record<BadgeVariant, string> = {
  purple: "bg-primary-light",
  blue: "bg-indigo-400",
  green: "bg-emerald-400",
  yellow: "bg-amber-400",
  red: "bg-rose-400",
  cyan: "bg-cyan-400",
  neutral: "bg-text-muted",
  outline: "bg-text-subtle",
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: "px-2 py-0.5 text-[11px] font-semibold gap-1.5",
  md: "px-2.5 py-1 text-xs font-semibold gap-1.5",
};

export function Badge({
  className = "",
  variant = "neutral",
  size = "md",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border leading-none select-none transition-colors ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotColors[variant]}`} />}
      {children}
    </span>
  );
}
