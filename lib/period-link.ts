/**
 * Appends/overwrites the `period` search param on an internal href while
 * preserving any other query params it may already carry.
 *
 * Used everywhere the app links between period-scoped pages (/, /attention,
 * /doctors/[id], /periods) so the active period stays in sync across
 * navigation, since the URL `?period=` param is the single source of truth.
 */
export function withPeriod(href: string, period: string): string {
  const [path, query] = href.split("?")
  const params = new URLSearchParams(query)
  params.set("period", period)
  return `${path}?${params.toString()}`
}
