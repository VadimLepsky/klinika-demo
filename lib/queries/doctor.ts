import "server-only"
import { db } from "@/lib/demo/store"
import { periodKey } from "@/lib/format"
import type { LineStatus } from "@/components/status-chip"

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

  if (!row) {
    // Doctor may exist only in reporting tables without a staff row yet.
    const known = state.commissionMonthly.some((m) => m.master_id === masterId)
    if (!known) return null
    return {
      master_id: masterId,
      full_name: `Neznámý lékař #${masterId}`,
      is_doctor: null,
      note: null,
      dismissed: false,
    }
  }

  const note = row.note ?? null
  return {
    master_id: row.master_id,
    full_name: row.full_name,
    is_doctor: row.is_doctor,
    note,
    // No explicit "fired" column in schema — derive from the note as a soft flag.
    dismissed: !!note && /ukončen|odešl/i.test(note),
  }
}

export type DoctorMonthPoint = {
  period: string
  referrals: number
  commission: number
  patients_served: number
}

export async function getDoctorMonthlySeries(masterId: string): Promise<DoctorMonthPoint[]> {
  const state = db()
  return state.periods
    .slice()
    .sort((a, b) => (a.period < b.period ? -1 : 1))
    .map((p) => {
      const stats = state.doctorMonthlyStats.find(
        (d) => d.period === p.period && d.master_id === masterId,
      )
      const commission = state.commissionMonthly
        .filter((m) => m.period === p.period && m.master_id === masterId)
        .reduce((s, m) => s + m.commission, 0)
      return {
        period: periodKey(p.period),
        referrals: stats?.referrals ?? 0,
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
      item_name: l.item_name ?? "—",
      bucket: l.bucket,
      base_amount: l.base_amount,
      rate: l.rate,
      commission: l.commission,
      status: (l.status as LineStatus) ?? "skipped",
      reason: l.reason,
    }))
}
