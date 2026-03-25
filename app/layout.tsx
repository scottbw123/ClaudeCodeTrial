import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RankForge — SEO Agency That Drives Real Results",
  description:
    "RankForge is a full-service SEO agency helping brands dominate search. Technical SEO, link building, content strategy, and more.",
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
