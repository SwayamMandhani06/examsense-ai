"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import type { UnitDistributionItem } from "@/types/analytics";

const UNIT_COLORS = ["#22C55E", "#22C55E", "#F59E0B", "#EF4444", "#EF4444"];

interface Props {
  data: UnitDistributionItem[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border rounded-lg px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-semibold text-text mb-1">{label}</p>
      <p className="text-text-muted">Questions: <span className="text-text font-medium">{payload[0].value}</span></p>
    </div>
  );
};

export function UnitDistributionChart({ data }: Props) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2A2F3A" horizontal={true} vertical={false} />
        <XAxis dataKey="unit" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={UNIT_COLORS[i % UNIT_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
