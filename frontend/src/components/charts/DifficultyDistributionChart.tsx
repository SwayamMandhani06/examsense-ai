"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import type { DifficultyDistributionItem } from "@/types/analytics";
import { DIFFICULTY_COLORS } from "@/lib/constants";

interface Props {
  data: DifficultyDistributionItem[];
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload?.length) return null;
  const d = payload[0];
  return (
    <div className="bg-card border border-border rounded-lg px-3.5 py-2.5 text-xs shadow-xl">
      <p className="font-semibold text-text capitalize mb-1">{d.name}</p>
      <p className="text-text-muted">Count: <span className="text-text font-medium">{d.value}</span></p>
      <p className="text-text-muted">Share: <span className="text-text font-medium">{d.payload.percentage}%</span></p>
    </div>
  );
};

const RADIAN = Math.PI / 180;
const renderLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percentage }: any) => {
  const r = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return percentage > 8 ? (
    <text x={x} y={y} fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={700}>
      {`${percentage}%`}
    </text>
  ) : null;
};

export function DifficultyDistributionChart({ data }: Props) {
  return (
    <div className="flex items-center gap-6">
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={70}
            dataKey="count"
            nameKey="difficulty"
            labelLine={false}
            label={renderLabel}
          >
            {data.map((entry, i) => (
              <Cell key={i} fill={DIFFICULTY_COLORS[entry.difficulty]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      <div className="space-y-2.5">
        {data.map((d) => (
          <div key={d.difficulty} className="flex items-center gap-2.5 text-sm">
            <span
              className="w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ background: DIFFICULTY_COLORS[d.difficulty] }}
            />
            <span className="text-text-muted capitalize">{d.difficulty}</span>
            <span className="ml-auto pl-4 text-text font-semibold">{d.percentage}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
