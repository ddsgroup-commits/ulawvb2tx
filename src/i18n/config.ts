/**
 * i18n configuration for ULAW VB2-TX LMS.
 *
 * Locale strategy:
 *  - `vi` (Vietnamese) is the default and the source of truth for copy.
 *  - `en` is fully translated for English-speaking guests, alumni, and
 *    visiting researchers.
 *  - `zh` (Simplified Chinese) and `ko` (Korean) are scaffolded with
 *    fallback to English so the language switcher works end-to-end even
 *    while translations are still being filled in.
 *
 * The locale is stored in a cookie (NEXT_LOCALE) so a user's choice
 * persists across sessions and devices that share an account.
 */
export const locales = ["vi", "en", "zh", "ko"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "vi";

export const localeNames: Record<Locale, string> = {
  vi: "Tiếng Việt",
  en: "English",
  zh: "中文",
  ko: "한국어",
};

export const localeFlags: Record<Locale, string> = {
  vi: "🇻🇳",
  en: "🇬🇧",
  zh: "🇨🇳",
  ko: "🇰🇷",
};

export const LOCALE_COOKIE = "NEXT_LOCALE";
