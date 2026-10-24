import type { Locale } from "./config"
import { en } from "./messages/en"

// Messages are keyed by their Czech source text (gettext style): Czech is the
// source language, so `t("Přehled")` renders as-is in Czech and is looked up
// in the English catalog otherwise. A missing English entry falls back to the
// Czech text instead of crashing; `npm run i18n:check` lists the gaps.

export type TVars = Record<string, string | number>
export type TFunction = (message: string, vars?: TVars) => string

const catalogs: Record<Locale, Record<string, string> | null> = {
  cs: null,
  en,
}

function interpolate(message: string, vars?: TVars): string {
  if (!vars) return message
  return message.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  )
}

export function createT(locale: Locale): TFunction {
  const catalog = catalogs[locale]
  return (message, vars) => interpolate(catalog?.[message] ?? message, vars)
}

/**
 * Czech has three plural forms (1 / 2–4 / 5+ and 0), English two. Pass the
 * Czech forms; each is translated through the catalog, so the English entry
 * for the "few" and "many" forms is usually the same plural string.
 *   tn(t, n, "{n} lékař", "{n} lékaři", "{n} lékařů")
 */
export function pluralForm(
  locale: Locale,
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const abs = Math.abs(n)
  if (locale === "en") return abs === 1 ? one : many
  if (abs === 1) return one
  if (abs >= 2 && abs <= 4 && Number.isInteger(abs)) return few
  return many
}
