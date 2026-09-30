// cs-CZ formatting helpers. Currency: "25 792,89 Kč", dates: "01.06.2026".

const currencyFmt = new Intl.NumberFormat("cs-CZ", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const intFmt = new Intl.NumberFormat("cs-CZ", { maximumFractionDigits: 0 })

export function formatCurrency(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0)
  if (!Number.isFinite(n)) return "—"
  return `${currencyFmt.format(n)} Kč`
}

export function formatNumber(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0)
  if (!Number.isFinite(n)) return "—"
  return intFmt.format(n)
}

/** Whole crowns, no haléře — for KPI cards and stat tiles where width matters. */
export function formatCurrencyRounded(value: number | string | null | undefined): string {
  const n = typeof value === "string" ? Number.parseFloat(value) : (value ?? 0)
  if (!Number.isFinite(n)) return "—"
  return `${intFmt.format(Math.round(n))} Kč`
}

/** Rate stored as 0.07 => "7%". */
export function formatRate(rate: number | string | null | undefined): string {
  const n = typeof rate === "string" ? Number.parseFloat(rate) : (rate ?? 0)
  if (!Number.isFinite(n)) return "—"
  const pct = n * 100
  return `${intFmt.format(Number(pct.toFixed(2)))}%`
}

/** referrals ÷ patients_served as %, may exceed 100. */
export function formatCoefficient(referrals: number, patientsServed: number): string {
  if (!patientsServed) return "—"
  const pct = (referrals / patientsServed) * 100
  return `${intFmt.format(Math.round(pct))}%`
}

/** "2026-06-01" (or Date) => "01.06.2026". */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const yyyy = d.getUTCFullYear()
  return `${dd}.${mm}.${yyyy}`
}

/** "2026-06-01" => "Červen 2026". */
const MONTHS_CS = [
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
]

export function formatMonth(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return `${MONTHS_CS[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

// Pinned to the clinic's timezone so server and client render identically
// (an unpinned toLocaleString renders UTC on the server, local time in the
// browser, which causes a React hydration mismatch).
const dateTimeFmt = new Intl.DateTimeFormat("cs-CZ", {
  timeZone: "Europe/Prague",
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
})

export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return "—"
  const d = typeof value === "string" ? new Date(value) : value
  if (Number.isNaN(d.getTime())) return "—"
  return dateTimeFmt.format(d).replace(", ", " ").replace(/\.\s+/g, ".")
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
