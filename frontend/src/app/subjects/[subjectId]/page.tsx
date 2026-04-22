"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { subjects } from "@/lib/api";
import { API_BASE_URL } from "@/lib/constants";
import { ArrowLeft, FileText, Download, Loader2 } from "lucide-react";

const TABS = ["Materials", "Analytics", "Past Questions"] as const;
type Tab = (typeof TABS)[number];

function MaterialRow({ material }: { material: any }) {
  const isPastPaper = material.materialType === "past_paper";
  return (
    <div className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-primary/30 transition-all">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${isPastPaper ? "bg-primary/15" : "bg-blue-500/15"}`}>
        <FileText size={16} className={isPastPaper ? "text-primary-light" : "text-blue-400"} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">{material.title}</p>
        <p className="text-xs text-text-muted">{material.year ?? ""}</p>
        {material.processingStatus && material.processingStatus !== "completed" && (
          <p className={`text-[11px] mt-0.5 ${material.processingStatus === "failed" ? "text-danger" : "text-warning"}`}>
            {material.processingStatus === "queued" && "Queued for analytics..."}
            {material.processingStatus === "processing" && "Processing analytics..."}
            {material.processingStatus === "failed" && (material.processingError || "Failed to process PDF")}
          </p>
        )}
      </div>
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${isPastPaper ? "bg-primary/15 text-primary-light border-primary/30" : "bg-blue-500/15 text-blue-400 border-blue-500/30"}`}>
        {isPastPaper ? "Past Paper" : "Notes"}
      </span>
      <a
        href={`${API_BASE_URL}${material.fileUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-text-muted hover:border-primary hover:text-primary-light transition-all"
      >
        <Download size={14} />
      </a>
    </div>
  );
}

export default function SubjectDetailPage() {
  const { subjectId } = useParams();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("Materials");

  const { data: subject, isLoading, error } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => subjects.getById(String(subjectId)),
    refetchInterval: (query) => {
      const mats = ((query.state.data as any)?.materials ?? []) as Array<{ processingStatus?: string }>;
      const hasInProgress = mats.some((m) => m.processingStatus === "queued" || m.processingStatus === "processing");
      return hasInProgress ? 3000 : false;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 size={20} className="animate-spin text-text-muted" />
      </div>
    );
  }

  if (error || !subject) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-3">
        <p className="text-sm">Subject not found.</p>
        <button onClick={() => router.back()} className="text-xs text-primary-light hover:underline">Go back</button>
      </div>
    );
  }

  const materials = (subject as any)?.materials ?? [];
  const pastPapers = materials.filter((m: any) => m.materialType === "past_paper");
  const notes = materials.filter((m: any) => m.materialType === "notes");

  return (
    <div className="p-7">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-5 transition-colors">
        <ArrowLeft size={14} /> Back to Subjects
      </button>

      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-3xl">📚</span>
          <h2 className="font-display text-2xl font-extrabold">{subject.name}</h2>
          <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-primary/20 text-primary-light border border-primary/30">
            Year {subject.year}
          </span>
        </div>
        <p className="text-sm text-text-muted ml-12">{materials.length} materials uploaded</p>
      </div>

      <div className="flex gap-1 border-b border-border mb-6">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-all -mb-px ${
              activeTab === tab ? "border-primary text-primary-light" : "border-transparent text-text-muted hover:text-text"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Materials" && (
        <div>
          {materials.length === 0 ? (
            <div className="text-center py-16 text-text-muted">
              <FileText size={32} className="mx-auto mb-3 opacity-40" />
              <p className="text-sm">No materials uploaded yet.</p>
              <p className="text-xs mt-1">Ask your admin to upload study materials.</p>
            </div>
          ) : (
            <>
              {pastPapers.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
                    Past Papers ({pastPapers.length})
                  </p>
                  <div className="space-y-2">
                    {pastPapers.map((m: any) => <MaterialRow key={m.id} material={m} />)}
                  </div>
                </div>
              )}
              {notes.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-3">
                    Notes ({notes.length})
                  </p>
                  <div className="space-y-2">
                    {notes.map((m: any) => <MaterialRow key={m.id} material={m} />)}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {activeTab === "Analytics" && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-sm">Analytics will appear once materials are processed.</p>
        </div>
      )}

      {activeTab === "Past Questions" && (
        <div className="text-center py-16 text-text-muted">
          <p className="text-sm">Past questions will appear once materials are processed.</p>
        </div>
      )}
    </div>
  );
}
