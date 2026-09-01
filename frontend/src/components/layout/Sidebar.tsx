"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  Sparkles,
  BarChart2,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCircle2,
  GraduationCap,
} from "lucide-react";
import { useState } from "react";
import { useAuthStore } from "@/store/authStore";
import { getUserInitials, getUserDisplayName } from "@/lib/auth";
import toast from "react-hot-toast";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [collapsed, setCollapsed] = useState(false);
  const isAdmin = user?.role === "admin";

  const navItems = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/subjects", label: "Subjects", icon: BookOpen },
    { href: "/ask-ai", label: "Ask AI Tutor", icon: Sparkles, badge: "Groq" },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: ShieldCheck, badge: "Admin" }] : []),
  ];

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully.");
    router.push("/");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 256 }}
      transition={{ duration: 0.2, ease: "easeInOut" }}
      className="flex flex-col shrink-0 bg-card border-r border-border z-30 overflow-hidden select-none"
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-border min-h-[64px]">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-xl bg-primary-gradient flex items-center justify-center text-white shrink-0 shadow-glow-sm">
            <GraduationCap size={20} />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex flex-col whitespace-nowrap"
              >
                <span className="font-display font-black text-base gradient-text tracking-tight">
                  ExamSense AI
                </span>
                <span className="text-[10px] text-text-subtle font-semibold uppercase tracking-wider -mt-0.5">
                  Academic Intelligence
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-text hover:bg-surface transition-all shrink-0"
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest px-3 pt-2 pb-1">
            Menu
          </p>
        )}

        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active =
            pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const isAdminLink = href === "/admin";

          return (
            <Link key={href} href={href} className="block">
              <div
                className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                  active
                    ? "bg-primary-gradient text-white shadow-glow-sm"
                    : "text-text-muted hover:text-text hover:bg-surface"
                }`}
              >
                <Icon
                  size={18}
                  className={`shrink-0 ${
                    active
                      ? "text-white"
                      : isAdminLink
                      ? "text-amber-400"
                      : "text-text-muted group-hover:text-text"
                  }`}
                />

                <AnimatePresence>
                  {!collapsed && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex-1 flex items-center justify-between whitespace-nowrap overflow-hidden"
                    >
                      <span className="truncate">{label}</span>
                      {badge && (
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider ${
                            active
                              ? "bg-white/20 text-white"
                              : badge === "Admin"
                              ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                              : "bg-primary/10 text-primary-light border border-primary/20"
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}

        {!collapsed && (
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest px-3 pt-4 pb-1">
            Account
          </p>
        )}

        <Link href="/profile" className="block">
          <div
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
              pathname === "/profile"
                ? "bg-primary-gradient text-white shadow-glow-sm"
                : "text-text-muted hover:text-text hover:bg-surface"
            }`}
          >
            <UserCircle2 size={18} className="shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="whitespace-nowrap"
                >
                  Profile
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
      </nav>

      {/* User Footer Card */}
      <div className="p-3 border-t border-border bg-surface/40">
        <div
          className={`flex items-center ${
            collapsed ? "justify-center" : "justify-between"
          } p-2 rounded-xl bg-card border border-border/80`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary-gradient flex items-center justify-center text-white text-xs font-bold shrink-0">
              {getUserInitials(user)}
            </div>
            {!collapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold truncate text-text">
                  {getUserDisplayName(user)}
                </span>
                <span className="text-[10px] text-text-muted truncate">
                  {user?.role === "admin" ? "Administrator" : `Year ${user?.btechYear || "All"}`}
                </span>
              </div>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={handleLogout}
              title="Sign Out"
              className="w-7 h-7 rounded-lg flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger/10 transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
