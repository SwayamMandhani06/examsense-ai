"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { UnitDistributionItem } from "@/types/analytics";

interface Props {
  data: UnitDistributionItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-border text-xs text-text shadow-card">
      <p className="font-bold text-text mb-1">{label}</p>
      <p className="text-text-muted">
        Questions: <span className="font-bold text-primary-light">{payload[0].value}</span>
      </p>
    </div>
  );
};

export function UnitDistributionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal vertical={false} />
        <XAxis dataKey="unit" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={`hsl(${260 + i * 25}, 80%, 65%)`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
