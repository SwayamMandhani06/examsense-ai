import { ReactNode } from "react";
import { Card } from "./Card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: ReactNode;
  description?: string;
}

export function StatCard({
  label,
  value,
  change,
  changeType = "neutral",
  icon,
  description,
}: StatCardProps) {
  return (
    <Card className="relative overflow-hidden group hover:border-primary/40 transition-all duration-300">
      {/* Ambient background aura */}
      <div className="absolute -top-10 -right-10 w-24 h-24 bg-primary/10 rounded-full blur-2xl group-hover:bg-primary/20 transition-all duration-300 pointer-events-none" />

      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">
            {label}
          </p>
        </div>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary/10 text-primary-light border border-primary/20 group-hover:scale-110 transition-transform duration-200">
          {icon}
        </div>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <h4 className="font-display text-2xl lg:text-3xl font-extrabold tracking-tight text-text">
          {value}
        </h4>
      </div>

      {(change || description) && (
        <div className="flex items-center gap-2 pt-2 border-t border-border/60 text-xs">
          {change && (
            <span
              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full ${
                changeType === "up"
                  ? "bg-success/10 text-emerald-400 border border-success/20"
                  : changeType === "down"
                  ? "bg-danger/10 text-rose-400 border border-danger/20"
                  : "bg-surface text-text-muted border border-border"
              }`}
            >
              {changeType === "up" && <TrendingUp size={11} />}
              {changeType === "down" && <TrendingDown size={11} />}
              {changeType === "neutral" && <Minus size={11} />}
              {change}
            </span>
          )}
          {description && <span className="text-text-muted truncate">{description}</span>}
        </div>
      )}
    </Card>
  );
}
