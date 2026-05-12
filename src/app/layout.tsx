import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "ULAW VB2-TX LMS",
    template: "%s | ULAW VB2-TX",
  },
  description: "Hệ thống quản lý học tập lớp Văn bằng 2 - Trường Đại học Luật TP.HCM",
  keywords: ["ULAW", "Đại học Luật", "VB2", "LMS", "học tập"],
  authors: [{ name: "ULAW VB2-TX" }],
  robots: "noindex, nofollow", // Internal portal — not for search engines
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#1F3A68",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="antialiased bg-white text-slate-900">
        {children}
      </body>
    </html>
  );
}
