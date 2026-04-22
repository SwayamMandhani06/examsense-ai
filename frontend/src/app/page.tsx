"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Plus, Loader2 } from "lucide-react";
import { subjects } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "@/store/authStore";

const BADGE_VARIANTS: Record<number, "purple" | "blue" | "green" | "yellow" | "red"> = {
  0: "purple", 1: "blue", 2: "green", 3: "yellow", 4: "red",
};

export default function SubjectsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const isAdmin = user?.role === "admin";

  const { data, isLoading, error } = useQuery({
    queryKey: ["subjects"],
    queryFn: subjects.getAll,
  });

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.06 } } };
  const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

  const grouped = (data ?? []).reduce<Record<string, typeof data>>((acc, s) => {
    const key = String(s.year);
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(s);
    return acc;
  }, {});

  return (
    <div className="p-7">
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-text-muted">Browse all subjects organized by academic year</p>
        {isAdmin && (
          <Button size="sm" onClick={() => router.push("/admin")}>
            <Plus size={13} /> Add Subject
          </Button>
        )}
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-24 text-text-muted gap-2">
          <Loader2 size={18} className="animate-spin" /> Loading subjects...
        </div>
      )}

      {error && (
        <div className="text-center py-24 text-sm text-text-muted">
          Could not load subjects. Make sure the backend is running.
        </div>
      )}

      {!isLoading && !error && Object.keys(grouped).length === 0 && (
        <div className="text-center py-24 text-sm text-text-muted">
          {isAdmin ? "No subjects yet. Click Add Subject to create one." : "No subjects available for your year yet."}
        </div>
      )}

      {Object.entries(grouped).sort().map(([year, subs]) => (
        <div key={year} className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-[11px] font-bold text-text-muted uppercase tracking-widest">Year {year}</span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-3 gap-3.5">
            {subs!.map((sub, i) => (
              <motion.div
                key={sub.id}
                variants={item}
                onClick={() => router.push(`/subjects/${sub.id}`)}
                className="bg-card border border-border rounded-xl p-5 hover:border-primary/40 hover:-translate-y-0.5 transition-all cursor-pointer"
              >
                <div className="text-2xl mb-3.5">📚</div>
                <h3 className="font-display text-[15px] font-bold mb-1">{sub.name}</h3>
                <p className="text-xs text-text-muted mb-4">Year {sub.year} · Core</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <Badge variant={BADGE_VARIANTS[i % 5]}>{sub.materialCount ?? 0} materials</Badge>
                  <Button variant="ghost" size="sm">View →</Button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      ))}
    </div>
  );
}