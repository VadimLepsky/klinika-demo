import "server-only"
import { db } from "@/lib/demo/store"
import { periodKey } from "@/lib/format"

export type ReferredVolumeRow = {
  period: string
  master_id: string
  referred_base: number
}

/**
 * ONE shared definition of "Objem doporučených" (referred volume).
 *
 * This is a VOLUME metric of what a doctor referred out, not a commission one:
 * it only counts commission_monthly buckets where the referring doctor is the
 * beneficiary ("source"). Buckets paid to the performer (e.g. gynaecological
 * smears) are services the doctor did themselves — they must be excluded
 * here, even though they still count toward "Provize" figures elsewhere.
 *
 * Every KPI card, doctors-table column, and chart that shows referred volume
 * derives from this function so the numbers can never disagree.
 *
 * Pass a period to scope to one month (KPI card, doctors table); omit to get
 * every row across all periods (monthly series, per-doctor charts).
 * Pass masterId to scope to one doctor across all months (doctor-page chart).
 * Pass masterIds to scope to a set of doctors (specialization filter on "/").
 */
export async function getReferredVolumeRows(
  period?: string,
  masterId?: string,
  masterIds?: string[] | null,
): Promise<ReferredVolumeRow[]> {
  const state = db()
  const sourceBuckets = new Set(state.buckets.filter((b) => b.beneficiary === "source").map((b) => b.bucket))
  const masterIdSet = masterIds ? new Set(masterIds) : null

  const rows = state.commissionMonthly.filter(
    (m) =>
      sourceBuckets.has(m.bucket) &&
      (!period || m.period === period) &&
      (!masterId || m.master_id === masterId) &&
      (!masterIdSet || masterIdSet.has(m.master_id)),
  )

  const grouped = new Map<string, number>()
  for (const m of rows) {
    const key = `${m.period}|${m.master_id}`
    grouped.set(key, (grouped.get(key) ?? 0) + m.base)
  }

  return [...grouped.entries()].map(([key, referred_base]) => {
    const [p, masterIdKey] = key.split("|")
    return { period: periodKey(p), master_id: masterIdKey, referred_base }
  })
}

/** Total referred volume for one month — "Objem doporučených" KPI card on "/". */
export async function getReferredVolumeTotal(period: string, masterIds?: string[] | null): Promise<number> {
  const rows = await getReferredVolumeRows(period, undefined, masterIds)
  return rows.reduce((sum, r) => sum + r.referred_base, 0)
}

/** Referred volume per doctor for one month — doctors table column. */
export async function getReferredVolumeByDoctor(
  period: string,
  masterIds?: string[] | null,
): Promise<Map<string, number>> {
  const rows = await getReferredVolumeRows(period, undefined, masterIds)
  const map = new Map<string, number>()
  for (const r of rows) {
    map.set(r.master_id, (map.get(r.master_id) ?? 0) + r.referred_base)
  }
  return map
}

/** Per-month referred volume for one doctor — doctor-page chart. */
export async function getReferredVolumeByMonth(masterId: string): Promise<Map<string, number>> {
  const rows = await getReferredVolumeRows(undefined, masterId)
  const map = new Map<string, number>()
  for (const r of rows) {
    map.set(r.period, (map.get(r.period) ?? 0) + r.referred_base)
  }
  return map
}
