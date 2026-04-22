export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const TOKEN_KEY = "examsense_token";
export const USER_KEY = "examsense_user";

export const DIFFICULTY_COLORS = {
  easy: "#22C55E",
  medium: "#F59E0B",
  hard: "#EF4444",
} as const;

export const DIFFICULTY_BG_COLORS = {
  easy: "rgba(34,197,94,0.12)",
  medium: "rgba(245,158,11,0.12)",
  hard: "rgba(239,68,68,0.12)",
} as const;

export const CHART_COLORS = [
  "#7C3AED",
  "#6366F1",
  "#8B5CF6",
  "#A78BFA",
  "#4F46E5",
  "#C4B5FD",
  "#6D28D9",
];

export const BTECH_YEARS = ["1st", "2nd", "3rd", "4th"] as const;

export const MATERIAL_TYPE_LABELS = {
  past_paper: "Past Paper",
  notes: "Notes",
  syllabus: "Syllabus",
  reference: "Reference",
} as const;

export const MATERIAL_TYPE_COLORS = {
  past_paper: "badge-purple",
  notes: "badge-blue",
  syllabus: "badge-green",
  reference: "badge-yellow",
} as const;

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard" },
  { href: "/subjects", label: "Subjects", icon: "BookOpen" },
  { href: "/ask-ai", label: "Ask AI", icon: "Sparkles" },
  { href: "/analytics", label: "Analytics", icon: "BarChart2" },
] as const;
