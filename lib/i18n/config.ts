export const locales = ["cs", "en"] as const
export type Locale = (typeof locales)[number]

export const defaultLocale: Locale = "cs"

/** Cookie that stores the chosen UI language. Set by the switcher and by /en, /cs links. */
export const LOCALE_COOKIE = "locale"

export const localeNames: Record<Locale, string> = {
  cs: "Čeština",
  en: "English",
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (locales as readonly string[]).includes(value)
}
