"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subjects } from "@/lib/api";
import { API_BASE_URL, TOKEN_KEY } from "@/lib/constants";
import {
  ArrowLeft,
  Upload,
  Trash2,
  Loader2,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Download,
} from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AdminSubjectPage() {
  const { subjectId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    title: "",
    year: String(new Date().getFullYear()),
    type: "past_paper",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const subId = String(subjectId);

  const { data: subject, isLoading } = useQuery({
    queryKey: ["subject", subId],
    queryFn: () => subjects.getById(subId),
    refetchInterval: (query) => {
      const mats = ((query.state.data as any)?.materials ?? []) as Array<{ processingStatus?: string }>;
      const hasInProgress = mats.some((m) => m.processingStatus === "queued" || m.processingStatus === "processing");
      return hasInProgress ? 3000 : false;
    },
  });

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    const file = fileRef.current?.files?.[0];
    if (!file) return toast.error("Please select a PDF file");
    if (!form.title.trim()) return toast.error("Title is required");
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", form.title.trim());
    formData.append("year", form.year);
    formData.append("material_type", form.type);

    try {
      const res = await fetch(`${API_BASE_URL}/subjects/${subId}/materials`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
        body: formData,
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["subject", subId] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("PDF uploaded! FastEmbed vectorization & Groq extraction triggered.");
      setForm({ title: "", year: String(new Date().getFullYear()), type: "past_paper" });
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("Upload failed. Make sure the backend is reachable.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    setDeletingId(materialId);
    try {
      const res = await fetch(`${API_BASE_URL}/subjects/${subId}/materials/${materialId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["subject", subId] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Material deleted successfully.");
    } catch {
      toast.error("Failed to delete material");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-24 text-text-muted gap-2">
        <Loader2 size={20} className="animate-spin text-primary-light" />
        <span className="text-xs font-medium">Loading subject details...</span>
      </div>
    );
  }

  const materials = (subject as any)?.materials ?? [];

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <button
        onClick={() => router.push("/admin")}
        className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft size={14} /> Back to Admin Panel
      </button>

      <div>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="purple" size="sm">
            Year {subject?.year}
          </Badge>
          <Badge variant="neutral" size="sm">
            {materials.length} Materials Uploaded
          </Badge>
        </div>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text tracking-tight">
          {subject?.name}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Form Card */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload size={16} className="text-primary-light" />
            <h2 className="font-display font-bold text-sm text-text">
              Upload New Study Material
            </h2>
          </div>

          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Material Title
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. OS_Nov_2023_EndSem_Paper"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Exam Year
                </label>
                <input
                  type="number"
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Material Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="past_paper">Past Paper</option>
                  <option value="notes">Notes / Syllabus</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                PDF Document
              </label>
              <input
                ref={fileRef}
                type="file"
                accept=".pdf"
                className="w-full text-xs text-text-muted file:mr-3 file:py-2 file:px-3.5 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary/10 file:text-primary-light hover:file:bg-primary/20 cursor-pointer"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              disabled={isUploading}
              isLoading={isUploading}
              leftIcon={<Upload size={15} />}
            >
              Upload & Trigger Ingestion
            </Button>
          </form>
        </Card>

        {/* Existing Materials List Card */}
        <Card className="p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-bold text-sm text-text flex items-center gap-2">
              <FileText size={16} className="text-primary-light" />
              Uploaded Materials ({materials.length})
            </h2>
          </div>

          <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[380px] pr-1">
            {materials.length === 0 ? (
              <div className="text-center py-16 text-xs text-text-muted">
                No materials uploaded yet. Use the upload form on the left.
              </div>
            ) : (
              materials.map((m: any) => (
                <div
                  key={m.id}
                  className="p-3 rounded-xl bg-surface border border-border/80 flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} className="text-primary-light shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-text truncate">{m.title}</p>
                      <p className="text-[11px] text-text-muted">
                        {m.materialType === "past_paper" ? "Past Paper" : "Notes"} · {m.year}
                      </p>

                      {/* Processing Badge */}
                      {m.processingStatus && (
                        <div className="mt-1">
                          {m.processingStatus === "queued" && (
                            <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                              <Clock size={10} className="animate-spin" /> Queued
                            </span>
                          )}
                          {m.processingStatus === "processing" && (
                            <span className="text-[10px] text-primary-light font-semibold flex items-center gap-1">
                              <Loader2 size={10} className="animate-spin" /> Processing
                            </span>
                          )}
                          {m.processingStatus === "completed" && (
                            <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                              <CheckCircle2 size={10} /> Ready
                            </span>
                          )}
                          {m.processingStatus === "failed" && (
                            <span className="text-[10px] text-rose-400 font-semibold flex items-center gap-1">
                              <AlertCircle size={10} /> Failed
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDelete(String(m.id))}
                      disabled={deletingId === String(m.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-rose-400 hover:bg-danger/10 transition-colors"
                      title="Delete material"
                    >
                      {deletingId === String(m.id) ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
