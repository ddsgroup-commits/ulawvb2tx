import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, locales, LOCALE_COOKIE, type Locale } from "./config";

// Loaded by the next-intl plugin in next.config.ts.
// Reads the locale from the NEXT_LOCALE cookie (set by the language
// switcher) and falls back to the default `vi`. Messages for unfilled
// locales fall through to English so the switcher never shows blank UI.
export default getRequestConfig(async () => {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value as Locale | undefined;
  const locale: Locale =
    cookieValue && locales.includes(cookieValue) ? cookieValue : defaultLocale;

  let messages: Record<string, unknown>;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    messages = (await import(`../../messages/${defaultLocale}.json`)).default;
  }

  // English fallback for incomplete locales (zh/ko).
  if (locale !== defaultLocale && locale !== "en") {
    const enMessages = (await import(`../../messages/en.json`)).default;
    messages = { ...enMessages, ...messages };
  }

  return { locale, messages, timeZone: "Asia/Ho_Chi_Minh" };
});
