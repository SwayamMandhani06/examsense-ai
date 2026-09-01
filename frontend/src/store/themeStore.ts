"use client";

import { create } from "zustand";

export type Theme = "dark" | "light";

interface ThemeState {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  initTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: "dark",

  initTheme: () => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("examsense-theme") as Theme | null;
    const defaultTheme: Theme = stored || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    
    if (defaultTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    set({ theme: defaultTheme });
  },

  setTheme: (theme: Theme) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("examsense-theme", theme);
      if (theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
    set({ theme });
  },

  toggleTheme: () => {
    const nextTheme: Theme = get().theme === "dark" ? "light" : "dark";
    get().setTheme(nextTheme);
  },
}));
