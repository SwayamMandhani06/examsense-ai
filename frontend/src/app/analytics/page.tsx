"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { analytics, subjects as subjectsApi } from "@/lib/api";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  TrendingUp,
  BookOpen,
  Zap,
  Target,
  ChevronDown,
  AlertCircle,
  HelpCircle,
  BarChart3,
  Layers,
  Sparkles,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";
import { Button } from "@/components/ui/Button";

// Custom Tooltip with Theme Compatibility
const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card rounded-xl p-3 border border-border text-xs text-text shadow-card">
      <p className="font-bold text-text mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-1">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: p.color || p.stroke || "#7C3AED" }}
          />
          <span className="text-text-muted capitalize">{p.dataKey || p.name}:</span>
          <span className="font-bold text-text">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const { data: subjectList = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.getAll,
  });

  useEffect(() => {
    if (subjectList.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjectList[0].id);
    }
  }, [subjectList, selectedSubjectId]);

  const subjectIdNum = selectedSubjectId;

  const { data: trendRaw = [] } = useQuery({
    queryKey: ["analytics-trend", subjectIdNum],
    queryFn: () => analytics.getDifficultyTrend(subjectIdNum),
    enabled: !!subjectIdNum,
  });

  const { data: topicsRaw = [] } = useQuery({
    queryKey: ["analytics-topics", subjectIdNum],
    queryFn: () => analytics.getTopicDistribution(subjectIdNum),
    enabled: !!subjectIdNum,
  });

  const { data: unitsRaw = [] } = useQuery({
    queryKey: ["analytics-units", subjectIdNum],
    queryFn: () => analytics.getUnitDistribution(subjectIdNum),
    enabled: !!subjectIdNum,
  });

  const { data: diffRaw = [] } = useQuery({
    queryKey: ["analytics-diff", subjectIdNum],
    queryFn: () => analytics.getDifficultyDistribution(subjectIdNum),
    enabled: !!subjectIdNum,
  });

  const { data: repeatedRaw = [] } = useQuery({
    queryKey: ["analytics-repeated", subjectIdNum],
    queryFn: () => analytics.getRepeatedQuestions(subjectIdNum),
    enabled: !!subjectIdNum,
  });

  const { data: summaryRaw } = useQuery({
    queryKey: ["analytics-summary", subjectIdNum],
    queryFn: () => analytics.getSummary(subjectIdNum),
    enabled: !!subjectIdNum,
  });

  // Normalization
  const trendData = trendRaw.map((d: any) => ({
    year: String(d.year ?? d.paper ?? ""),
    easy: d.easy ?? 0,
    medium: d.medium ?? 0,
    hard: d.hard ?? 0,
  }));

  const topicsData = topicsRaw.map((d: any) => ({
    topic: d.topic ?? "General",
    count: d.count ?? d.frequency ?? 0,
  }));

  const unitsData = unitsRaw.map((d: any) => ({
    unit: `Unit ${d.unit ?? "?"}`,
    count: d.count ?? d.frequency ?? 0,
  }));

  const diffData = diffRaw.map((d: any) => ({
    name: (d.difficulty ?? d.name ?? "").charAt(0).toUpperCase() + (d.difficulty ?? d.name ?? "").slice(1),
    value: d.count ?? d.frequency ?? 0,
    difficulty: d.difficulty ?? "",
  }));

  const totalQ = summaryRaw?.total_questions ?? summaryRaw?.totalQuestions ?? repeatedRaw.length;
  const totalEasy = summaryRaw?.easy ?? diffData.find((d: any) => d.difficulty === "easy")?.value ?? 0;
  const totalHard = summaryRaw?.hard ?? diffData.find((d: any) => d.difficulty === "hard")?.value ?? 0;

  const DIFF_COLORS: Record<string, string> = { Easy: "#10B981", Medium: "#F59E0B", Hard: "#EF4444" };
  const PALETTE = ["#7C3AED", "#6366F1", "#06B6D4", "#8B5CF6", "#A78BFA", "#4F46E5", "#10B981"];

  const hasData = trendData.length > 0 || topicsData.length > 0 || repeatedRaw.length > 0;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & Subject Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="purple" size="sm">
              Intelligence Radar
            </Badge>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text tracking-tight">
            Exam Analytics & Forecasting
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Multi-year difficulty trends, syllabus weightages, and recurring question signals.
          </p>
        </div>

        {/* Subject Filter Dropdown */}
        <div className="relative w-full sm:w-72">
          <select
            value={selectedSubjectId}
            onChange={(e) => setSelectedSubjectId(e.target.value)}
            className="w-full px-4 py-2.5 bg-card border border-border rounded-2xl text-xs font-bold text-text focus:outline-none focus:border-primary shadow-sm appearance-none cursor-pointer pr-10"
          >
            {subjectList.map((s: any) => (
              <option key={s.id} value={s.id}>
                {s.name} (Year {s.year})
              </option>
            ))}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
          />
        </div>
      </div>

      {/* No Data Alert */}
      {!hasData && selectedSubjectId && (
        <div className="p-4 rounded-2xl bg-warning/10 border border-warning/25 text-xs text-amber-500 flex items-center gap-3">
          <AlertCircle size={18} className="shrink-0" />
          <span>
            No analytics extracted for this subject yet. Upload PDF past exam papers in the Subject view to populate charts.
          </span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Questions"
          value={totalQ}
          icon={<HelpCircle size={18} />}
          description="Extracted from papers"
        />
        <StatCard
          label="Topics Indexed"
          value={topicsData.length}
          icon={<Layers size={18} />}
          description="Syllabus coverage"
        />
        <StatCard
          label="Easy Questions"
          value={totalEasy}
          icon={<Zap size={18} />}
          description="Foundational marks"
        />
        <StatCard
          label="Hard Questions"
          value={totalHard}
          icon={<Target size={18} />}
          description="High-yield challenges"
        />
      </div>

      {/* Row 1: Difficulty Trend & Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2">
          <Card>
            <h3 className="font-display text-base font-bold text-text mb-1">
              Historical Difficulty Progression
            </h3>
            <p className="text-xs text-text-muted mb-4">
              Easy, Medium, and Hard balance across exam years
            </p>

            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="year" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GlassTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                  <Line type="monotone" dataKey="easy" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Easy" />
                  <Line type="monotone" dataKey="medium" stroke="#F59E0B" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Medium" />
                  <Line type="monotone" dataKey="hard" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Hard" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-16 text-xs text-text-muted">
                No difficulty trend records available.
              </div>
            )}
          </Card>
        </div>

        {/* Difficulty Donut */}
        <Card>
          <h3 className="font-display text-base font-bold text-text mb-1">
            Difficulty Ratio
          </h3>
          <p className="text-xs text-text-muted mb-4">Overall breakdown percentage</p>

          {diffData.length > 0 ? (
            <div className="space-y-4">
              <ResponsiveContainer width="100%" height={140}>
                <PieChart>
                  <Pie
                    data={diffData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {diffData.map((d: any, i: number) => (
                      <Cell key={i} fill={DIFF_COLORS[d.name] || "#7C3AED"} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>

              <div className="space-y-2">
                {diffData.map((d: any, i: number) => {
                  const total = diffData.reduce((s: number, x: any) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={i} className="text-xs">
                      <div className="flex justify-between mb-1">
                        <span className="font-semibold text-text flex items-center gap-1.5">
                          <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ background: DIFF_COLORS[d.name] }}
                          />
                          {d.name}
                        </span>
                        <span className="font-bold font-mono">{pct}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-surface overflow-hidden">
                        <div
                          style={{ width: `${pct}%`, background: DIFF_COLORS[d.name] }}
                          className="h-full"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-xs text-text-muted">
              No breakdown records available.
            </div>
          )}
        </Card>
      </div>

      {/* Row 2: Topic & Unit Distributions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Topics */}
        <Card>
          <h3 className="font-display text-base font-bold text-text mb-1">
            Topic Frequency Breakdown
          </h3>
          <p className="text-xs text-text-muted mb-4">
            Most frequent topics appearing in questions
          </p>

          {topicsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topicsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis dataKey="topic" tick={{ fill: "#94A3B8", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {topicsData.map((_: any, i: number) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-xs text-text-muted">
              No topic frequency data available.
            </div>
          )}
        </Card>

        {/* Units */}
        <Card>
          <h3 className="font-display text-base font-bold text-text mb-1">
            Unit Distribution (Modules 1 - 5)
          </h3>
          <p className="text-xs text-text-muted mb-4">
            Total questions categorized per syllabus unit
          </p>

          {unitsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={unitsData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="unit" tick={{ fill: "#94A3B8", fontSize: 11 }} axisLine={false} tickLine={false} width={60} />
                <Tooltip content={<GlassTooltip />} />
                <Bar dataKey="count" radius={[0, 6, 6, 0]}>
                  {unitsData.map((_: any, i: number) => (
                    <Cell key={i} fill={`hsl(${260 + i * 20}, 75%, 60%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-xs text-text-muted">
              No unit distribution data available.
            </div>
          )}
        </Card>
      </div>

      {/* Repeated Questions Radar */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display text-base font-bold text-text">
              High-Probability Recurring Questions
            </h3>
            <p className="text-xs text-text-muted">
              Questions appearing across multiple exam years — prime targets for revision
            </p>
          </div>
          <Badge variant="purple" size="sm">
            Top Targets
          </Badge>
        </div>

        {repeatedRaw.length === 0 ? (
          <div className="text-center py-12 text-xs text-text-muted">
            No recurring questions identified yet. Upload more past papers to compute repeat frequencies.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {repeatedRaw.slice(0, 8).map((q: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-2xl bg-surface/70 border border-border hover:border-primary/40 transition-all flex items-start gap-3"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 text-primary-light flex flex-col items-center justify-center font-bold text-xs shrink-0">
                  <span>{q.frequency || 1}x</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-text line-clamp-2">{q.question}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px]">
                    <span className="text-primary-light font-semibold">{q.topic || "General"}</span>
                    {q.unit && <span className="text-text-muted">· Unit {q.unit}</span>}
                    <Badge
                      variant={
                        q.difficulty === "hard"
                          ? "red"
                          : q.difficulty === "medium"
                          ? "yellow"
                          : "green"
                      }
                      size="sm"
                    >
                      {q.difficulty || "medium"}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
