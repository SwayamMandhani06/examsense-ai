"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Building2, CalendarDays, GraduationCap, Mail, Save, ShieldCheck, UserCircle2 } from "lucide-react";
import toast from "react-hot-toast";

import { auth } from "@/lib/api";
import { getUserDisplayName, getUserInitials } from "@/lib/auth";
import { useAuthStore } from "@/store/authStore";
import type { User } from "@/types/user";

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
  const initialForm = useMemo(() => (effectiveUser ? getInitialForm(effectiveUser) : EMPTY_FORM), [effectiveUser]);
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
      toast.success("Profile updated.");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail ?? "Failed to update profile");
    },
  });

  if (!effectiveUser && !isLoading) {
    return (
      <div className="p-7">
        <div className="bg-card border border-border rounded-xl p-6 text-sm text-text-muted">
          Unable to load profile details.
        </div>
      </div>
    );
  }

  return (
    <div className="p-7">
      <div className="grid grid-cols-[1.25fr_2fr] gap-5">
        <section className="bg-card border border-border rounded-xl p-6">
          <div className="w-16 h-16 rounded-full bg-primary-gradient flex items-center justify-center text-xl font-bold text-white mb-4">
            {getUserInitials(effectiveUser ?? null)}
          </div>
          <h2 className="font-display text-xl font-extrabold">{getUserDisplayName(effectiveUser ?? null)}</h2>
          <p className="text-sm text-text-muted mt-1">{effectiveUser?.email}</p>

          <div className="mt-6 space-y-3 text-sm">
            <div className="flex items-center gap-2 text-text-muted">
              <ShieldCheck size={14} />
              <span>{effectiveUser?.role === "admin" ? "Administrator" : "Student"}</span>
            </div>
            {effectiveUser?.role === "student" && (
              <div className="flex items-center gap-2 text-text-muted">
                <GraduationCap size={14} />
                <span>Year {effectiveUser?.btechYear ?? "-"}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-text-muted">
              <CalendarDays size={14} />
              <span>Joined {effectiveUser?.createdAt ? new Date(effectiveUser.createdAt).toLocaleDateString() : "-"}</span>
            </div>
          </div>
        </section>

        <section className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 mb-5">
            <UserCircle2 size={16} className="text-primary-light" />
            <h3 className="font-display text-lg font-bold">Profile Details</h3>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              updateMutation.mutate();
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">First Name</label>
                <input
                  value={form.firstName}
                  onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Last Name</label>
                <input
                  value={form.lastName}
                  onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Email</label>
                <div className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm text-text-muted flex items-center gap-2">
                  <Mail size={13} />
                  <span>{effectiveUser?.email}</span>
                </div>
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">B.Tech Year</label>
                <select
                  value={form.btechYear}
                  onChange={(e) => setForm((s) => ({ ...s, btechYear: e.target.value }))}
                  disabled={effectiveUser?.role !== "student"}
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary disabled:opacity-50"
                >
                  <option value="">Not set</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-muted mb-1.5">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="+91"
                  className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-xs text-text-muted mb-1.5">College / Institute</label>
                <div className="relative">
                  <Building2 size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
                  <input
                    value={form.college}
                    onChange={(e) => setForm((s) => ({ ...s, college: e.target.value }))}
                    className="w-full pl-8 pr-3 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs text-text-muted mb-1.5">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => setForm((s) => ({ ...s, bio: e.target.value.slice(0, 1200) }))}
                rows={4}
                placeholder="Add your exam focus areas, goals, or preferred study style."
                className="w-full px-3 py-2.5 bg-surface border border-border rounded-lg text-sm focus:outline-none focus:border-primary resize-none"
              />
              <p className="text-[11px] text-text-muted mt-1 text-right">{form.bio.length}/1200</p>
            </div>

            <button
              type="submit"
              disabled={updateMutation.isPending || !hasChanges}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-primary-gradient hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Save size={14} />
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
