"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import {
  BookOpen,
  FileText,
  HelpCircle,
  Target,
  Sparkles,
  ArrowRight,
  Plus,
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  Zap,
} from "lucide-react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/StatCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DifficultyTrendChart } from "@/components/charts/DifficultyTrendChart";
import { subjects, analytics } from "@/lib/api";
import { formatRelativeTime } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { getUserDisplayName } from "@/lib/auth";

const MOCK_TREND = [
  { paper: "2019", easy: 12, medium: 8, hard: 5 },
  { paper: "2020", easy: 10, medium: 10, hard: 5 },
  { paper: "2021", easy: 14, medium: 7, hard: 4 },
  { paper: "2022", easy: 11, medium: 9, hard: 6 },
  { paper: "2023", easy: 15, medium: 6, hard: 4 },
  { paper: "2024", easy: 13, medium: 8, hard: 5 },
];

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();

  const { data: subjectsList = [] } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjects.getAll,
  });

  const seedMutation = useMutation({
    mutationFn: analytics.seedDemoData,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-summary"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-trend"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-topics"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-units"] });
      queryClient.invalidateQueries({ queryKey: ["analytics-repeated"] });
      toast.success(data.message || "Academic demo data populated successfully!");
    },
    onError: () => toast.error("Failed to seed demo data"),
  });

  const { data: summary } = useQuery({
    queryKey: ["analytics-summary"],
    queryFn: () => analytics.getSummary(),
  });

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.08 } },
  };
  const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-6 lg:p-8 relative overflow-hidden border border-primary/25 bg-gradient-to-r from-primary/10 via-accent/5 to-surface/40"
      >
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <Badge variant="purple" size="sm" dot>
                {isAdmin ? "Admin Workspace" : `B.Tech Year ${user?.btechYear || "All"}`}
              </Badge>
              <span className="text-xs text-text-muted">· Spring Semester</span>
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text tracking-tight">
              Welcome back, <span className="gradient-text">{getUserDisplayName(user)}</span> 👋
            </h1>
            <p className="text-xs sm:text-sm text-text-muted leading-relaxed">
              Your academic intelligence hub is active. Review upcoming paper predictions, inspect recurring topic signals, or query your Groq-powered AI tutor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => router.push("/ask-ai")}
              leftIcon={<Sparkles size={16} />}
            >
              Ask AI Tutor
            </Button>
            {isAdmin ? (
              <Button
                variant="secondary"
                onClick={() => router.push("/admin")}
                leftIcon={<Plus size={16} />}
              >
                Upload Paper
              </Button>
            ) : (
              <Button
                variant="secondary"
                onClick={() => router.push("/subjects")}
                leftIcon={<BookOpen size={16} />}
              >
                Browse Subjects
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Stat Cards */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Subjects"
            value={subjectsList.length}
            change="Active Curriculum"
            changeType="neutral"
            icon={<BookOpen size={18} />}
            description="Organized by year"
          />
          <StatCard
            label="Study Materials"
            value={summary?.totalMaterials ?? 0}
            change="PDFs Indexed"
            changeType="up"
            icon={<FileText size={18} />}
            description="Dense Vector Chunks"
          />
          <StatCard
            label="Analyzed Questions"
            value={summary?.totalQuestions ?? 0}
            change="Taxonomy Tagged"
            changeType="up"
            icon={<HelpCircle size={18} />}
            description="Multi-year exams"
          />
          <StatCard
            label="Top Recurring Topic"
            value={summary?.mostRepeatedTopic || "Synchronization"}
            change="Highest Weightage"
            changeType="neutral"
            icon={<Target size={18} />}
            description="Predicted Priority"
          />
        </motion.div>

        {/* Charts & Quick Actions Row */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Difficulty Trend Visualization */}
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-display text-base font-bold text-text">
                      Historical Difficulty Trend
                    </h3>
                    <p className="text-xs text-text-muted">
                      Difficulty balance progression across historical semester papers
                    </p>
                  </div>
                  <Button
                    size="xs"
                    variant="ghost"
                    onClick={() => router.push("/analytics")}
                    rightIcon={<ArrowRight size={12} />}
                  >
                    View Analytics
                  </Button>
                </div>
                <div className="pt-4">
                  <DifficultyTrendChart data={MOCK_TREND} />
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-text-muted">
                <span className="flex items-center gap-1.5 font-medium">
                  <Zap size={14} className="text-primary-light" /> Groq AI Taxonomy Active
                </span>
                <span>Updated in real-time</span>
              </div>
            </Card>
          </div>

          {/* Quick Hub / Recent Subjects */}
          <div className="space-y-4">
            <Card className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-display text-base font-bold text-text">
                  Your Subjects
                </h3>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => router.push("/subjects")}
                >
                  All ({subjectsList.length}) →
                </Button>
              </div>

              <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[320px] pr-1">
                {subjectsList.length === 0 ? (
                  <div className="text-center py-8 px-2 space-y-3">
                    <p className="text-xs text-text-muted">
                      No curriculum data indexed yet.
                    </p>
                    <Button
                      size="xs"
                      variant="primary"
                      onClick={() => seedMutation.mutate()}
                      isLoading={seedMutation.isPending}
                      leftIcon={<Sparkles size={13} />}
                      className="w-full"
                    >
                      Seed 4 B.Tech Subjects & Analytics
                    </Button>
                  </div>
                ) : (
                  subjectsList.slice(0, 4).map((sub) => (
                    <div
                      key={sub.id}
                      onClick={() => router.push(`/subjects/${sub.id}`)}
                      className="p-3.5 rounded-2xl bg-surface/70 border border-border hover:border-primary/40 hover:bg-surface transition-all cursor-pointer flex items-center justify-between gap-3 group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-sm font-bold text-primary-light group-hover:scale-105 transition-transform shrink-0">
                          📚
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text truncate group-hover:text-primary-light transition-colors">
                            {sub.name}
                          </p>
                          <p className="text-[11px] text-text-muted mt-0.5">
                            Year {sub.year} · {sub.materialCount ?? 0} materials
                          </p>
                        </div>
                      </div>
                      <ArrowRight size={14} className="text-text-subtle group-hover:text-primary-light group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  ))
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full mt-4"
                onClick={() => router.push("/subjects")}
              >
                Browse All Subjects
              </Button>
            </Card>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
