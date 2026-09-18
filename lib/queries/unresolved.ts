import "server-only"
import { db } from "@/lib/demo/store"
import { periodKey } from "@/lib/format"

/**
 * Single source of truth for "what still blocks a month" across /attention and /periods.
 *
 * A commission_lines row keeps its original status ('unmatched' / 'pending_review') even
 * after a human resolves it elsewhere — adding the item to services_catalog, ignoring it
 * via unmatched_ignored, or mapping its category. The historical row is never rewritten.
 * So "resolved" is a derived condition, not a status value, and every screen that counts
 * these rows must apply the exact same derivation or two pages will disagree about what's
 * still open. Both getUnresolvedUnmatchedLines and getUnresolvedCountsByPeriod below apply
 * identical exclusions — use these instead of filtering commission_lines directly.
 */

/** The only reason value 'pending_review' rows carry today (new CRM category, no rate yet). */
const PENDING_REVIEW_REASON = "nová kategorie bez sazby"

export type UnresolvedUnmatchedLine = {
  period: string
  item_id: string
  item_name: string
  line_count: number
  total_amount: number
  reason: string | null
}

/**
 * Genuinely unresolved 'unmatched' commission_lines, grouped by (period, item_id) so the
 * same missing service isn't repeated once per check. Excludes items already registered in
 * services_catalog (resolved via "Přidat službu") or explicitly dismissed via
 * unmatched_ignored ("Ignorovat").
 *
 * Pass a period to scope to that month; omit to see unresolved lines across all periods.
 */
export async function getUnresolvedUnmatchedLines(period?: string): Promise<UnresolvedUnmatchedLine[]> {
  const state = db()
  const groups = new Map<string, UnresolvedUnmatchedLine>()

  for (const l of state.commissionLines) {
    if (l.status !== "unmatched" || l.item_id == null) continue
    if (period && l.period !== period) continue
    if (state.unmatchedIgnored.some((ui) => ui.item_id === l.item_id)) continue
    if (state.servicesCatalog.some((sc) => sc.service_id === l.item_id)) continue

    const key = `${l.period}|${l.item_id}`
    const found = groups.get(key)
    if (found) {
      found.line_count += 1
      found.total_amount += l.base_amount
    } else {
      groups.set(key, {
        period: periodKey(l.period),
        item_id: l.item_id,
        item_name: l.item_name ?? "—",
        line_count: 1,
        total_amount: l.base_amount,
        reason: l.reason ?? null,
      })
    }
  }

  return [...groups.values()]
    .sort((a, b) => (a.period === b.period ? b.line_count - a.line_count : a.period < b.period ? 1 : -1))
    .slice(0, 500)
}

export type UnresolvedCounts = {
  unmatched: number
  pendingReview: number
}

/**
 * Per-period counts of genuinely unresolved 'unmatched' and 'pending_review' lines, keyed
 * by period key. This is what /periods uses for its freeze precondition and tooltip — it
 * mirrors the exact exclusions applied by getUnresolvedUnmatchedLines above (unmatched) and
 * the "Nové kategorie" card on /attention (pending_review), so the two pages can never
 * disagree about what's blocking a freeze.
 */
export async function getUnresolvedCountsByPeriod(): Promise<Map<string, UnresolvedCounts>> {
  const state = db()
  const map = new Map<string, UnresolvedCounts>()

  const bump = (period: string, field: keyof UnresolvedCounts) => {
    const key = periodKey(period)
    const counts = map.get(key) ?? { unmatched: 0, pendingReview: 0 }
    counts[field] += 1
    map.set(key, counts)
  }

  for (const l of state.commissionLines) {
    if (
      l.status === "unmatched" &&
      l.item_id != null &&
      !state.unmatchedIgnored.some((ui) => ui.item_id === l.item_id) &&
      !state.servicesCatalog.some((sc) => sc.service_id === l.item_id)
    ) {
      bump(l.period, "unmatched")
    } else if (l.status === "pending_review" && l.reason === PENDING_REVIEW_REASON) {
      bump(l.period, "pendingReview")
    }
  }

  return map
}
