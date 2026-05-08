import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GSC Ranking Drop Analyzer",
  description:
    "Compare Google Search Console periods, find pages losing rank, and identify content gaps vs. competitors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
