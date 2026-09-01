"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { subjects, analytics } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import {
  ArrowLeft,
  FileText,
  Download,
  Loader2,
  Sparkles,
  BarChart3,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Clock,
  Layers,
  HelpCircle,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { DifficultyTrendChart } from "@/components/charts/DifficultyTrendChart";
import { TopicDistributionChart } from "@/components/charts/TopicDistributionChart";
import { UnitDistributionChart } from "@/components/charts/UnitDistributionChart";
import { DifficultyDistributionChart } from "@/components/charts/DifficultyDistributionChart";

const TABS = [
  { id: "Materials", label: "Study Materials", icon: FileText },
  { id: "Analytics", label: "Analytics Overview", icon: BarChart3 },
  { id: "Questions", label: "Extracted Exam Questions", icon: HelpCircle },
] as const;

type Tab = (typeof TABS)[number]["id"];

function MaterialCard({ material }: { material: any }) {
  const isPastPaper = material.materialType === "past_paper";
  const isQueued = material.processingStatus === "queued";
  const isProcessing = material.processingStatus === "processing";
  const isFailed = material.processingStatus === "failed";
  const isCompleted = material.processingStatus === "completed";

  return (
    <div className="glass-card rounded-2xl p-4 border border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-primary/40 transition-all">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isPastPaper ? "bg-primary/10 text-primary-light border border-primary/20" : "bg-accent-cyan/10 text-cyan-400 border border-accent-cyan/20"
          }`}
        >
          <FileText size={20} />
        </div>

        <div className="min-w-0">
          <p className="text-sm font-bold text-text truncate">{material.title}</p>
          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-text-muted">
            <span>Year {material.year ?? "All"}</span>
            <span>·</span>
            <span>{isPastPaper ? "Past Exam Paper" : "Lecture Notes"}</span>
            {material.size > 0 && (
              <>
                <span>·</span>
                <span>{(material.size / 1024 / 1024).toFixed(1)} MB</span>
              </>
            )}
          </div>

          {/* Processing Status Badge */}
          <div className="mt-1.5 flex items-center gap-1.5 text-xs font-semibold">
            {isQueued && (
              <span className="text-amber-400 flex items-center gap-1 text-[11px]">
                <Clock size={12} className="animate-spin" /> Queued for AI extraction...
              </span>
            )}
            {isProcessing && (
              <span className="text-primary-light flex items-center gap-1 text-[11px]">
                <Loader2 size={12} className="animate-spin" /> Groq AI extracting taxonomy & embeddings...
              </span>
            )}
            {isFailed && (
              <span className="text-rose-400 flex items-center gap-1 text-[11px]">
                <AlertCircle size={12} /> {material.processingError || "Processing failed"}
              </span>
            )}
            {isCompleted && (
              <span className="text-emerald-400 flex items-center gap-1 text-[11px]">
                <CheckCircle2 size={12} /> Indexed & Grounded
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
        <Badge variant={isPastPaper ? "purple" : "cyan"} size="sm">
          {isPastPaper ? "Past Paper" : "Notes"}
        </Badge>

        <a
          href={`${API_BASE_URL}${material.fileUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-xl border border-border bg-surface hover:bg-hover text-text-muted hover:text-primary-light transition-colors"
          title="Download PDF"
        >
          <Download size={16} />
        </a>
      </div>
    </div>
  );
}

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Materials");

  const subId = String(subjectId);

  const { data: subject, isLoading, error } = useQuery({
    queryKey: ["subject", subId],
    queryFn: () => subjects.getById(subId),
    refetchInterval: (query) => {
      const mats = ((query.state.data as any)?.materials ?? []) as Array<{ processingStatus?: string }>;
      const hasInProgress = mats.some((m) => m.processingStatus === "queued" || m.processingStatus === "processing");
      return hasInProgress ? 3000 : false;
    },
  });

  const { data: trendData = [] } = useQuery({
    queryKey: ["analytics-trend", subId],
    queryFn: () => analytics.getDifficultyTrend(subId),
    enabled: !!subId,
  });

  const { data: topicData = [] } = useQuery({
    queryKey: ["analytics-topics", subId],
    queryFn: () => analytics.getTopicDistribution(subId),
    enabled: !!subId,
  });

  const { data: unitData = [] } = useQuery({
    queryKey: ["analytics-units", subId],
    queryFn: () => analytics.getUnitDistribution(subId),
    enabled: !!subId,
  });

  const { data: repeatedQuestions = [] } = useQuery({
    queryKey: ["analytics-repeated", subId],
    queryFn: () => analytics.getRepeatedQuestions(subId),
    enabled: !!subId,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-text-muted gap-3">
        <Loader2 size={24} className="animate-spin text-primary-light" />
        <span className="text-sm font-medium">Loading subject workspace...</span>
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-3">
        <p className="text-sm">Subject not found.</p>
        <Button variant="secondary" size="sm" onClick={() => router.push("/subjects")}>
          Back to Catalog
        </Button>
      </div>
    );
  }

  const materials = (subject as any)?.materials ?? [];
  const pastPapers = materials.filter((m: any) => m.materialType === "past_paper");
  const notes = materials.filter((m: any) => m.materialType === "notes");

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Back Button */}
      <button
        onClick={() => router.push("/subjects")}
        className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft size={14} /> Back to Subjects
      </button>

      {/* Header Banner */}
      <div className="glass-card rounded-3xl p-6 lg:p-8 border border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary-gradient flex items-center justify-center text-2xl shadow-glow-sm shrink-0">
            📚
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="purple" size="sm">
                Year {subject.year}
              </Badge>
              <Badge variant="neutral" size="sm">
                {materials.length} Materials
              </Badge>
            </div>
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text tracking-tight">
              {subject.name}
            </h1>
            <p className="text-xs text-text-muted mt-1">
              Syllabus & Past Paper Intelligence Workspace
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/ask-ai")}
            leftIcon={<Sparkles size={15} />}
          >
            Ask AI Tutor
          </Button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-card rounded-2xl border border-border w-fit">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                active
                  ? "bg-primary text-white shadow-glow-sm"
                  : "text-text-muted hover:text-text hover:bg-hover"
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Materials */}
      {activeTab === "Materials" && (
        <div className="space-y-6">
          {materials.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border p-8">
              <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-3 text-text-muted">
                <FileText size={22} />
              </div>
              <h3 className="font-bold text-base text-text">No materials uploaded yet</h3>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Upload past exam question papers or syllabus notes to trigger automated AI analytics.
              </p>
            </div>
          ) : (
            <>
              {pastPapers.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                      Past Question Papers ({pastPapers.length})
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {pastPapers.map((m: any) => (
                      <MaterialCard key={m.id} material={m} />
                    ))}
                  </div>
                </div>
              )}

              {notes.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                      Lecture & Reference Notes ({notes.length})
                    </p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {notes.map((m: any) => (
                      <MaterialCard key={m.id} material={m} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Tab 2: Analytics Overview */}
      {activeTab === "Analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-display font-bold text-base text-text mb-1">
                Difficulty Trend History
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Year-by-year examination question difficulty breakdown
              </p>
              {trendData.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-muted">
                  No difficulty data extracted yet.
                </div>
              ) : (
                <DifficultyTrendChart data={trendData.map((d: any) => ({ paper: String(d.year), easy: d.easy, medium: d.medium, hard: d.hard }))} />
              )}
            </Card>

            <Card>
              <h3 className="font-display font-bold text-base text-text mb-1">
                Topic Frequency Weightage
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Distribution of questions across syllabus topics
              </p>
              {topicData.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-muted">
                  No topic distribution data extracted yet.
                </div>
              ) : (
                <TopicDistributionChart data={topicData} />
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <h3 className="font-display font-bold text-base text-text mb-1">
                Unit Distribution Analysis
              </h3>
              <p className="text-xs text-text-muted mb-4">
                Exam marks and questions grouped by syllabus units (1-5)
              </p>
              {unitData.length === 0 ? (
                <div className="text-center py-12 text-xs text-text-muted">
                  No unit distribution data extracted yet.
                </div>
              ) : (
                <UnitDistributionChart data={unitData} />
              )}
            </Card>

            <Card className="flex flex-col justify-between">
              <div>
                <h3 className="font-display font-bold text-base text-text mb-1">
                  AI Revision Strategy
                </h3>
                <p className="text-xs text-text-muted mb-4">
                  Targeted recommendations based on multi-year exam analytics
                </p>

                <div className="space-y-2.5">
                  <div className="p-3.5 rounded-xl bg-surface border border-border text-xs text-text">
                    <p className="font-bold text-primary-light mb-1">🎯 Core Priority Focus</p>
                    <p className="text-text-muted">
                      Review units with high frequency weightage first before tackling peripheral reference notes.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface border border-border text-xs text-text">
                    <p className="font-bold text-emerald-400 mb-1">⚡ RAG Grounded Solutions</p>
                    <p className="text-text-muted">
                      Ask the AI Tutor to provide structured 10-mark answers matching previous exam question patterns.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                variant="primary"
                size="sm"
                className="w-full mt-4"
                onClick={() => router.push("/ask-ai")}
              >
                Launch AI Tutor for this Subject →
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Tab 3: Extracted Questions */}
      {activeTab === "Questions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-bold text-base text-text">
              Recurring Exam Questions ({repeatedQuestions.length})
            </h3>
            <Badge variant="purple" size="sm">
              Extracted via Groq AI
            </Badge>
          </div>

          {repeatedQuestions.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border p-8 text-xs text-text-muted">
              No questions extracted yet. Upload question papers to view extracted questions.
            </div>
          ) : (
            <div className="space-y-3">
              {repeatedQuestions.map((q: any, i: number) => (
                <div
                  key={i}
                  className="glass-card rounded-2xl p-5 border border-border flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text leading-relaxed">
                      {q.question}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className="text-[11px] font-semibold text-primary-light bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                        {q.topic || "General"}
                      </span>
                      {q.unit && (
                        <span className="text-[11px] text-text-muted bg-surface px-2 py-0.5 rounded-md border border-border">
                          Unit {q.unit}
                        </span>
                      )}
                      <span className="text-[11px] text-text-subtle font-mono">
                        Appeared in: {q.years ? q.years.join(", ") : "Recent"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
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
                    <Badge variant="purple" size="sm">
                      {q.frequency || 1}x Frequency
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
