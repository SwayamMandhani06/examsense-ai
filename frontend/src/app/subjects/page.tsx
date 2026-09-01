"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Loader2,
  Search,
  BookOpen,
  FileText,
  HelpCircle,
  ArrowRight,
  Sparkles,
  BarChart2,
  Filter,
} from "lucide-react";
import { subjects } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/authStore";

const BADGE_VARIANTS = ["purple", "blue", "cyan", "green", "yellow"] as const;

export default function SubjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";
  const [search, setSearch] = useState("");
  const [selectedYear, setSelectedYear] = useState<number | "all">("all");

  const { data: subjectsList = [], isLoading, error } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjects.getAll,
  });

  const filtered = subjectsList.filter((s) => {
    const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase());
    const matchesYear = selectedYear === "all" || s.year === selectedYear;
    return matchesSearch && matchesYear;
  });

  const grouped = filtered.reduce<Record<string, typeof filtered>>((acc, s) => {
    const key = String(s.year);
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };
  const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text tracking-tight">
            Academic Subjects
          </h1>
          <p className="text-xs sm:text-sm text-text-muted mt-1">
            Browse and study curriculum subjects, past exam papers, and question analytics.
          </p>
        </div>

        {isAdmin && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push("/admin")}
            leftIcon={<Plus size={16} />}
          >
            Create Subject
          </Button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 p-2 bg-card rounded-2xl border border-border">
        {/* Search */}
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subjects by name..."
            className="w-full pl-9 pr-4 py-2 bg-surface rounded-xl text-xs text-text placeholder:text-text-muted border border-border/80 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        {/* Year Filter Pills */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-text-muted px-2 flex items-center gap-1">
            <Filter size={12} /> Year:
          </span>
          {(["all", 1, 2, 3, 4] as const).map((yr) => (
            <button
              key={yr}
              onClick={() => setSelectedYear(yr)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                selectedYear === yr
                  ? "bg-primary text-white shadow-glow-sm"
                  : "bg-surface text-text-muted hover:text-text hover:bg-hover border border-border"
              }`}
            >
              {yr === "all" ? "All Years" : `Year ${yr}`}
            </button>
          ))}
        </div>
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted gap-3">
          <Loader2 size={24} className="animate-spin text-primary-light" />
          <span className="text-sm font-medium">Loading subjects catalog...</span>
        </div>
      )}

      {error && (
        <div className="text-center py-20 text-sm text-danger bg-danger/5 border border-danger/20 rounded-2xl p-6">
          Could not load subjects. Please verify backend connection.
        </div>
      )}

      {!isLoading && !error && filtered.length === 0 && (
        <div className="text-center py-20 bg-card rounded-3xl border border-border p-8">
          <div className="w-12 h-12 rounded-2xl bg-surface border border-border flex items-center justify-center mx-auto mb-3 text-text-muted">
            <BookOpen size={20} />
          </div>
          <h3 className="font-bold text-base text-text">No subjects found</h3>
          <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
            {search
              ? "No subjects matched your search query. Try adjusting your keywords."
              : isAdmin
              ? "No subjects in curriculum yet. Click 'Create Subject' to get started."
              : "No subjects registered for this academic year."}
          </p>
        </div>
      )}

      {/* Grouped Subjects Grid */}
      {Object.entries(grouped)
        .sort()
        .map(([year, subs]) => (
          <div key={year} className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest bg-surface px-3 py-1 rounded-lg border border-border">
                Year {year}
              </span>
              <div className="flex-1 h-px bg-border/80" />
              <span className="text-xs text-text-subtle">{subs.length} Subjects</span>
            </div>

            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {subs.map((sub, i) => (
                <motion.div
                  key={sub.id}
                  variants={item}
                  onClick={() => router.push(`/subjects/${sub.id}`)}
                  className="glass-card rounded-2xl p-5 border border-border hover:border-primary/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-lg group-hover:scale-105 transition-transform">
                        📚
                      </div>
                      <Badge variant={BADGE_VARIANTS[i % BADGE_VARIANTS.length]} size="sm">
                        Year {sub.year} · Core
                      </Badge>
                    </div>

                    <h3 className="font-display text-base font-bold text-text group-hover:text-primary-light transition-colors line-clamp-1">
                      {sub.name}
                    </h3>
                    <p className="text-xs text-text-muted mt-1">
                      B.Tech Curriculum Module
                    </p>
                  </div>

                  <div className="mt-5 pt-3.5 border-t border-border/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3 text-text-muted">
                      <span className="flex items-center gap-1 font-medium">
                        <FileText size={13} className="text-primary-light" />
                        {sub.materialCount ?? 0} Materials
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <HelpCircle size={13} className="text-emerald-400" />
                        {sub.questionCount ?? 0} Questions
                      </span>
                    </div>

                    <span className="font-semibold text-primary-light group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Open →
                    </span>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        ))}
    </div>
  );
}