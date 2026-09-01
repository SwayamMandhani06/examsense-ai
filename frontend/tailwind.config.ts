import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      colors: {
        bg: "var(--bg)",
        card: "var(--bg-card)",
        surface: "var(--bg-surface)",
        hover: "var(--bg-hover)",
        border: "var(--border)",
        "border-hover": "var(--border-hover)",
        text: {
          DEFAULT: "var(--text-main)",
          muted: "var(--text-muted)",
          subtle: "var(--text-subtle)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          light: "var(--primary-light)",
          dark: "var(--primary-dark)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          cyan: "var(--accent-cyan)",
          emerald: "var(--accent-emerald)",
          amber: "var(--accent-amber)",
          rose: "var(--accent-rose)",
        },
        success: "#10B981",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 50%, #6366F1 100%)",
        "primary-gradient-hover": "linear-gradient(135deg, #6D28D9 0%, #7C3AED 50%, #4F46E5 100%)",
        "accent-gradient": "linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%)",
        "glass-gradient": "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        card: "var(--shadow-card)",
        glow: "var(--shadow-glow)",
        "glow-sm": "0 0 15px rgba(124, 58, 237, 0.2)",
      },
      borderRadius: {
        DEFAULT: "10px",
        xl: "14px",
        "2xl": "20px",
        "3xl": "28px",
      },
      animation: {
        float: "floatSlow 5s ease-in-out infinite",
        "pulse-subtle": "pulseSubtle 3s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
      },
    },
  },
  plugins: [],
};

export default config;
