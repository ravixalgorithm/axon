import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Axon - Extract Design Tokens from UI Screenshots",
  description:
    "Upload UI design screenshots, extract design tokens (colors, fonts, spacing), and generate detailed prompts for AI code generation with Claude or GPT.",
  keywords: [
    "design tokens",
    "UI design",
    "AI prompts",
    "design system",
    "color extraction",
    "typography",
    "React",
    "Tailwind CSS",
  ],
  authors: [{ name: "Axon" }],
  openGraph: {
    title: "Axon - Extract Design Tokens from UI Screenshots",
    description: "Upload UI designs, extract tokens, generate AI-ready prompts for code generation.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
