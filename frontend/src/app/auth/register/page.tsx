"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, GraduationCap, Lock, Mail, User, ArrowRight } from "lucide-react";
import { auth } from "@/lib/api";
import { storeAuth } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import type { UserRole, BtechYear } from "@/types/user";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    role: "student" as UserRole,
    btechYear: "3rd" as BtechYear,
  });

  const set = (key: string, val: string) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const registerMutation = useMutation({
    mutationFn: auth.register,
    onSuccess: (data) => {
      storeAuth(data.accessToken, data.user);
      setAuth(data.user, data.accessToken);
      toast.success("Account created! Welcome to ExamSense AI.");
      router.push("/dashboard");
    },
    onError: () => {
      toast.error("Registration failed. Email may already be in use.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email || !form.password)
      return toast.error("Please fill in all required fields.");
    if (form.password.length < 8)
      return toast.error("Password must be at least 8 characters.");
    registerMutation.mutate({
      ...form,
      btechYear: form.role === "student" ? form.btechYear : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6 relative overflow-hidden py-12">
      {/* Ambient background glow */}
      <div className="hero-glow-mesh" />
      <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />

      {/* Top right theme toggle */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-3 group">
            <div className="w-10 h-10 rounded-2xl bg-primary-gradient flex items-center justify-center text-white shadow-glow-sm group-hover:scale-105 transition-transform">
              <GraduationCap size={22} />
            </div>
            <span className="font-display font-black text-2xl gradient-text tracking-tight">
              ExamSense AI
            </span>
          </Link>
          <p className="text-xs sm:text-sm text-text-muted">
            Create an account to access automated academic intelligence
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-card rounded-3xl p-8 border border-border shadow-card backdrop-blur-xl">
          {/* Switcher Tab */}
          <div className="flex p-1 bg-surface rounded-2xl border border-border/80 mb-6">
            <Link
              href="/auth/login"
              className="flex-1 py-2 text-center text-xs font-semibold text-text-muted hover:text-text transition-colors rounded-xl"
            >
              Sign In
            </Link>
            <span className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-primary text-white shadow-glow-sm cursor-default">
              Register
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  First name
                </label>
                <input
                  value={form.firstName}
                  onChange={(e) => set("firstName", e.target.value)}
                  placeholder="Arjun"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Last name
                </label>
                <input
                  value={form.lastName}
                  onChange={(e) => set("lastName", e.target.value)}
                  placeholder="Sharma"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => set("email", e.target.value)}
                  placeholder="student@university.edu"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => set("role", e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors cursor-pointer"
                >
                  <option value="student">Student</option>
                  <option value="admin">Admin (Professor)</option>
                </select>
              </div>
              {form.role === "student" && (
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    B.Tech Year
                  </label>
                  <select
                    value={form.btechYear}
                    onChange={(e) => set("btechYear", e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors cursor-pointer"
                  >
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={registerMutation.isPending}
              rightIcon={<ArrowRight size={15} />}
            >
              Create Account
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-text-muted mt-6">
          <Link href="/" className="text-primary-light hover:underline font-medium">
            ← Back to Homepage
          </Link>
        </p>
      </div>
    </div>
  );
}
