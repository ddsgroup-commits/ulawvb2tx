"use client";

import { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";
import { NextIntlClientProvider } from "next-intl";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

interface AppProvidersProps {
  children: ReactNode;
  locale: string;
  messages: any;
}

/**
 * Single client-side provider tree. Mounted from RootLayout so every
 * page has SessionProvider (NextAuth), NextIntl i18n, Radix tooltip
 * portals, and the global toast container available without each page
 * repeating the wiring.
 */
export function AppProviders({ children, locale, messages }: AppProvidersProps) {
  return (
    <SessionProvider>
      <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Ho_Chi_Minh">
        <TooltipProvider delayDuration={200}>
          {children}
          <Toaster />
        </TooltipProvider>
      </NextIntlClientProvider>
    </SessionProvider>
  );
}
