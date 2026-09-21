import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System Design Vault | NotebookLM for Engineering Architecture",
  description: "Distraction-free video explorer, transcripts, cross-channel comparisons, and architecture notes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#0b0f19] text-slate-100 min-h-screen antialiased flex flex-col">
        {children}
      </body>
    </html>
  );
}
