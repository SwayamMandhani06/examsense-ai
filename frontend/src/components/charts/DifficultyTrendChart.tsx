"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import type { DifficultyTrendPoint } from "@/types/analytics";
import { DIFFICULTY_COLORS } from "@/lib/constants";

interface Props {
  data: DifficultyTrendPoint[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-semibold mb-1.5 text-text">{label}</p>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 mb-0.5">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-text-muted capitalize">{p.dataKey}:</span>
          <span className="text-text font-medium">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export function DifficultyTrendChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3A" vertical={false} />
        <XAxis dataKey="paper" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: "#9CA3AF", paddingTop: 12 }} />
        <Line type="monotone" dataKey="easy" stroke={DIFFICULTY_COLORS.easy} strokeWidth={2.5} dot={{ r: 4, fill: DIFFICULTY_COLORS.easy }} activeDot={{ r: 6 }} />
        <Line type="monotone" dataKey="medium" stroke={DIFFICULTY_COLORS.medium} strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} activeDot={{ r: 5 }} />
        <Line type="monotone" dataKey="hard" stroke={DIFFICULTY_COLORS.hard} strokeWidth={2.5} dot={{ r: 4, fill: DIFFICULTY_COLORS.hard }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
