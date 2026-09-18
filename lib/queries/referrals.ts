import "server-only"
import { db } from "@/lib/demo/store"
import { periodKey } from "@/lib/format"

export type ReferralVisit = {
  period: string
  master_id: string
}

/**
 * ONE shared definition of what counts as a "doporučení" (referral).
 *
 * Every KPI card, doctors-table column, and chart that shows referral counts
 * derives from this function so the numbers can never disagree.
 *
 * Pass a period to scope to one month (KPI card, doctors table); omit to get
 * every referral visit across all periods (monthly series, per-doctor charts).
 * Pass masterId to scope to one doctor across all months (doctor-page chart).
 */
export async function getReferralVisits(period?: string, masterId?: string): Promise<ReferralVisit[]> {
  return db()
    .referralVisits.filter(
      (v) => (!period || v.period === period) && (!masterId || v.master_id === masterId),
    )
    .map((v) => ({ period: periodKey(v.period), master_id: v.master_id }))
}

/** Total referral count for one month — "Počet doporučení" KPI card. */
export async function getReferralsTotal(period: string): Promise<number> {
  const rows = await getReferralVisits(period)
  return rows.length
}

/** Referral count per doctor for one month — doctors table "Počet doporučení" column. */
export async function getReferralsByDoctor(period: string): Promise<Map<string, number>> {
  const rows = await getReferralVisits(period)
  const map = new Map<string, number>()
  for (const r of rows) {
    map.set(r.master_id, (map.get(r.master_id) ?? 0) + 1)
  }
  return map
}

/** Clinic-wide referral totals per month — "Vývoj doporučení" chart. */
export async function getReferralsMonthlyTotals(): Promise<Map<string, number>> {
  const rows = await getReferralVisits()
  const map = new Map<string, number>()
  for (const r of rows) {
    map.set(r.period, (map.get(r.period) ?? 0) + 1)
  }
  return map
}

/** Per-doctor, per-month referral counts — overlay multiselect and doctor-page chart. */
export async function getReferralsByDoctorAndMonth(): Promise<Map<string, Map<string, number>>> {
  const rows = await getReferralVisits()
  const map = new Map<string, Map<string, number>>()
  for (const r of rows) {
    if (!map.has(r.master_id)) map.set(r.master_id, new Map())
    const inner = map.get(r.master_id)!
    inner.set(r.period, (inner.get(r.period) ?? 0) + 1)
  }
  return map
}
