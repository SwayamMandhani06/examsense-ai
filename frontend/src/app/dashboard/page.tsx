"use client";

import { useQuery } from "@tanstack/react-query";
import { BookOpen, FileText, HelpCircle, Target } from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DifficultyTrendChart } from "@/components/charts/DifficultyTrendChart";
import { subjects, analytics } from "@/lib/api";
import { formatRelativeTime, getDifficultyVariant } from "@/lib/utils";

// Mock fallback data for demo
const MOCK_TREND = [
  { paper: "2019", easy: 12, medium: 8, hard: 5 },
  { paper: "2020", easy: 10, medium: 10, hard: 5 },
  { paper: "2021", easy: 14, medium: 7, hard: 4 },
  { paper: "2022", easy: 11, medium: 9, hard: 6 },
  { paper: "2023", easy: 15, medium: 6, hard: 4 },
  { paper: "2024", easy: 13, medium: 8, hard: 5 },
];

const MOCK_UPLOADS = [
  { id: "1", title: "DS_2023_Nov_Paper.pdf", subject: "Data Structures", unit: "Unit 3", uploadedAt: new Date(Date.now() - 2 * 3600000).toISOString() },
  { id: "2", title: "DBMS_Previous_5Years.pdf", subject: "Database Management", unit: "Multiple units", uploadedAt: new Date(Date.now() - 5 * 3600000).toISOString() },
  { id: "3", title: "OS_Chapter7_Notes.pdf", subject: "Operating Systems", unit: "Unit 7", uploadedAt: new Date(Date.now() - 26 * 3600000).toISOString() },
  { id: "4", title: "CN_2022_MidSem.pdf", subject: "Computer Networks", unit: "Unit 1-4", uploadedAt: new Date(Date.now() - 48 * 3600000).toISOString() },
];

export default function DashboardPage() {
  const { data: subjectsList } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjects.getAll,
  });

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => analytics.getSummary(),
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.07 } },
  };
  const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-7">
      <motion.div variants={container} initial="hidden" animate="show">
        {/* Stat Cards */}
        <motion.div variants={item} className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Total Subjects"
            value={subjectsList?.length ?? 12}
            change="↑ 2 this semester"
            changeType="up"
            icon={<BookOpen size={14} />}
          />
          <StatCard
            label="Study Materials"
            value={summary?.totalMaterials ?? 86}
            change="↑ 14 this week"
            changeType="up"
            icon={<FileText size={14} />}
          />
          <StatCard
            label="Questions Analyzed"
            value={summary?.totalQuestions ? `${(summary.totalQuestions / 1000).toFixed(1)}K` : "1.4K"}
            change="Across all subjects"
            changeType="neutral"
            icon={<HelpCircle size={14} />}
          />
          <StatCard
            label="Top Topic"
            value={summary?.mostRepeatedTopic ?? "Trees & Graphs"}
            change="In Data Structures"
            changeType="neutral"
            icon={<Target size={14} />}
          />
        </motion.div>

        {/* Charts row */}
        <motion.div variants={item} className="grid grid-cols-[2fr_1fr] gap-4">
          {/* Difficulty Trend */}
          <Card>
            <h3 className="font-display text-sm font-bold mb-1">Difficulty Trend</h3>
            <p className="text-xs text-text-muted mb-5">Question difficulty across 6 papers</p>
            <DifficultyTrendChart data={MOCK_TREND} />
          </Card>

          {/* Recent Uploads */}
          <Card>
            <h3 className="font-display text-sm font-bold mb-1">Recent Uploads</h3>
            <p className="text-xs text-text-muted mb-4">Latest materials added to your library</p>
            <div className="space-y-2.5">
              {MOCK_UPLOADS.map((upload) => (
                <div key={upload.id} className="flex items-center gap-3 px-3.5 py-3 bg-surface rounded-lg border border-transparent hover:border-border transition-colors">
                  <div className="w-9 h-9 rounded-lg bg-primary/12 flex items-center justify-center text-base flex-shrink-0">
                    📄
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold truncate">{upload.title}</p>
                    <p className="text-[11px] text-text-muted mt-0.5">{upload.subject} · {upload.unit}</p>
                  </div>
                  <span className="text-[11px] text-text-muted flex-shrink-0">
                    {formatRelativeTime(upload.uploadedAt)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
