"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { analytics, subjects as subjectsApi } from "@/lib/api";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, BookOpen, Zap, Target, ChevronDown, AlertCircle } from "lucide-react";

// ─── Animated Counter ────────────────────────────────────────────────────────
function AnimatedNumber({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const start = useRef(0);
  const startTime = useRef<number | null>(null);

  useEffect(() => {
    start.current = display;
    startTime.current = null;
    const animate = (ts: number) => {
      if (!startTime.current) startTime.current = ts;
      const progress = Math.min((ts - startTime.current) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(start.current + (value - start.current) * ease));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return <span>{display}</span>;
}

// ─── Custom Tooltips ──────────────────────────────────────────────────────────
const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(15,17,23,0.92)",
      border: "1px solid rgba(124,58,237,0.3)",
      borderRadius: 10,
      padding: "10px 14px",
      backdropFilter: "blur(12px)",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>
      <p style={{ color: "#E6E8EC", fontWeight: 600, fontSize: 12, marginBottom: 6 }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: p.color, display: "inline-block" }} />
          <span style={{ color: "#9CA3AF", fontSize: 11, textTransform: "capitalize" }}>{p.dataKey || p.name}:</span>
          <span style={{ color: "#E6E8EC", fontSize: 11, fontWeight: 600 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color, sub }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "linear-gradient(135deg, rgba(26,29,40,0.9) 0%, rgba(20,23,33,0.95) 100%)",
        border: `1px solid ${color}22`,
        borderRadius: 16,
        padding: "20px 22px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div style={{
        position: "absolute", top: -20, right: -20,
        width: 80, height: 80, borderRadius: "50%",
        background: `radial-gradient(circle, ${color}18 0%, transparent 70%)`,
      }} />
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <p style={{ color: "#6B7280", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>{label}</p>
          <p style={{ color: "#E6E8EC", fontSize: 28, fontWeight: 800, lineHeight: 1, fontFamily: "Syne, sans-serif" }}>
            <AnimatedNumber value={typeof value === "number" ? value : 0} />
          </p>
          {sub && <p style={{ color: "#6B7280", fontSize: 11, marginTop: 6 }}>{sub}</p>}
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </motion.div>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────
function GlassCard({ children, title, subtitle, accentColor = "#7C3AED" }: any) {
  return (
    <div style={{
      background: "linear-gradient(135deg, rgba(22,25,36,0.95) 0%, rgba(17,20,30,0.98) 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 18,
      padding: "22px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
      }} />
      {title && (
        <div style={{ marginBottom: 18 }}>
          <h3 style={{ color: "#E6E8EC", fontSize: 14, fontWeight: 700, fontFamily: "Syne, sans-serif", letterSpacing: "0.01em" }}>{title}</h3>
          {subtitle && <p style={{ color: "#6B7280", fontSize: 11, marginTop: 3 }}>{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 160, gap: 10 }}>
      <AlertCircle size={28} color="#374151" />
      <p style={{ color: "#4B5563", fontSize: 12, textAlign: "center" }}>{message}</p>
    </div>
  );
}

// ─── Main Analytics Page ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");

  const { data: subjectList = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjectsApi.getAll,
    refetchInterval: 10000,
  });

  useEffect(() => {
    if (subjectList.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(subjectList[0].id);
    }
  }, [subjectList, selectedSubjectId]);

  const subjectIdNum = selectedSubjectId;
  const { data: selectedSubjectRaw } = useQuery({
    queryKey: ["subject", subjectIdNum],
    queryFn: () => subjectsApi.getById(subjectIdNum),
    enabled: !!subjectIdNum,
    refetchInterval: (query) => {
      const mats = ((query.state.data as any)?.materials ?? []) as Array<{ processingStatus?: string }>;
      const hasInProgress = mats.some((m) => m.processingStatus === "queued" || m.processingStatus === "processing");
      return hasInProgress ? 3000 : 10000;
    },
  });
  const subjectMaterials = ((selectedSubjectRaw as any)?.materials ?? []) as Array<{ processingStatus?: string }>;
  const hasInProgressMaterial = subjectMaterials.some(
    (m) => m.processingStatus === "queued" || m.processingStatus === "processing"
  );
  const hasFailedMaterial = subjectMaterials.some((m) => m.processingStatus === "failed");

  const { data: trendRaw = [] } = useQuery({
    queryKey: ["analytics-trend", subjectIdNum],
    queryFn: () => analytics.getDifficultyTrend(subjectIdNum),
    enabled: !!subjectIdNum,
    refetchInterval: hasInProgressMaterial ? 3000 : 10000,
    refetchOnMount: "always",
  });

  const { data: topicsRaw = [] } = useQuery({
    queryKey: ["analytics-topics", subjectIdNum],
    queryFn: () => analytics.getTopicDistribution(subjectIdNum),
    enabled: !!subjectIdNum,
    refetchInterval: hasInProgressMaterial ? 3000 : 10000,
    refetchOnMount: "always",
  });

  const { data: unitsRaw = [] } = useQuery({
    queryKey: ["analytics-units", subjectIdNum],
    queryFn: () => analytics.getUnitDistribution(subjectIdNum),
    enabled: !!subjectIdNum,
    refetchInterval: hasInProgressMaterial ? 3000 : 10000,
    refetchOnMount: "always",
  });

  const { data: diffRaw = [] } = useQuery({
    queryKey: ["analytics-diff", subjectIdNum],
    queryFn: () => analytics.getDifficultyDistribution(subjectIdNum),
    enabled: !!subjectIdNum,
    refetchInterval: hasInProgressMaterial ? 3000 : 10000,
    refetchOnMount: "always",
  });

  const { data: repeatedRaw = [] } = useQuery({
    queryKey: ["analytics-repeated", subjectIdNum],
    queryFn: () => analytics.getRepeatedQuestions(subjectIdNum),
    enabled: !!subjectIdNum,
    refetchInterval: hasInProgressMaterial ? 3000 : 10000,
    refetchOnMount: "always",
  });

  const { data: summaryRaw } = useQuery({
    queryKey: ["analytics-summary", subjectIdNum],
    queryFn: () => analytics.getSummary(subjectIdNum),
    enabled: !!subjectIdNum,
    refetchInterval: hasInProgressMaterial ? 3000 : 10000,
    refetchOnMount: "always",
  });

  // Normalize data from backend (snake_case → usable)
  const trendData = trendRaw.map((d: any) => ({
    year: d.year ?? d.paper ?? "",
    easy: d.easy ?? 0,
    medium: d.medium ?? 0,
    hard: d.hard ?? 0,
  }));

  const topicsData = topicsRaw.map((d: any) => ({
    topic: d.topic ?? "Unknown",
    count: d.count ?? d.frequency ?? 0,
  }));

  const unitsData = unitsRaw.map((d: any) => ({
    unit: d.unit ?? "?",
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

  const DIFF_COLORS: Record<string, string> = { Easy: "#22C55E", Medium: "#F59E0B", Hard: "#EF4444" };
  const PALETTE = ["#7C3AED", "#6366F1", "#06B6D4", "#8B5CF6", "#A78BFA", "#4F46E5", "#10B981"];

  const hasData = trendData.length > 0 || topicsData.length > 0 || repeatedRaw.length > 0;

  return (
    <div style={{ padding: "24px 28px", minHeight: "100vh", background: "#0F1117" }}>

      {/* ── Header ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <div>
          <h1 style={{ color: "#E6E8EC", fontSize: 22, fontWeight: 800, fontFamily: "Syne, sans-serif", letterSpacing: "-0.02em" }}>
            Analytics
          </h1>
          <p style={{ color: "#4B5563", fontSize: 12, marginTop: 2 }}>
            Insights from your uploaded exam materials
          </p>
          {hasInProgressMaterial && (
            <p style={{ color: "#F59E0B", fontSize: 11, marginTop: 6 }}>
              Processing new uploads... charts update automatically.
            </p>
          )}
          {hasFailedMaterial && !hasInProgressMaterial && (
            <p style={{ color: "#EF4444", fontSize: 11, marginTop: 6 }}>
              Some uploaded PDFs failed to process. Re-upload clear text PDFs for best analytics.
            </p>
          )}
        </div>

        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ position: "relative" }}>
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              style={{
                appearance: "none",
                background: "rgba(26,29,40,0.9)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 10,
                color: "#E6E8EC",
                fontSize: 13,
                padding: "9px 36px 9px 14px",
                cursor: "pointer",
                outline: "none",
                minWidth: 220,
              }}
            >
              {subjectList.map((s: any) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <ChevronDown size={14} color="#6B7280" style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
          </div>
        </div>
      </div>

      {/* ── No data banner ── */}
      {!hasData && selectedSubjectId && (
        <div style={{
          background: "rgba(245,158,11,0.08)",
          border: "1px solid rgba(245,158,11,0.2)",
          borderRadius: 12,
          padding: "14px 18px",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <AlertCircle size={16} color="#F59E0B" />
          <p style={{ color: "#D97706", fontSize: 13 }}>
            No analytics data found for this subject yet. Upload past papers and run the question extractor to populate analytics.
          </p>
        </div>
      )}

      {/* ── Stat Cards ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 20 }}>
        <StatCard icon={BookOpen} label="Total Questions" value={totalQ} color="#7C3AED" sub="across all papers" />
        <StatCard icon={TrendingUp} label="Topics Covered" value={topicsData.length} color="#06B6D4" sub="unique topics" />
        <StatCard icon={Zap} label="Easy Questions" value={totalEasy} color="#22C55E" sub="approachable difficulty" />
        <StatCard icon={Target} label="Hard Questions" value={totalHard} color="#EF4444" sub="challenging questions" />
      </div>

      {/* ── Charts Row 1 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Difficulty Trend */}
        <GlassCard title="Difficulty Trend" subtitle="Question difficulty across exam years" accentColor="#7C3AED">
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <defs>
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                    <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                  </filter>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="year" tick={{ fill: "#4B5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4B5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, color: "#6B7280", paddingTop: 10 }} />
                <Line type="monotone" dataKey="easy" stroke="#22C55E" strokeWidth={2.5} dot={{ r: 4, fill: "#22C55E", filter: "url(#glow)" }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="medium" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3, fill: "#F59E0B" }} activeDot={{ r: 5 }} />
                <Line type="monotone" dataKey="hard" stroke="#EF4444" strokeWidth={2.5} dot={{ r: 4, fill: "#EF4444", filter: "url(#glow)" }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No difficulty trend data yet" />}
        </GlassCard>

        {/* Difficulty Distribution Donut */}
        <GlassCard title="Difficulty Split" subtitle="Overall question breakdown" accentColor="#06B6D4">
          {diffData.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
              <ResponsiveContainer width={140} height={170}>
                <PieChart>
                  <Pie data={diffData} cx="50%" cy="50%" innerRadius={45} outerRadius={68}
                    paddingAngle={3} dataKey="value" stroke="none">
                    {diffData.map((d: any, i: number) => (
                      <Cell key={i} fill={DIFF_COLORS[d.name] ?? "#7C3AED"} />
                    ))}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {diffData.map((d: any, i: number) => {
                  const total = diffData.reduce((s: number, x: any) => s + x.value, 0);
                  const pct = total > 0 ? Math.round((d.value / total) * 100) : 0;
                  return (
                    <div key={i}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                        <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9CA3AF" }}>
                          <span style={{ width: 8, height: 8, borderRadius: "50%", background: DIFF_COLORS[d.name], display: "inline-block" }} />
                          {d.name}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: DIFF_COLORS[d.name] }}>{pct}%</span>
                      </div>
                      <div style={{ height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2 }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: DIFF_COLORS[d.name], borderRadius: 2, transition: "width 1s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : <EmptyState message="No difficulty data yet" />}
        </GlassCard>
      </div>

      {/* ── Charts Row 2 ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>

        {/* Topic Distribution */}
        <GlassCard title="Topic Distribution" subtitle="Questions per topic" accentColor="#8B5CF6">
          {topicsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={topicsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal vertical={false} />
                <XAxis dataKey="topic" tick={{ fill: "#4B5563", fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#4B5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(124,58,237,0.05)" }} />
                <Bar dataKey="count" radius={[5, 5, 0, 0]}>
                  {topicsData.map((_: any, i: number) => (
                    <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No topic data yet" />}
        </GlassCard>

        {/* Unit Distribution */}
        <GlassCard title="Unit Distribution" subtitle="Questions per unit" accentColor="#06B6D4">
          {unitsData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={unitsData} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis type="number" tick={{ fill: "#4B5563", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="unit" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} width={50} />
                <Tooltip content={<GlassTooltip />} cursor={{ fill: "rgba(6,182,212,0.05)" }} />
                <Bar dataKey="count" radius={[0, 5, 5, 0]}>
                  {unitsData.map((_: any, i: number) => (
                    <Cell key={i} fill={`hsl(${185 + i * 15}, 70%, ${50 - i * 4}%)`} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <EmptyState message="No unit data yet" />}
        </GlassCard>
      </div>

      {/* ── Most Repeated Questions ── */}
      <GlassCard title="Most Repeated Questions" subtitle="High-frequency questions from past papers — likely exam targets" accentColor="#EF4444">
        {repeatedRaw.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {repeatedRaw.slice(0, 8).map((q: any, i: number) => {
              const freq = q.frequency ?? q.occurrences ?? 1;
              const diffColor = { easy: "#22C55E", medium: "#F59E0B", hard: "#EF4444" }[q.difficulty as string] ?? "#7C3AED";
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 14px",
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.05)",
                    borderRadius: 12,
                    cursor: "default",
                    transition: "border-color 0.2s",
                  }}
                  whileHover={{ borderColor: "rgba(124,58,237,0.3)" }}
                >
                  <div style={{
                    minWidth: 36, height: 36, borderRadius: 8,
                    background: `${diffColor}15`,
                    border: `1px solid ${diffColor}30`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexDirection: "column",
                  }}>
                    <span style={{ color: diffColor, fontSize: 13, fontWeight: 800, lineHeight: 1 }}>{freq}</span>
                    <span style={{ color: diffColor, fontSize: 8, opacity: 0.7 }}>×</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ color: "#D1D5DB", fontSize: 12, fontWeight: 500, lineHeight: 1.4,
                      overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                      {q.question}
                    </p>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
                      {q.topic && <span style={{ color: "#4B5563", fontSize: 10 }}>{q.topic}</span>}
                      {q.unit && <span style={{ color: "#374151", fontSize: 10 }}>· Unit {q.unit}</span>}
                      {q.difficulty && (
                        <span style={{
                          fontSize: 9, fontWeight: 700, textTransform: "uppercase",
                          letterSpacing: "0.06em", color: diffColor,
                          background: `${diffColor}15`, padding: "2px 6px", borderRadius: 4,
                        }}>{q.difficulty}</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <EmptyState message="No repeated questions found. Questions are identified when the AI processes your past papers." />
        )}
      </GlassCard>
    </div>
  );
}
