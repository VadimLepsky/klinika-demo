/**
 * Appends/overwrites the `period` (and optional `spec`) search params on an
 * internal href while preserving any other query params it may already carry.
 *
 * Used everywhere the app links between period-scoped pages (/, /attention,
 * /doctors/[id], /periods) so the active period and specialization filter stay
 * in sync across navigation, since the URL params are the single source of truth.
 */
export function withPeriod(href: string, period?: string | null, spec?: string | null): string {
  const [path, query] = href.split("?")
  const params = new URLSearchParams(query)
  if (period) params.set("period", period)
  if (spec) params.set("spec", spec)
  const qs = params.toString()
  return qs ? `${path}?${qs}` : path
}
