import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/shared/navbar";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "GrabCollab — Hire Indian Instagram Creators",
  description:
    "Post a campaign, search verified creators, and hire the perfect match for your brand. India's creator hiring portal.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[#121511]" style={{ fontFamily: 'var(--font-inter), Inter, Arial, sans-serif' }}>
        <Navbar />
        <main className="flex-1 flex flex-col pt-16">{children}</main>
        <Toaster richColors closeButton position="top-right" />
      </body>
    </html>
  );
}
