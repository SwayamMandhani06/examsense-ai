import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-dm-sans)", "sans-serif"],
        display: ["var(--font-syne)", "sans-serif"],
      },
      colors: {
        bg: "#0F1117",
        card: "#161A23",
        surface: "#1B2030",
        border: "#2A2F3A",
        primary: {
          DEFAULT: "#7C3AED",
          light: "#8B5CF6",
          dark: "#6D28D9",
        },
        accent: "#4F46E5",
        text: {
          DEFAULT: "#E6E8EC",
          muted: "#9CA3AF",
        },
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
      },
      backgroundImage: {
        "primary-gradient": "linear-gradient(135deg, #6D28D9, #7C3AED, #4F46E5)",
        "primary-gradient-r": "linear-gradient(to right, #6D28D9, #4F46E5)",
      },
      borderRadius: {
        DEFAULT: "8px",
      },
      animation: {
        "fade-up": "fadeUp 0.4s ease forwards",
        shimmer: "shimmer 1.5s infinite",
        bounce: "bounce 1.2s infinite",
      },
      keyframes: {
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
