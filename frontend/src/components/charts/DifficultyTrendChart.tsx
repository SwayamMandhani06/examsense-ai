"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { DifficultyTrendPoint } from "@/types/analytics";
import { DIFFICULTY_COLORS } from "@/lib/constants";

interface Props {
  data: DifficultyTrendPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-border text-xs text-text shadow-card">
      <p className="font-bold mb-1.5 text-text">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-muted capitalize">{p.dataKey}:</span>
          <span className="text-text font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function DifficultyTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
        <XAxis dataKey="paper" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
        <Line
          type="monotone"
          dataKey="easy"
          stroke="#10B981"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#10B981" }}
          activeDot={{ r: 6 }}
          name="Easy"
        />
        <Line
          type="monotone"
          dataKey="medium"
          stroke="#F59E0B"
          strokeWidth={2}
          strokeDasharray="4 4"
          dot={{ r: 3, fill: "#F59E0B" }}
          activeDot={{ r: 5 }}
          name="Medium"
        />
        <Line
          type="monotone"
          dataKey="hard"
          stroke="#EF4444"
          strokeWidth={2.5}
          dot={{ r: 4, fill: "#EF4444" }}
          activeDot={{ r: 6 }}
          name="Hard"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
