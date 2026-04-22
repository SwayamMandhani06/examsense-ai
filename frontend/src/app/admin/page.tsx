"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { subjects } from "@/lib/api";
import { API_BASE_URL, TOKEN_KEY } from "@/lib/constants";
import { Plus, Trash2, BookOpen, FileText, Loader2, ShieldAlert, Settings } from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user, router]);

  const { data: subjectsList, isLoading } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjects.getAll,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE_URL}/subjects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}` },
      });
      if (!res.ok) throw new Error("Failed to delete");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject deleted");
    },
    onError: () => toast.error("Failed to delete subject"),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted py-24">
        <ShieldAlert size={40} />
        <p className="text-sm">Admin access only</p>
      </div>
    );
  }

  const totalMaterials = (subjectsList ?? []).reduce((sum, s) => sum + (s.materialCount ?? 0), 0);

  return (
    <div className="p-7 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Admin Panel</h1>
          <p className="text-sm text-text-muted mt-1">Manage subjects and study materials</p>
        </div>
        <Link
          href="/admin/subjects/new"
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-gradient hover:opacity-90 transition-opacity"
        >
          <Plus size={14} /> Add Subject
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2.5 text-text-muted mb-2">
            <BookOpen size={16} />
            <span className="text-xs font-semibold uppercase tracking-widest">Total Subjects</span>
          </div>
          <p className="font-display text-3xl font-extrabold">{subjectsList?.length ?? 0}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2.5 text-text-muted mb-2">
            <FileText size={16} />
            <span className="text-xs font-semibold uppercase tracking-widest">Total Materials</span>
          </div>
          <p className="font-display text-3xl font-extrabold">{totalMaterials}</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="font-semibold text-sm">All Subjects</h2>
        </div>
        {isLoading ? (
          <div className="flex justify-center py-12 text-text-muted">
            <Loader2 size={18} className="animate-spin" />
          </div>
        ) : (subjectsList ?? []).length === 0 ? (
          <div className="text-center py-12 text-text-muted">
            <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm mb-4">No subjects yet.</p>
            <Link href="/admin/subjects/new" className="text-xs text-primary-light hover:underline">
              + Add your first subject
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {(subjectsList ?? []).map((s) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-4 px-5 py-4 hover:bg-surface/50 transition-colors"
              >
                <div className="text-xl">📚</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{s.name}</p>
                  <p className="text-xs text-text-muted">Year {s.year} · {s.materialCount ?? 0} materials</p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/subjects/${s.id}`}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:border-primary/50 hover:text-primary-light transition-all"
                  >
                    <Settings size={12} /> Manage
                  </Link>
                  <button
                    onClick={() => deleteMutation.mutate(String(s.id))}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
