// Shared client+server KPI types and formatting helpers. A KPI profile adjusts a
// doctor's monthly commission (from referral-based buckets only) using a factor
// K derived from three metrics: docházkovost (show-up rate), průměrný účet (average
// check), and aktivita (referral activity). Actual computation of doctor_kpi_monthly
// happens in an external worker — this app only configures profiles and displays results.

export type KpiMetric = "showup" | "avg_check" | "activity"

export const KPI_METRICS: KpiMetric[] = ["showup", "avg_check", "activity"]

export const KPI_METRIC_LABELS: Record<KpiMetric, string> = {
  showup: "Docházkovost, %",
  avg_check: "Průměrný účet, Kč",
  activity: "Aktivita, %",
}

export const KPI_METRIC_HINTS: Record<KpiMetric, string> = {
  showup: "podíl uskutečněných doporučení z plánovaných (podle částky)",
  avg_check: "provizní základ ÷ doporučení s provizí",
  activity: "pacientů doporučeno ÷ pacientů lékaře za měsíc",
}

/** A single band read from `kpi_profile_bands`: applies from `min_value` up to (excl.) `max_value`, or unbounded above if `max_value` is null. */
export type KpiBand = { min_value: number; max_value: number | null; points: number }
export type KpiBandsByMetric = Record<KpiMetric, KpiBand[]>

export function emptyKpiBandsByMetric(): KpiBandsByMetric {
  return { showup: [], avg_check: [], activity: [] }
}

/** A band as edited/submitted from the UI — camelCase, values already parsed to numbers. */
export type KpiBandInput = { minValue: number; maxValue: number | null; points: number }
export type KpiBandInputsByMetric = Record<KpiMetric, KpiBandInput[]>

/** K factor, e.g. 1.05 => "1.05". */
export function formatKFactor(k: number): string {
  return k.toFixed(2)
}

/** Signed points, e.g. 0.1 => "+0.10", -0.05 => "-0.05", 0 => "0.00". */
export function formatKpiPoints(points: number): string {
  const rounded = Math.round(points * 100) / 100
  const sign = rounded > 0 ? "+" : ""
  return `${sign}${rounded.toFixed(2)}`
}

export function kpiPointsColorClassName(points: number): string {
  if (points > 1e-9) return "text-status-accrued-foreground"
  if (points < -1e-9) return "text-status-unmatched-foreground"
  return "text-muted-foreground"
}

export function kFactorColorClassName(k: number): string {
  if (Math.abs(k - 1) < 1e-9) return "text-muted-foreground"
  return k > 1 ? "text-status-accrued-foreground" : "text-status-unmatched-foreground"
}
