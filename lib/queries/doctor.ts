import "server-only"
import { db } from "@/lib/demo/store"
import { getDoctorDisplayName } from "@/lib/doctor-name"
import { periodKey } from "@/lib/format"
import type { LineStatus } from "@/components/status-chip"
import { getReferralVisits } from "@/lib/queries/referrals"
import { getReferredVolumeByMonth } from "@/lib/queries/referred-volume"

export type DoctorHeader = {
  master_id: string
  full_name: string
  is_doctor: boolean | null
  note: string | null
  dismissed: boolean
}

export async function getDoctorHeader(masterId: string): Promise<DoctorHeader | null> {
  const state = db()
  const row = state.staff.find((s) => s.master_id === masterId)
  const displayName = await getDoctorDisplayName(masterId)

  if (!row) {
    // Doctor may exist only in reporting tables without a staff row yet.
    const known = state.commissionMonthly.some((m) => m.master_id === masterId)
    if (!known) return null
    return {
      master_id: masterId,
      full_name: displayName,
      is_doctor: null,
      note: null,
      dismissed: false,
    }
  }

  const note = row.note ?? null
  return {
    master_id: row.master_id,
    full_name: displayName,
    is_doctor: row.is_doctor,
    note,
    // No explicit "fired" column in schema — derive from the note as a soft flag.
    dismissed: !!note && /ukončen|odešl/i.test(note),
  }
}

export type DoctorPayoutStatus = {
  paid: boolean
  paid_by: string | null
  paid_at: string | null
}

export async function getDoctorPayoutStatus(masterId: string, period: string): Promise<DoctorPayoutStatus> {
  const payout = db().doctorPayouts.find((p) => p.master_id === masterId && p.period === period)
  return {
    paid: !!payout,
    paid_by: payout?.paid_by ?? null,
    paid_at: payout?.paid_at ?? null,
  }
}

export type DoctorMonthPoint = {
  period: string
  referrals: number
  referred_base: number
  commission: number
  patients_served: number
}

export async function getDoctorMonthlySeries(masterId: string): Promise<DoctorMonthPoint[]> {
  const state = db()
  const [referralVisits, referredVolumeByPeriod] = await Promise.all([
    getReferralVisits(undefined, masterId),
    getReferredVolumeByMonth(masterId),
  ])

  const referralsByPeriod = new Map<string, number>()
  for (const v of referralVisits) {
    referralsByPeriod.set(v.period, (referralsByPeriod.get(v.period) ?? 0) + 1)
  }

  return state.periods
    .slice()
    .sort((a, b) => (a.period < b.period ? -1 : 1))
    .map((p) => {
      const period = periodKey(p.period)
      const stats = state.doctorMonthlyStats.find(
        (d) => d.period === p.period && d.master_id === masterId,
      )
      const commission = state.commissionMonthly
        .filter((m) => m.period === p.period && m.master_id === masterId)
        .reduce((s, m) => s + m.commission, 0)
      return {
        period,
        referrals: referralsByPeriod.get(period) ?? 0,
        referred_base: referredVolumeByPeriod.get(period) ?? 0,
        patients_served: stats?.patients_served ?? 0,
        commission,
      }
    })
}

export type BucketBreakdownRow = {
  bucket: string
  label: string
  qty: number
  base: number
  rate: number
  commission: number
}

export async function getDoctorBucketBreakdown(
  masterId: string,
  period: string,
): Promise<BucketBreakdownRow[]> {
  const state = db()
  return state.commissionMonthly
    .filter((m) => m.master_id === masterId && m.period === period)
    .map((m) => {
      const bucket = state.buckets.find((b) => b.bucket === m.bucket)
      return {
        bucket: m.bucket,
        label: bucket?.label ?? m.bucket,
        qty: m.qty,
        base: m.base,
        rate: m.rate,
        commission: m.commission,
        sort_order: bucket?.sort_order ?? 1e9,
      }
    })
    .sort((a, b) => a.sort_order - b.sort_order || a.bucket.localeCompare(b.bucket))
    .map(({ sort_order: _sortOrder, ...row }) => row)
}

export type DoctorLine = {
  id: string
  visit_id: string | null
  item_name: string
  bucket: string | null
  base_amount: number
  rate: number | null
  commission: number
  status: LineStatus
  reason: string | null
}

export async function getDoctorLines(masterId: string, period: string): Promise<DoctorLine[]> {
  return db()
    .commissionLines.filter((l) => l.beneficiary_master_id === masterId && l.period === period)
    .sort((a, b) => b.commission - a.commission || Number(a.id) - Number(b.id))
    .map((l) => ({
      id: l.id,
      visit_id: l.visit_id ?? null,
      item_name: l.item_name ?? "—",
      bucket: l.bucket,
      base_amount: l.base_amount,
      rate: l.rate,
      commission: l.commission,
      status: (l.status as LineStatus) ?? "skipped",
      reason: l.reason,
    }))
}
