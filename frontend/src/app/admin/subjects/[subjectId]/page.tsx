"use client";

import { useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { subjects } from "@/lib/api";
import { API_BASE_URL, TOKEN_KEY } from "@/lib/constants";
import { ArrowLeft, Upload, Trash2, Loader2, FileText } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSubjectPage() {
  const { subjectId } = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ title: "", year: String(new Date().getFullYear()), type: "past_paper" });
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const { data: subject, isLoading } = useQuery({
    queryKey: ["subject", subjectId],
    queryFn: () => subjects.getById(String(subjectId)),
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
      const res = await fetch(`${API_BASE_URL}/subjects/${subjectId}/materials`, {
        method: "POST",
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
        body: formData,
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["subject", subjectId] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Material uploaded!");
      setForm({ title: "", year: String(new Date().getFullYear()), type: "past_paper" });
      if (fileRef.current) fileRef.current.value = "";
    } catch {
      toast.error("Upload failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (materialId: string) => {
    setDeletingId(materialId);
    try {
      const res = await fetch(`${API_BASE_URL}/subjects/${subjectId}/materials/${materialId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
      });
      if (!res.ok) throw new Error();
      queryClient.invalidateQueries({ queryKey: ["subject", subjectId] });
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Material deleted");
    } catch {
      toast.error("Failed to delete material");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-24"><Loader2 size={20} className="animate-spin text-text-muted" /></div>;
  }

  const materials = (subject as any)?.materials ?? [];

  return (
    <div className="p-7 max-w-4xl mx-auto">
      <button onClick={() => router.push("/admin")} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Admin
      </button>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-extrabold">{subject?.name}</h1>
        <p className="text-sm text-text-muted mt-1">Year {subject?.year} · {materials.length} materials uploaded</p>
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2"><Upload size={14} /> Upload Material</h2>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">Title</label>
              <input type="text" value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. DS_2023_Nov_Paper"
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Exam Year</label>
                <input type="number" value={form.year} onChange={(e) => setForm(f => ({ ...f, year: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-medium text-text-muted mb-1.5">Type</label>
                <select value={form.type} onChange={(e) => setForm(f => ({ ...f, type: e.target.value }))}
                  className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors">
                  <option value="past_paper">Past Paper</option>
                  <option value="notes">Notes</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-text-muted mb-1.5">PDF File</label>
              <input ref={fileRef} type="file" accept=".pdf"
                className="w-full text-xs text-text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-primary/15 file:text-primary-light hover:file:bg-primary/25 cursor-pointer" />
            </div>
            <button type="submit" disabled={isUploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-gradient hover:opacity-90 disabled:opacity-60 transition-opacity">
              {isUploading ? <><Loader2 size={13} className="animate-spin" /> Uploading...</> : "Upload Material"}
            </button>
          </form>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-sm mb-4 flex items-center gap-2"><FileText size={14} /> Materials ({materials.length})</h2>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {materials.length === 0 ? (
              <p className="text-xs text-text-muted text-center py-8">No materials yet. Upload your first one.</p>
            ) : (
              materials.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-surface rounded-lg group">
                  <FileText size={14} className="text-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{m.title}</p>
                    <p className="text-[11px] text-text-muted">{m.materialType} · {m.year}</p>
                    {m.processingStatus && m.processingStatus !== "completed" && (
                      <p className={`text-[11px] mt-0.5 ${
                        m.processingStatus === "failed" ? "text-danger" : "text-warning"
                      }`}>
                        {m.processingStatus === "queued" && "Queued for analytics..."}
                        {m.processingStatus === "processing" && "Processing analytics..."}
                        {m.processingStatus === "failed" && (m.processingError || "Failed to process PDF")}
                      </p>
                    )}
                  </div>
                  {m.processingStatus && (
                    <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full border ${
                      m.processingStatus === "completed"
                        ? "border-success/40 text-success bg-success/10"
                        : m.processingStatus === "failed"
                          ? "border-danger/40 text-danger bg-danger/10"
                          : "border-warning/40 text-warning bg-warning/10"
                    }`}>
                      {m.processingStatus}
                    </span>
                  )}
                  <button onClick={() => handleDelete(String(m.id))} disabled={deletingId === String(m.id)}
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger transition-all disabled:opacity-50">
                    {deletingId === String(m.id) ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
