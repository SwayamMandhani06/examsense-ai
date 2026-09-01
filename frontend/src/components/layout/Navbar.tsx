"use client";

import { usePathname, useRouter } from "next/navigation";
import { UserCircle2, Bell, Search, Sparkles, LogOut, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getUserDisplayName, getUserInitials } from "@/lib/auth";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Badge } from "@/components/ui/Badge";
import Link from "next/link";
import { useState } from "react";

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview Dashboard",
  "/subjects": "Academic Subjects",
  "/ask-ai": "Ask AI Tutor",
  "/analytics": "Exam Analytics & Predictions",
  "/profile": "My Profile",
  "/settings": "Account Settings",
  "/admin": "Admin Control Panel",
};

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [profileOpen, setProfileOpen] = useState(false);

  const title = Object.entries(pageTitles).find(([route]) =>
    pathname === route || (route !== "/dashboard" && pathname.startsWith(route))
  )?.[1] || "Dashboard";

  return (
    <header className="h-16 px-6 glass-panel border-b border-border flex items-center justify-between z-20 shrink-0">
      {/* Breadcrumb / Page Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 text-xs text-text-muted">
          <Link href="/dashboard" className="hover:text-text transition-colors">
            App
          </Link>
          <ChevronRight size={12} className="text-text-subtle" />
          <span className="text-text font-semibold">{title}</span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-3">
        {/* Live Engine Status Badge */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-border text-xs font-medium text-text-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>Groq Llama 3.3</span>
          <span className="text-text-subtle text-[10px] uppercase font-bold tracking-wider">Online</span>
        </div>

        {/* Theme Toggle */}
        <ThemeToggle />

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((o) => !o)}
            className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl border border-border bg-surface hover:bg-hover text-text transition-all focus:outline-none"
          >
            <div className="w-7 h-7 rounded-lg bg-primary-gradient flex items-center justify-center text-white text-xs font-bold shadow-glow-sm">
              {getUserInitials(user)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold leading-tight truncate max-w-[110px]">
                {user ? `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email : "Guest"}
              </span>
              <span className="text-[10px] text-text-muted uppercase tracking-wider font-semibold">
                {user?.role || "Student"}
              </span>
            </div>
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setProfileOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl p-2 border border-border shadow-card z-40 animate-fade-up">
                <div className="px-3 py-2.5 border-b border-border/60 mb-1">
                  <p className="text-xs font-bold text-text truncate">
                    {getUserDisplayName(user)}
                  </p>
                  <p className="text-[11px] text-text-muted truncate">{user?.email}</p>
                </div>

                <Link
                  href="/profile"
                  onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-text-muted hover:text-text hover:bg-hover transition-colors"
                >
                  <UserCircle2 size={14} /> Profile Details
                </Link>

                <button
                  onClick={() => {
                    setProfileOpen(false);
                    logout();
                    router.push("/");
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-danger hover:bg-danger/10 transition-colors mt-1"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
