"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2, GraduationCap, Lock, Mail, ArrowRight } from "lucide-react";
import { auth } from "@/lib/api";
import { storeAuth } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);

  const loginMutation = useMutation({
    mutationFn: auth.login,
    onSuccess: (data) => {
      storeAuth(data.accessToken, data.user);
      setAuth(data.user, data.accessToken);
      toast.success("Welcome back!");
      router.replace("/dashboard");
    },
    onError: () => {
      toast.error("Invalid email or password.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please fill in all fields.");
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="min-h-screen bg-bg text-text flex items-center justify-center p-6 relative overflow-hidden">
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
            Sign in to access your syllabus intelligence workspace
          </p>
        </div>

        {/* Glass Card */}
        <div className="glass-card rounded-3xl p-8 border border-border shadow-card backdrop-blur-xl">
          {/* Switcher Tab */}
          <div className="flex p-1 bg-surface rounded-2xl border border-border/80 mb-6">
            <span className="flex-1 py-2 text-center text-xs font-bold rounded-xl bg-primary text-white shadow-glow-sm cursor-default">
              Sign In
            </span>
            <Link
              href="/auth/register"
              className="flex-1 py-2 text-center text-xs font-semibold text-text-muted hover:text-text transition-colors rounded-xl"
            >
              Register
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Email address
              </label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text p-1"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={loginMutation.isPending}
              rightIcon={<ArrowRight size={15} />}
            >
              Sign In to Account
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
