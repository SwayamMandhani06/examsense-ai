"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Loader2 } from "lucide-react";
import { auth } from "@/lib/api";
import { storeAuth } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import type { UserRole, BtechYear } from "@/types/user";

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
    <div className="min-h-screen bg-bg flex items-center justify-center relative overflow-hidden py-10">
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse,rgba(124,58,237,0.1)_0%,transparent_65%)] pointer-events-none" />

      <div className="w-[420px] relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="font-display text-2xl font-extrabold gradient-text">
            ExamSense AI
          </Link>
          <p className="text-sm text-text-muted mt-2">Create your account and start studying smarter.</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-9">
          {/* Tabs */}
          <div className="flex gap-1 p-1 bg-surface rounded-lg mb-7">
            <Link href="/auth/login" className="flex-1 py-2 text-center text-sm font-medium text-text-muted hover:text-text transition-colors rounded-md">
              Sign In
            </Link>
            <span className="flex-1 py-2 text-center text-sm font-semibold rounded-md bg-primary text-white cursor-default">
              Register
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-text-muted font-medium mb-1.5">First name</label>
                <input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} placeholder="Arjun" className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" required />
              </div>
              <div>
                <label className="block text-sm text-text-muted font-medium mb-1.5">Last name</label>
                <input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} placeholder="Sharma" className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" required />
              </div>
            </div>

            <div>
              <label className="block text-sm text-text-muted font-medium mb-1.5">Email address</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@university.edu" className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" required />
            </div>

            <div>
              <label className="block text-sm text-text-muted font-medium mb-1.5">Password</label>
              <input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Minimum 8 characters" className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-text-muted font-medium mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => set("role", e.target.value)} className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors cursor-pointer">
                  <option value="student">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {form.role === "student" && (
                <div>
                  <label className="block text-sm text-text-muted font-medium mb-1.5">B.Tech Year</label>
                  <select value={form.btechYear} onChange={(e) => set("btechYear", e.target.value)} className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text focus:outline-none focus:border-primary transition-colors cursor-pointer">
                    <option value="1st">1st Year</option>
                    <option value="2nd">2nd Year</option>
                    <option value="3rd">3rd Year</option>
                    <option value="4th">4th Year</option>
                  </select>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={registerMutation.isPending}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-gradient hover:opacity-90 transition-opacity disabled:opacity-60 mt-1"
            >
              {registerMutation.isPending ? <><Loader2 size={15} className="animate-spin" /> Creating account...</> : "Create Account"}
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
