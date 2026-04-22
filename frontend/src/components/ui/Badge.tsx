import { cn } from "@/lib/utils";

type BadgeVariant = "purple" | "green" | "yellow" | "red" | "blue" | "default";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  purple: "bg-primary/15 text-[#a78bfa] border border-primary/30",
  green: "bg-success/12 text-[#4ade80] border border-success/25",
  yellow: "bg-warning/12 text-[#fbbf24] border border-warning/25",
  red: "bg-danger/12 text-[#f87171] border border-danger/25",
  blue: "bg-accent/15 text-[#818cf8] border border-accent/30",
  default: "bg-surface text-text-muted border border-border",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide",
        variantClasses[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
