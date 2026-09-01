"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { useState, useEffect } from "react";
import { useThemeStore } from "@/store/themeStore";

export function Providers({ children }: { children: React.ReactNode }) {
  const initTheme = useThemeStore((s) => s.initTheme);
  const theme = useThemeStore((s) => s.theme);

  useEffect(() => {
    initTheme();
  }, [initTheme]);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: theme === "dark" ? "#11131B" : "#FFFFFF",
            color: theme === "dark" ? "#F8FAFC" : "#0F172A",
            border: theme === "dark" ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
            borderRadius: "12px",
            fontFamily: "var(--font-body)",
            fontSize: "13px",
            boxShadow: theme === "dark" ? "0 8px 32px 0 rgba(0, 0, 0, 0.45)" : "0 4px 20px -2px rgba(15, 23, 42, 0.08)",
          },
          success: {
            iconTheme: { primary: "#10B981", secondary: theme === "dark" ? "#11131B" : "#FFFFFF" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: theme === "dark" ? "#11131B" : "#FFFFFF" },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
