"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { auth } from "@/lib/api";
import { storeAuth } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";

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
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.1)_0%,transparent_65%)] pointer-events-none" />

      <div className="w-[420px] relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl font-extrabold gradient-text">
            ExamSense AI
          </Link>
          <p className="text-sm text-text-muted mt-2">Welcome back. Sign in to continue.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-9">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-surface rounded-lg mb-7">
            <span className="flex-1 py-2 text-center text-sm font-semibold rounded-md bg-primary text-white cursor-default">
              Sign In
            </span>
            <Link href="/auth/register" className="flex-1 py-2 text-center text-sm font-medium text-text-muted hover:text-text transition-colors rounded-md">
              Register
            </Link>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-text-muted font-medium mb-1.5">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@university.edu"
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-text-muted font-medium mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors pr-10"
                  required
                />
                <button type="button" onClick={() => setShowPw((p) => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text">
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <a href="#" className="text-xs text-primary-light hover:underline">Forgot password?</a>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-gradient hover:opacity-90 transition-opacity disabled:opacity-60 mt-2"
            >
              {loginMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Signing in...</> : "Sign In"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-text-muted mt-5">
          <Link href="/" className="text-primary-light hover:underline">← Back to homepage</Link>
        </p>
      </div>
    </div>
  );
}
