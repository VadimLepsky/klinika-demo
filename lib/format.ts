import type { Locale } from "@/lib/i18n/config"

// Locale-aware formatting. Amounts stay in Czech crowns in every language —
// only the number grouping changes: cs "25 792,89 Kč", en "25,792.89 Kč".
// Dates: cs "01.06.2026", en "01/06/2026".

const INTL_LOCALE: Record<Locale, string> = { cs: "cs-CZ", en: "en-GB" }

const MONTHS: Record<Locale, string[]> = {
  cs: [
    "Leden",
    "Únor",
    "Březen",
    "Duben",
    "Květen",
    "Červen",
    "Červenec",
    "Srpen",
    "Září",
    "Říjen",
    "Listopad",
    "Prosinec",
  ],
  en: [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ],
}

function toNumber(value: number | string | null | undefined): number {
  return typeof value === "string" ? Number.parseFloat(value) : (value ?? 0)
}

function toDate(value: string | Date): Date {
  return typeof value === "string" ? new Date(value) : value
}

function buildFormatters(locale: Locale) {
  const intl = INTL_LOCALE[locale]
  const currencyFmt = new Intl.NumberFormat(intl, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const intFmt = new Intl.NumberFormat(intl, { maximumFractionDigits: 0 })
  const compactFmt = new Intl.NumberFormat(intl, { notation: "compact", maximumFractionDigits: 0 })
  const oneDecimalFmt = new Intl.NumberFormat(intl, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
  const dateSep = locale === "cs" ? "." : "/"
  // Pinned to the clinic's timezone so server and client render identically
  // (an unpinned toLocaleString renders UTC on the server, local time in the
  // browser, which causes a React hydration mismatch).
  const dateTimeFmt = new Intl.DateTimeFormat(intl, {
    timeZone: "Europe/Prague",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })

  function formatCurrency(value: number | string | null | undefined): string {
    const n = toNumber(value)
    if (!Number.isFinite(n)) return "—"
    return `${currencyFmt.format(n)} Kč`
  }

  function formatNumber(value: number | string | null | undefined): string {
    const n = toNumber(value)
    if (!Number.isFinite(n)) return "—"
    return intFmt.format(n)
  }

  /** Chart axis ticks: "12 tis." / "12K". */
  function formatCompact(value: number | string | null | undefined): string {
    const n = toNumber(value)
    if (!Number.isFinite(n)) return "—"
    return compactFmt.format(n)
  }

  function formatDecimal(value: number | string | null | undefined): string {
    const n = toNumber(value)
    if (!Number.isFinite(n)) return "—"
    return oneDecimalFmt.format(n)
  }

  /** Whole crowns, no haléře — for KPI cards and stat tiles where width matters. */
  function formatCurrencyRounded(value: number | string | null | undefined): string {
    const n = toNumber(value)
    if (!Number.isFinite(n)) return "—"
    return `${intFmt.format(Math.round(n))} Kč`
  }

  /** Rate stored as 0.07 => "7%". */
  function formatRate(rate: number | string | null | undefined): string {
    const n = toNumber(rate)
    if (!Number.isFinite(n)) return "—"
    const pct = n * 100
    return `${intFmt.format(Number(pct.toFixed(2)))}%`
  }

  /** referrals ÷ patients_served as %, may exceed 100. */
  function formatCoefficient(referrals: number, patientsServed: number): string {
    if (!patientsServed) return "—"
    const pct = (referrals / patientsServed) * 100
    return `${intFmt.format(Math.round(pct))}%`
  }

  /** "2026-06-01" (or Date) => "01.06.2026" / "01/06/2026". */
  function formatDate(value: string | Date | null | undefined): string {
    if (!value) return "—"
    const d = toDate(value)
    if (Number.isNaN(d.getTime())) return "—"
    const dd = String(d.getUTCDate()).padStart(2, "0")
    const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
    const yyyy = d.getUTCFullYear()
    return `${dd}${dateSep}${mm}${dateSep}${yyyy}`
  }

  /** "2026-06-01" => "Červen 2026" / "June 2026". */
  function formatMonth(value: string | Date | null | undefined): string {
    if (!value) return "—"
    const d = toDate(value)
    if (Number.isNaN(d.getTime())) return "—"
    return `${MONTHS[locale][d.getUTCMonth()]} ${d.getUTCFullYear()}`
  }

  function formatDateTime(value: string | Date | null | undefined): string {
    if (!value) return "—"
    const d = toDate(value)
    if (Number.isNaN(d.getTime())) return "—"
    const s = dateTimeFmt.format(d).replace(", ", " ")
    return locale === "cs" ? s.replace(/\.\s+/g, ".") : s
  }

  return {
    formatCurrency,
    formatCurrencyRounded,
    formatNumber,
    formatCompact,
    formatDecimal,
    formatRate,
    formatCoefficient,
    formatDate,
    formatMonth,
    formatDateTime,
  }
}

export type Formatters = ReturnType<typeof buildFormatters>

const cache = new Map<Locale, Formatters>()

export function getFormatters(locale: Locale): Formatters {
  let f = cache.get(locale)
  if (!f) {
    f = buildFormatters(locale)
    cache.set(locale, f)
  }
  return f
}

/** First day of next month as "YYYY-MM" (for month <input>). */
export function nextMonthValue(): string {
  const now = new Date()
  const y = now.getUTCFullYear()
  const m = now.getUTCMonth() + 1 // 0-based -> next month (1-based)
  const ny = m > 11 ? y + 1 : y
  const nm = m > 11 ? 0 : m
  return `${ny}-${String(nm + 1).padStart(2, "0")}`
}

/** "YYYY-MM" month-input value => "YYYY-MM-01" date string. */
export function monthInputToDate(value: string): string {
  return `${value}-01`
}

const CS_TRANSLIT: Record<string, string> = {
  á: "a", č: "c", ď: "d", é: "e", ě: "e", í: "i", ň: "n", ó: "o",
  ř: "r", š: "s", ť: "t", ú: "u", ů: "u", ý: "y", ž: "z", "'": "", "’": "",
}

/** Best-effort CZ label -> ASCII slug for a bucket key suggestion (always user-editable). */
export function slugify(label: string): string {
  return label
    .toLowerCase()
    .split("")
    .map((ch) => CS_TRANSLIT[ch] ?? ch)
    .join("")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40)
}

/** Normalize a period value to "YYYY-MM-DD". */
export function periodKey(value: string | Date): string {
  if (value instanceof Date) {
    const yyyy = value.getUTCFullYear()
    const mm = String(value.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(value.getUTCDate()).padStart(2, "0")
    return `${yyyy}-${mm}-${dd}`
  }
  return value.slice(0, 10)
}
