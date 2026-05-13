import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getLocale, getMessages } from "next-intl/server";
import "./globals.css";
import { AppProviders } from "@/components/providers/app-providers";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";

const inter = Inter({ subsets: ["latin", "vietnamese"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: {
    default: "ULAW VB2-TX LMS",
    template: "%s | ULAW VB2-TX",
  },
  description:
    "Cổng học tập hỗ trợ lớp Văn bằng 2 Luật từ xa Khóa 1 — Trường Đại học Luật TP. Hồ Chí Minh. Học liệu, lịch học, bài tập, thư viện pháp luật, AI hỗ trợ học tập.",
  keywords: ["ULAW", "VB2-TX", "Đại học Luật", "Văn bằng 2", "LMS", "law", "học từ xa"],
  authors: [{ name: "Lớp VB2-TX" }],
  manifest: "/manifest.webmanifest",
  applicationName: "ULAW VB2-TX LMS",
  // Public landing is indexable; internal portal routes opt-out via per-page metadata.
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    url: "https://ulawvb2tx.com",
    title: "ULAW VB2-TX LMS",
    description: "Cổng học tập hỗ trợ lớp Văn bằng 2 Luật từ xa Khoá 1 (2026).",
    siteName: "ULAW VB2-TX LMS",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ULAW VB2-TX",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1F3A68" },
    { media: "(prefers-color-scheme: dark)", color: "#0d1e3a" },
  ],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.webmanifest" />
      </head>
      <body className="antialiased bg-white text-slate-900">
        <AppProviders locale={locale} messages={messages}>
          {children}
          <RegisterServiceWorker />
        </AppProviders>
      </body>
    </html>
  );
}
