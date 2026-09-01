"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subjects } from "@/lib/api";
import { ArrowLeft, Loader2, BookOpen, Plus } from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function NewSubjectPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [year, setYear] = useState("1");

  const mutation = useMutation({
    mutationFn: subjects.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["subjects"] });
      toast.success("Subject created successfully!");
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
    <div className="p-6 lg:p-8 max-w-xl mx-auto space-y-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text transition-colors"
      >
        <ArrowLeft size={14} /> Back to Admin
      </button>

      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text tracking-tight">
          Create New Subject
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Add a subject module to the university curriculum catalog.
        </p>
      </div>

      <Card className="p-6 lg:p-8">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Subject Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Operating Systems & System Programming"
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
              Academic B.Tech Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors cursor-pointer"
            >
              <option value="1">1st Year</option>
              <option value="2">2nd Year</option>
              <option value="3">3rd Year</option>
              <option value="4">4th Year</option>
            </select>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            className="w-full mt-2"
            isLoading={mutation.isPending}
            leftIcon={<Plus size={16} />}
          >
            Create Subject Module
          </Button>
        </form>
      </Card>
    </div>
  );
}
