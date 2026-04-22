"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { useAuthStore } from "@/store/authStore";
import { getUserInitials, getUserDisplayName } from "@/lib/auth";
import { useState } from "react";

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/subjects": "Subjects",
  "/ask-ai": "Ask AI",
  "/analytics": "Analytics",
  "/profile": "Profile",
  "/settings": "Settings",
};

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const [search, setSearch] = useState("");

  const title =
    PAGE_TITLES[pathname] ??
    (pathname.startsWith("/subjects/") ? "Subject Detail" : "Dashboard");

  return (
    <header className="sticky top-0 z-20 flex items-center gap-4 px-7 py-3.5 border-b border-border bg-bg/90 backdrop-blur-sm flex-shrink-0">
      <h1 className="font-display text-lg font-bold flex-1">{title}</h1>

      {/* Search */}
      <div className="flex items-center gap-2 bg-surface border border-border rounded-lg px-3 py-2 w-56">
        <Search size={13} className="text-text-muted flex-shrink-0" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects, topics..."
          className="bg-transparent text-sm text-text placeholder:text-text-muted outline-none w-full"
        />
      </div>

      {/* Bell */}
      <button className="w-9 h-9 rounded-lg bg-surface border border-border flex items-center justify-center text-text-muted hover:border-primary hover:text-primary-light transition-all">
        <Bell size={15} />
      </button>

      {/* Avatar */}
      <Link
        href="/profile"
        className="w-9 h-9 rounded-full bg-primary-gradient flex items-center justify-center text-[13px] font-bold text-white cursor-pointer hover:opacity-90 transition-opacity"
        title={getUserDisplayName(user)}
      >
        {getUserInitials(user)}
      </Link>
    </header>
  );
}
