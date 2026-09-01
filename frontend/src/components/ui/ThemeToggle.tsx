"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { useThemeStore } from "@/store/themeStore";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme, initTheme } = useThemeStore();

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      type="button"
      aria-label="Toggle dark/light theme"
      className={`relative inline-flex items-center gap-2 p-2 rounded-xl border border-border bg-surface hover:bg-hover text-text-muted hover:text-text transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${className}`}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        <motion.div
          key={isDark ? "moon" : "sun"}
          initial={{ rotate: -90, scale: 0, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Moon size={16} className="text-primary-light" />
          ) : (
            <Sun size={16} className="text-amber-500" />
          )}
        </motion.div>
      </div>

      {showLabel && (
        <span className="text-xs font-medium capitalize select-none">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
