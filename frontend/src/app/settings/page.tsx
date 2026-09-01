"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";
import { KeyRound, Lock, LogOut, Save, Sparkles, SunMoon } from "lucide-react";
import toast from "react-hot-toast";

import { auth } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

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
      toast.success("Password updated successfully.");
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
    toast.success("Preferences saved successfully.");
  };

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text tracking-tight">
          Application Settings
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Manage your account security, AI assistant behavior, and theme preferences.
        </p>
      </div>

      {/* Theme Appearance Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <SunMoon size={18} className="text-primary-light" />
          <h2 className="font-display text-base font-bold text-text">Appearance & Theme</h2>
        </div>

        <div className="flex items-center justify-between p-4 rounded-2xl bg-surface border border-border">
          <div>
            <p className="font-bold text-xs sm:text-sm text-text">Theme Preference</p>
            <p className="text-xs text-text-muted mt-0.5">
              Switch between Dark Obsidian and Light Porcelain themes
            </p>
          </div>
          <ThemeToggle showLabel />
        </div>
      </Card>

      {/* AI Assistant Preferences */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-primary-light" />
          <h2 className="font-display text-base font-bold text-text">AI Assistant Preferences</h2>
        </div>

        <div className="space-y-3">
          <label className="flex items-center justify-between p-4 bg-surface border border-border rounded-2xl cursor-pointer hover:border-primary/40 transition-colors">
            <div>
              <p className="font-bold text-xs sm:text-sm text-text">Strict Context-Only Mode</p>
              <p className="text-xs text-text-muted mt-0.5">
                Forces AI to answer exclusively using uploaded syllabus and paper chunks
              </p>
            </div>
            <input
              type="checkbox"
              checked={strictMode}
              onChange={(e) => setStrictMode(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-4 bg-surface border border-border rounded-2xl cursor-pointer hover:border-primary/40 transition-colors">
            <div>
              <p className="font-bold text-xs sm:text-sm text-text">Evidence Source References</p>
              <p className="text-xs text-text-muted mt-0.5">
                Displays clickable [Source 1] citations below AI tutor answers
              </p>
            </div>
            <input
              type="checkbox"
              checked={showSources}
              onChange={(e) => setShowSources(e.target.checked)}
              className="w-4 h-4 accent-primary rounded cursor-pointer"
            />
          </label>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            variant="primary"
            size="sm"
            onClick={savePreferences}
            leftIcon={<Save size={14} />}
          >
            Save Preferences
          </Button>
        </div>
      </Card>

      {/* Security / Password Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock size={18} className="text-primary-light" />
          <h2 className="font-display text-base font-bold text-text">Account Security</h2>
        </div>

        <form onSubmit={submitPassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={passwordMutation.isPending}
              leftIcon={<KeyRound size={14} />}
            >
              Update Password
            </Button>
          </div>
        </form>
      </Card>

      {/* Session Management */}
      <Card className="p-6 flex items-center justify-between border-danger/20">
        <div>
          <h3 className="font-bold text-sm text-text">Sign Out of Session</h3>
          <p className="text-xs text-text-muted mt-0.5">End active authentication session on this device</p>
        </div>
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            logout();
            router.push("/");
          }}
          leftIcon={<LogOut size={14} />}
        >
          Sign Out
        </Button>
      </Card>
    </div>
  );
}
