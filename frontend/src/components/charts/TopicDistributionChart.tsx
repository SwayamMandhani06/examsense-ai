"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { TopicDistributionItem } from "@/types/analytics";
import { CHART_COLORS } from "@/lib/constants";

interface Props {
  data: TopicDistributionItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-semibold text-text mb-1">{label}</p>
      <p className="text-text-muted">Count: <span className="text-text font-medium">{payload[0].value}</span></p>
    </div>
  );
};

export function TopicDistributionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3A" horizontal={true} vertical={false} />
        <XAxis dataKey="topic" tick={{ fill: "#9CA3AF", fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
