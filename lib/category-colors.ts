export const CATEGORY_COLORS: Record<string, string> = {
  medlab: "#3AB795",
  smear: "#3083DC",
  biomat: "#957186",
  esculab: "#39A2AE",
  inhouse: "#DBA159",
  consult: "#CF5C4E",
  uzd: "#7C6BD6",
  endo: "#8AA84B",
  ekg: "#C4618F",
}

export const OTHER_COLOR = "#6B7280"

/** Colour lookup is always by bucket key from commission_monthly — never by array index. */
export function getCategoryColor(bucket: string) {
  return CATEGORY_COLORS[bucket] ?? OTHER_COLOR
}

/** Shared series colours for line/bar charts on "/" and /doctors/[master_id].
 *  A given metric always uses the same colour on both pages. */
export const SERIES_COLORS = {
  referrals: "#3083DC",
  commission: "#CF5C4E",
  referredSum: "#DBA159",
  patients: "#3AB795",
  coefficient: "#7C6BD6",
} as const
