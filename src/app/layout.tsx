import type { Metadata } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: {
    default: "ULAW VB2 – Class Portal",
    template: "%s · ULAW VB2",
  },
  description: "Cổng thông tin lớp Văn bằng 2 Luật từ xa – Trường Đại học Luật TP. HCM",
  themeColor: "#1F3A68",
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='16' fill='%231F3A68'/%3E%3Ctext x='50' y='62' text-anchor='middle' font-family='Inter,sans-serif' font-size='42' font-weight='800' fill='white'%3EUL%3C/text%3E%3C/svg%3E",
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="vi" suppressHydrationWarning>
      <body>
        <SessionProvider session={session}>
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
