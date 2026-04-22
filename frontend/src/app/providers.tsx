"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Toaster } from "react-hot-toast";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
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
            background: "#161A23",
            color: "#E6E8EC",
            border: "1px solid #2A2F3A",
            borderRadius: "10px",
            fontFamily: "var(--font-dm-sans)",
            fontSize: "13px",
          },
          success: {
            iconTheme: { primary: "#22C55E", secondary: "#161A23" },
          },
          error: {
            iconTheme: { primary: "#EF4444", secondary: "#161A23" },
          },
        }}
      />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
