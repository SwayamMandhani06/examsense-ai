"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { KeyRound, Lock, LogOut, Save, Sparkles } from "lucide-react";
import toast from "react-hot-toast";

import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function SettingsPage() {
  const router = useRouter();
  const { logout, user } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [strictMode, setStrictMode] = useState(true);
  const [showSources, setShowSources] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const strictStored = localStorage.getItem("ai_strict_mode");
    const sourcesStored = localStorage.getItem("ai_show_sources");
    if (strictStored !== null) setStrictMode(strictStored === "true");
    if (sourcesStored !== null) setShowSources(sourcesStored === "true");
  }, []);

  useQuery({
    queryKey: ["auth-me-settings"],
    queryFn: auth.me,
    enabled: !user,
  });

  const passwordMutation = useMutation({
    mutationFn: () => auth.changePassword({ currentPassword, newPassword }),
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Password updated.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to update password");
    },
  });

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("Please fill all password fields.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New and confirm password do not match.");
      return;
    }
    passwordMutation.mutate();
  };

  const savePreferences = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ai_strict_mode", String(strictMode));
      localStorage.setItem("ai_show_sources", String(showSources));
    }
    toast.success("Preferences saved.");
  };

  return (
    <div className="p-7 space-y-5">
      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={16} className="text-primary-light" />
          <h2 className="font-display text-lg font-bold">Security</h2>
        </div>
        <form onSubmit={submitPassword} className="grid grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1.5">Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            type="submit"
            disabled={passwordMutation.isPending}
            className="col-span-3 sm:col-span-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-gradient hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <KeyRound size={14} />
            {passwordMutation.isPending ? "Updating..." : "Update password"}
          </button>
        </form>
      </section>

      <section className="bg-card border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={16} className="text-primary-light" />
          <h2 className="font-display text-lg font-bold">AI Assistant Preferences</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between px-3 py-2.5 bg-surface border border-border rounded-lg">
            <span className="text-sm">Strict context-only answers</span>
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
              className="accent-primary"
            />
          </label>

          <label className="flex items-center justify-between px-3 py-2.5 bg-surface border border-border rounded-lg">
            <span className="text-sm">Show source references in chat</span>
            <input
              type="checkbox"
              checked={showSources}
              onChange={(e) => setShowSources(e.target.checked)}
              className="accent-primary"
            />
          </label>
        </div>

        <button
          onClick={savePreferences}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-gradient hover:opacity-90 transition-opacity"
        >
          <Save size={14} />
          Save preferences
        </button>
      </section>

      <section className="bg-card border border-border rounded-xl p-6">
        <h2 className="font-display text-lg font-bold mb-4">Session</h2>
        <button
          onClick={() => {
            logout();
            router.push("/");
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border border-danger/25 text-danger hover:bg-danger/10 transition-colors"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </section>
    </div>
  );
}
