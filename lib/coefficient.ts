// Single source of truth for "Koeficient" (referrals ÷ patients_served) thresholds,
// their tooltip copy, and their badge styling. Referenced by the doctors table badge
// so the rule can never drift out of sync between call sites.

export const COEFFICIENT_THRESHOLDS = {
  /** Below this: too few referrals relative to patients served. */
  LOW: 20,
  /** Below this: a moderate, expected level of referrals. */
  MODERATE: 45,
  /** Below this: a healthy, high level of complex-case referrals. */
  HIGH: 75,
  // At or above HIGH: exceeds the average norm, warrants a review.
} as const

export type CoefficientLevel = "low" | "moderate" | "high" | "excessive"

/** Classify a coefficient percentage (referrals ÷ patients_served × 100) into a level. */
export function getCoefficientLevel(pct: number): CoefficientLevel {
  if (pct < COEFFICIENT_THRESHOLDS.LOW) return "low"
  if (pct < COEFFICIENT_THRESHOLDS.MODERATE) return "moderate"
  if (pct < COEFFICIENT_THRESHOLDS.HIGH) return "high"
  return "excessive"
}

const COEFFICIENT_META: Record<CoefficientLevel, { className: string; tooltip: string }> = {
  low: {
    className: "bg-status-unmatched text-status-unmatched-foreground",
    tooltip: "Nízká úroveň doporučení",
  },
  moderate: {
    className: "bg-status-pending text-status-pending-foreground",
    tooltip: "Mírná úroveň doporučení",
  },
  high: {
    className: "bg-status-accrued text-status-accrued-foreground",
    tooltip: "Vysoká úroveň komplexních zákroků",
  },
  excessive: {
    className: "bg-status-info text-status-info-foreground",
    tooltip: "Překračuje běžnou normu, vyžaduje ověření odůvodněnosti",
  },
}

/** Badge className for a coefficient percentage. */
export function getCoefficientBadgeClassName(pct: number): string {
  return COEFFICIENT_META[getCoefficientLevel(pct)].className
}

/** Tooltip copy for a coefficient percentage. */
export function getCoefficientTooltip(pct: number): string {
  return COEFFICIENT_META[getCoefficientLevel(pct)].tooltip
}
