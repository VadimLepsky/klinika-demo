import "server-only"
import { db } from "@/lib/demo/store"
import { periodKey } from "@/lib/format"

export type PeriodBlockers = {
  pendingReview: number
  unmatched: number
  unmappedSources: number
  unflaggedStaff: number
}

export type PeriodRow = {
  period: string
  status: string
  frozen_at: string | null
  frozen_by: string | null
  total_commission: number
  computed_commission: number
  doctors: number
  blockers: PeriodBlockers
  canFreeze: boolean
}

/**
 * Lists every period with its freeze blockers.
 *
 * A month may be frozen only when all four blocker counts are zero:
 *  - commission_lines with status = 'pending_review' in that month
 *  - sources with status = 'unmapped' that appear in that month's lines
 *  - staff with is_doctor IS NULL appearing as beneficiary in that month
 *  - commission_lines with status = 'unmatched' whose item_id is NOT ignored
 */
export async function getPeriodsWithBlockers(): Promise<PeriodRow[]> {
  const state = db()

  return state.periods
    .slice()
    .sort((a, b) => (a.period < b.period ? 1 : -1))
    .map((p) => {
      const lines = state.commissionLines.filter((l) => l.period === p.period)
      const monthly = state.commissionMonthly.filter((m) => m.period === p.period)

      const pendingReview = lines.filter((l) => l.status === "pending_review").length
      const unmatched = lines.filter(
        (l) =>
          l.status === "unmatched" &&
          !state.unmatchedIgnored.some((ui) => ui.item_id === l.item_id),
      ).length
      const unmappedSources = new Set(
        lines
          .filter((l) =>
            state.sources.some((s) => s.source_id === l.source_id && s.status === "unmapped"),
          )
          .map((l) => l.source_id),
      ).size
      const unflaggedStaff = new Set(
        lines
          .filter((l) =>
            state.staff.some(
              (s) => s.master_id === l.beneficiary_master_id && s.is_doctor === null,
            ),
          )
          .map((l) => l.beneficiary_master_id),
      ).size

      const blockers: PeriodBlockers = {
        pendingReview,
        unmatched,
        unmappedSources,
        unflaggedStaff,
      }
      const clean =
        blockers.pendingReview === 0 &&
        blockers.unmatched === 0 &&
        blockers.unmappedSources === 0 &&
        blockers.unflaggedStaff === 0

      return {
        period: periodKey(p.period),
        status: p.status,
        frozen_at: p.frozen_at ? new Date(p.frozen_at).toISOString() : null,
        frozen_by: p.frozen_by,
        total_commission: Number(p.total_commission ?? 0),
        computed_commission: monthly.reduce((s, m) => s + m.commission, 0),
        doctors: new Set(monthly.filter((m) => m.commission > 0).map((m) => m.master_id)).size,
        blockers,
        canFreeze: clean && p.status !== "frozen",
      }
    })
}
