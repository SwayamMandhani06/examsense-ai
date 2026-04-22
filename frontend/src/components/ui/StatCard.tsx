import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon?: React.ReactNode;
  className?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  className,
}: StatCardProps) {
  const changeColor =
    changeType === "up"
      ? "text-success"
      : changeType === "down"
      ? "text-danger"
      : "text-text-muted";

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wide">{label}</span>
        {icon && (
          <span className="text-text-muted">{icon}</span>
        )}
      </div>
      <div className="font-display text-[28px] font-extrabold leading-none mb-1.5 tracking-tight">
        {value}
      </div>
      {change && (
        <p className={cn("text-xs", changeColor)}>{change}</p>
      )}
    </div>
  );
}
