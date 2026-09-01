"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Building2,
  CalendarDays,
  GraduationCap,
  Mail,
  Save,
  ShieldCheck,
  UserCircle2,
  Phone,
  BookOpen,
} from "lucide-react";
import toast from "react-hot-toast";

import { auth } from "@/lib/api";
import { getUserDisplayName, getUserInitials } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/user";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

type ProfileForm = {
  firstName: string;
  lastName: string;
  btechYear: string;
  phone: string;
  college: string;
  bio: string;
};

const EMPTY_FORM: ProfileForm = {
  firstName: "",
  lastName: "",
  btechYear: "",
  phone: "",
  college: "",
  bio: "",
};

function getInitialForm(user: User): ProfileForm {
  return {
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    btechYear: user.btechYear ? String(user.btechYear) : "",
    phone: user.phone ?? "",
    college: user.college ?? "",
    bio: user.bio ?? "",
  };
}

export default function ProfilePage() {
  const { user, updateUser } = useAuthStore();
  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);

  const { data: serverUser, isLoading } = useQuery({
    queryKey: ["auth-me-profile"],
    queryFn: auth.me,
  });

  useEffect(() => {
    if (!serverUser) return;
    updateUser(serverUser);
    setForm(getInitialForm(serverUser));
  }, [serverUser, updateUser]);

  useEffect(() => {
    if (serverUser || !user) return;
    setForm(getInitialForm(user));
  }, [serverUser, user]);

  const effectiveUser = serverUser ?? user;
  const initialForm = useMemo(
    () => (effectiveUser ? getInitialForm(effectiveUser) : EMPTY_FORM),
    [effectiveUser]
  );
  const hasChanges = JSON.stringify(form) !== JSON.stringify(initialForm);

  const updateMutation = useMutation({
    mutationFn: () =>
      auth.updateMe({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        btechYear: form.btechYear ? (Number(form.btechYear) as 1 | 2 | 3 | 4) : null,
        phone: form.phone.trim() || null,
        college: form.college.trim() || null,
        bio: form.bio.trim() || null,
      }),
    onSuccess: (updatedUser) => {
      updateUser(updatedUser);
      setForm(getInitialForm(updatedUser));
      toast.success("Profile saved successfully!");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to update profile");
    },
  });

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-text tracking-tight">
          Profile Settings
        </h1>
        <p className="text-xs sm:text-sm text-text-muted mt-1">
          Manage your personal details, academic year, and study preferences.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left ID Card */}
        <Card className="flex flex-col items-center text-center p-6 lg:p-8 space-y-4">
          <div className="w-20 h-20 rounded-3xl bg-primary-gradient flex items-center justify-center text-2xl font-bold text-white shadow-glow">
            {getUserInitials(effectiveUser ?? null)}
          </div>

          <div>
            <h2 className="font-display text-xl font-extrabold text-text">
              {getUserDisplayName(effectiveUser ?? null)}
            </h2>
            <p className="text-xs text-text-muted mt-0.5">{effectiveUser?.email}</p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <Badge variant="purple" size="sm">
              {effectiveUser?.role === "admin" ? "Administrator" : "Student"}
            </Badge>
            {effectiveUser?.btechYear && (
              <Badge variant="blue" size="sm">
                Year {effectiveUser.btechYear}
              </Badge>
            )}
          </div>

          <div className="w-full pt-4 border-t border-border/80 text-left space-y-2.5 text-xs text-text-muted">
            <div className="flex items-center gap-2">
              <CalendarDays size={14} className="text-primary-light" />
              <span>
                Joined:{" "}
                {effectiveUser?.createdAt
                  ? new Date(effectiveUser.createdAt).toLocaleDateString()
                  : "Recently"}
              </span>
            </div>
            {effectiveUser?.college && (
              <div className="flex items-center gap-2">
                <Building2 size={14} className="text-primary-light" />
                <span className="truncate">{effectiveUser.college}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Right Form Card */}
        <div className="lg:col-span-2">
          <Card className="p-6 lg:p-8">
            <div className="flex items-center gap-2 mb-6">
              <UserCircle2 size={18} className="text-primary-light" />
              <h3 className="font-display text-lg font-bold text-text">
                Personal & Academic Details
              </h3>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    First Name
                  </label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Last Name
                  </label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="w-full px-3.5 py-2.5 bg-surface/50 border border-border/80 rounded-xl text-xs sm:text-sm text-text-muted flex items-center gap-2 select-none">
                    <Mail size={14} />
                    <span className="truncate">{effectiveUser?.email}</span>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Academic Year
                  </label>
                  <select
                    value={form.btechYear}
                    onChange={(e) => setForm((s) => ({ ...s, btechYear: e.target.value }))}
                    disabled={effectiveUser?.role !== "student"}
                    className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors cursor-pointer disabled:opacity-50"
                  >
                    <option value="">Select Year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Phone Number
                  </label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      value={form.phone}
                      onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    College / University
                  </label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
                    <input
                      value={form.college}
                      onChange={(e) => setForm((s) => ({ ...s, college: e.target.value }))}
                      placeholder="University of Engineering"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-1.5">
                  Bio & Goals
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value.slice(0, 800) }))}
                  rows={3}
                  placeholder="Share your exam preparation focus, target subjects, or academic goals..."
                  className="w-full px-3.5 py-2.5 bg-surface border border-border rounded-xl text-xs sm:text-sm text-text focus:outline-none focus:border-primary transition-colors resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!hasChanges || updateMutation.isPending}
                  isLoading={updateMutation.isPending}
                  leftIcon={<Save size={15} />}
                >
                  Save Profile Changes
                </Button>
              </div>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
