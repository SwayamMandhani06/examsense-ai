import type { Metadata } from "next";
import "@/styles/globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "ExamSense AI – Academic Intelligence Platform",
  description:
    "AI-powered platform for analyzing past papers, predicting exam trends, and answering academic questions using RAG.",
  keywords: ["exam preparation", "AI", "academic", "past papers", "RAG"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-bg text-text antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
