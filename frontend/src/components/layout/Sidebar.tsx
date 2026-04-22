"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BookOpen, Sparkles, BarChart2,
  Settings, LogOut, ChevronLeft, ChevronRight, ShieldCheck, UserCircle2,
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
    { href: "/ask-ai", label: "Ask AI", icon: Sparkles },
    { href: "/analytics", label: "Analytics", icon: BarChart2 },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Panel", icon: ShieldCheck }] : []),
  ];
  const profileActive = pathname === "/profile";
  const settingsActive = pathname === "/settings";

  const handleLogout = () => {
    logout();
    toast.success("Signed out successfully.");
    router.push("/");
  };

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      className="flex flex-col flex-shrink-0 bg-card border-r border-border z-30 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-5 border-b border-border min-h-[65px]">
        <AnimatePresence>
          {!collapsed && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="font-display text-lg font-extrabold gradient-text whitespace-nowrap">
              ExamSense AI
            </motion.span>
          )}
        </AnimatePresence>
        <button onClick={() => setCollapsed((c) => !c)}
          className="w-7 h-7 rounded-md flex items-center justify-center text-text-muted hover:text-text hover:bg-surface transition-all flex-shrink-0">
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {!collapsed && (
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2.5 pt-2 pb-1.5">Main</p>
        )}
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
          const isAdminLink = href === "/admin";
          return (
            <Link key={href} href={href}>
              <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                active
                  ? isAdminLink ? "bg-amber-500/15 text-amber-400" : "bg-primary/15 text-primary-light"
                  : isAdminLink ? "text-amber-500/70 hover:bg-amber-500/10 hover:text-amber-400" : "text-text-muted hover:bg-primary/8 hover:text-text"
              }`}>
                <Icon size={16} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 whitespace-nowrap">
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
            </Link>
          );
        })}

        {!collapsed && (
          <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest px-2.5 pt-4 pb-1.5">Account</p>
        )}
        <Link href="/profile">
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            profileActive ? "bg-primary/15 text-primary-light" : "text-text-muted hover:bg-primary/8 hover:text-text"
          }`}>
            <UserCircle2 size={16} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Profile</motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
        <Link href="/settings">
          <div className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
            settingsActive ? "bg-primary/15 text-primary-light" : "text-text-muted hover:bg-primary/8 hover:text-text"
          }`}>
            <Settings size={16} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Settings</motion.span>
              )}
            </AnimatePresence>
          </div>
        </Link>
        <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-text-muted hover:bg-danger/10 hover:text-danger transition-all">
          <LogOut size={16} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="whitespace-nowrap">Sign Out</motion.span>
            )}
          </AnimatePresence>
        </button>
      </nav>

      {!collapsed && (
        <div className="p-3 border-t border-border">
          <Link href="/profile" className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-primary/8 cursor-pointer transition-all">
            <div className="w-8 h-8 rounded-full bg-primary-gradient flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {getUserInitials(user)}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{getUserDisplayName(user)}</p>
              <p className="text-[11px] text-text-muted">
                {isAdmin ? "Administrator" : user?.btechYear ? `Student · Year ${user.btechYear}` : "Student"}
              </p>
            </div>
          </Link>
        </div>
      )}
    </motion.aside>
  );
}
