"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subjects } from "@/lib/api";
import { ArrowLeft, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

export default function NewSubjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [year, setYear] = useState("1");

  const mutation = useMutation({
    mutationFn: subjects.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject created!");
      router.push(`/admin/subjects/${data.id}`);
    },
    onError: () => toast.error("Failed to create subject"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Subject name is required");
    mutation.mutate({ name: name.trim(), year: parseInt(year) });
  };

  return (
    <div className="p-7 max-w-lg mx-auto">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to Admin
      </button>
      <h1 className="font-display text-2xl font-extrabold mb-6">Add New Subject</h1>
      <form onSubmit={handleSubmit} className="bg-card border border-border rounded-xl p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">Subject Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Data Structures & Algorithms"
            className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-muted mb-1.5">B.Tech Year</label>
          <select
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors"
          >
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
            <option value="3">3rd Year</option>
            <option value="4">4th Year</option>
          </select>
        </div>
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-gradient hover:opacity-90 disabled:opacity-60 transition-opacity"
        >
          {mutation.isPending ? <><Loader2 size={14} className="animate-spin" /> Creating...</> : "Create Subject"}
        </button>
      </form>
    </div>
  );
}
