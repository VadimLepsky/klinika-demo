// Single source of truth for "Koeficient" (referrals ÷ patients_served) thresholds,
// their tooltip copy, and their badge styling. A specialization can override these
// defaults with its own colored bands; when it doesn't, every call site here falls
// back to the same default bands below, so the rule can never drift out of sync
// between call sites.

export const COEFFICIENT_THRESHOLDS = {
  /** Below this: too few referrals relative to patients served. */
  LOW: 20,
  /** Below this: a moderate, expected level of referrals. */
  MODERATE: 45,
  /** Below this: a healthy, high level of complex-case referrals. */
  HIGH: 75,
  // At or above HIGH: exceeds the average norm, warrants a review.
} as const

export type BandColor = "red" | "yellow" | "green" | "blue" | "grey"

export const BAND_COLORS: BandColor[] = ["red", "yellow", "green", "blue", "grey"]

export const BAND_COLOR_LABELS: Record<BandColor, string> = {
  red: "Červená",
  yellow: "Žlutá",
  green: "Zelená",
  blue: "Modrá",
  grey: "Šedá",
}

const BAND_COLOR_CLASSNAME: Record<BandColor, string> = {
  red: "bg-status-unmatched text-status-unmatched-foreground",
  yellow: "bg-status-pending text-status-pending-foreground",
  green: "bg-status-accrued text-status-accrued-foreground",
  blue: "bg-status-info text-status-info-foreground",
  grey: "bg-status-skipped text-status-skipped-foreground",
}

/** Solid background className, for a small color swatch/dot (no foreground text). */
const BAND_COLOR_SWATCH_CLASSNAME: Record<BandColor, string> = {
  red: "bg-status-unmatched-foreground",
  yellow: "bg-status-pending-foreground",
  green: "bg-status-accrued-foreground",
  blue: "bg-status-info-foreground",
  grey: "bg-status-skipped-foreground",
}

export function getBandColorClassName(color: BandColor): string {
  return BAND_COLOR_CLASSNAME[color]
}

export function getBandSwatchClassName(color: BandColor): string {
  return BAND_COLOR_SWATCH_CLASSNAME[color]
}

/** A single colored threshold: applies from `min_pct` (inclusive) up to the next band's `min_pct`. */
export type CoefficientBand = { min_pct: number; color: BandColor }

export const DEFAULT_COEFFICIENT_BANDS: CoefficientBand[] = [
  { min_pct: 0, color: "red" },
  { min_pct: COEFFICIENT_THRESHOLDS.LOW, color: "yellow" },
  { min_pct: COEFFICIENT_THRESHOLDS.MODERATE, color: "green" },
  { min_pct: COEFFICIENT_THRESHOLDS.HIGH, color: "blue" },
]

/** Resolve the band that applies to a coefficient percentage. Falls back to the defaults when `bands` is empty/absent. */
export function resolveCoefficientBand(pct: number, bands?: CoefficientBand[] | null): CoefficientBand {
  const list = bands && bands.length > 0 ? bands : DEFAULT_COEFFICIENT_BANDS
  const sorted = [...list].sort((a, b) => a.min_pct - b.min_pct)
  let match = sorted[0]
  for (const band of sorted) {
    if (pct >= band.min_pct) match = band
    else break
  }
  return match
}

/** Badge className for a coefficient percentage, using a specialization's bands or the defaults. */
export function getCoefficientBadgeClassName(pct: number, bands?: CoefficientBand[] | null): string {
  return getBandColorClassName(resolveCoefficientBand(pct, bands).color)
}

/** Human-readable range for a single band within a sorted list, e.g. "20 % – 45 %" or "od 75 %" for the last one. */
export function getBandRangeLabel(band: CoefficientBand, sortedBands: CoefficientBand[]): string {
  const index = sortedBands.findIndex((b) => b === band)
  const next = index >= 0 ? sortedBands[index + 1] : undefined
  return next ? `${band.min_pct} % – ${next.min_pct} %` : `od ${band.min_pct} %`
}

/** Tooltip copy for a coefficient percentage: the range of its matching band, using a specialization's bands or the defaults. */
export function getCoefficientTooltip(pct: number, bands?: CoefficientBand[] | null): string {
  const list = bands && bands.length > 0 ? bands : DEFAULT_COEFFICIENT_BANDS
  const sorted = [...list].sort((a, b) => a.min_pct - b.min_pct)
  const band = resolveCoefficientBand(pct, sorted)
  return getBandRangeLabel(band, sorted)
}
