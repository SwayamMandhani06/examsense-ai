"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/authStore";
import { subjects, analytics } from "@/lib/api";
import { API_BASE_URL, TOKEN_KEY } from "@/lib/constants";
import {
  Plus,
  Trash2,
  BookOpen,
  FileText,
  Loader2,
  ShieldAlert,
  Settings,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { StatCard } from "@/components/ui/StatCard";

export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user && user.role !== "admin") router.replace("/dashboard");
  }, [user, router]);

  const { data: subjectsList = [], isLoading } = useQuery({
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
      toast.success("Subject deleted successfully.");
    },
    onError: () => toast.error("Failed to delete subject"),
  });

  if (user?.role !== "admin") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-text-muted py-32">
        <ShieldAlert size={40} className="text-rose-400" />
        <h3 className="font-bold text-base text-text">Administrator Access Required</h3>
        <p className="text-xs text-text-muted">You do not have permissions to view this panel.</p>
        <Button variant="secondary" size="sm" onClick={() => router.push("/dashboard")}>
          Return to Dashboard
        </Button>
      </div>
    );
  }

  const totalMaterials = subjectsList.reduce((sum, s) => sum + (s.materialCount ?? 0), 0);

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="yellow" size="sm">
              Admin Workspace
            </Badge>
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text tracking-tight">
            Curriculum Administration
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Manage subjects, upload university exam PDFs, and trigger AI extraction.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => seedMutation.mutate()}
            isLoading={seedMutation.isPending}
            leftIcon={<Database size={15} className="text-primary-light" />}
          >
            Seed Sample Academic Data
          </Button>

          <Link href="/admin/subjects/new">
            <Button variant="primary" size="sm" leftIcon={<Plus size={16} />}>
              Create Subject
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          label="Total Curriculum Subjects"
          value={subjectsList.length}
          icon={<BookOpen size={18} />}
          description="Active modules"
        />
        <StatCard
          label="Total Study Materials"
          value={totalMaterials}
          icon={<FileText size={18} />}
          description="Indexed PDF documents"
        />
      </div>

      {/* Subjects Catalog Table Card */}
      <Card className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-surface/40">
          <h2 className="font-display font-bold text-sm text-text">
            All Curriculum Subjects ({subjectsList.length})
          </h2>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16 text-text-muted gap-2">
            <Loader2 size={20} className="animate-spin text-primary-light" />
            <span className="text-xs font-medium">Loading catalog...</span>
          </div>
        ) : subjectsList.length === 0 ? (
          <div className="text-center py-16 text-text-muted">
            <BookOpen size={32} className="mx-auto mb-3 opacity-40" />
            <p className="text-sm font-bold text-text mb-1">No subjects created yet</p>
            <p className="text-xs text-text-muted mb-4">
              Add your first academic subject to begin uploading materials.
            </p>
            <Link href="/admin/subjects/new">
              <Button size="sm" variant="primary" leftIcon={<Plus size={14} />}>
                Create Subject
              </Button>
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {subjectsList.map((s) => (
              <div
                key={s.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 hover:bg-surface/50 transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg shrink-0">
                    📚
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-text truncate">{s.name}</p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                      <span>Year {s.year}</span>
                      <span>·</span>
                      <span>{s.materialCount ?? 0} Materials</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <Link href={`/admin/subjects/${s.id}`}>
                    <Button size="xs" variant="secondary" leftIcon={<Settings size={13} />}>
                      Manage & Upload
                    </Button>
                  </Link>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete "${s.name}"?`)) {
                        deleteMutation.mutate(String(s.id));
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="p-2 rounded-xl border border-border bg-surface hover:bg-danger/10 text-text-muted hover:text-rose-400 transition-colors"
                    title="Delete subject"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
