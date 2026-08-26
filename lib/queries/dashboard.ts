import "server-only"
import { db } from "@/lib/demo/store"
import { periodKey } from "@/lib/format"

export type Period = {
  period: string
  status: "draft" | "frozen"
  frozen_at: string | null
  frozen_by: string | null
  total_commission: string | null
}

export async function getPeriods(): Promise<Period[]> {
  return db()
    .periods.slice()
    .sort((a, b) => (a.period < b.period ? 1 : -1))
    .map((r) => ({
      period: periodKey(r.period),
      status: r.status ?? "draft",
      frozen_at: r.frozen_at ? String(r.frozen_at) : null,
      frozen_by: r.frozen_by ?? null,
      total_commission: r.total_commission != null ? String(r.total_commission) : null,
    }))
}

export type DashboardKpis = {
  totalCommission: number
  totalReferrals: number
  totalBase: number
  doctorsWithCommission: number
}

export async function getKpis(period: string): Promise<DashboardKpis> {
  const state = db()
  const monthly = state.commissionMonthly.filter((m) => m.period === period)

  const totalCommission = monthly.reduce((s, m) => s + m.commission, 0)
  const totalBase = monthly.reduce((s, m) => s + m.base, 0)
  const doctorsWithCommission = new Set(
    monthly.filter((m) => m.commission > 0).map((m) => m.master_id),
  ).size
  const totalReferrals = state.doctorMonthlyStats
    .filter((d) => d.period === period)
    .reduce((s, d) => s + d.referrals, 0)

  return { totalCommission, totalBase, doctorsWithCommission, totalReferrals }
}

export type DoctorRow = {
  master_id: string
  full_name: string
  is_doctor: boolean | null
  referrals: number
  base: number
  commission: number
  patients_served: number
}

export async function getDoctorsForMonth(period: string): Promise<DoctorRow[]> {
  const state = db()
  const rows = new Map<string, DoctorRow>()

  for (const m of state.commissionMonthly) {
    if (m.period !== period) continue
    const staff = state.staff.find((s) => s.master_id === m.master_id)
    const stats = state.doctorMonthlyStats.find(
      (d) => d.master_id === m.master_id && d.period === period,
    )
    const found = rows.get(m.master_id)
    if (found) {
      found.base += m.base
      found.commission += m.commission
    } else {
      rows.set(m.master_id, {
        master_id: m.master_id,
        full_name: staff?.full_name ?? `Neznámý lékař #${m.master_id}`,
        is_doctor: staff?.is_doctor ?? null,
        referrals: stats?.referrals ?? 0,
        patients_served: stats?.patients_served ?? 0,
        base: m.base,
        commission: m.commission,
      })
    }
  }

  return [...rows.values()].sort((a, b) => b.commission - a.commission)
}

export type MonthlySeriesPoint = {
  period: string
  referrals: number
  commission: number
}

export async function getMonthlySeries(): Promise<MonthlySeriesPoint[]> {
  const state = db()
  return state.periods
    .slice()
    .sort((a, b) => (a.period < b.period ? -1 : 1))
    .map((p) => ({
      period: periodKey(p.period),
      referrals: state.doctorMonthlyStats
        .filter((d) => d.period === p.period)
        .reduce((s, d) => s + d.referrals, 0),
      commission: state.commissionMonthly
        .filter((m) => m.period === p.period)
        .reduce((s, m) => s + m.commission, 0),
    }))
}

export type DoctorReferralSeries = {
  master_id: string
  full_name: string
  points: { period: string; referrals: number }[]
}

/** Per-doctor referrals across all months, for the overlay multiselect. */
export async function getDoctorReferralSeries(): Promise<DoctorReferralSeries[]> {
  const state = db()
  const map = new Map<string, DoctorReferralSeries>()

  for (const d of [...state.doctorMonthlyStats].sort((a, b) =>
    a.master_id === b.master_id ? (a.period < b.period ? -1 : 1) : a.master_id < b.master_id ? -1 : 1,
  )) {
    const staff = state.staff.find((s) => s.master_id === d.master_id)
    if (!map.has(d.master_id)) {
      map.set(d.master_id, {
        master_id: d.master_id,
        full_name: staff?.full_name ?? `Neznámý lékař #${d.master_id}`,
        points: [],
      })
    }
    map.get(d.master_id)!.points.push({ period: periodKey(d.period), referrals: d.referrals })
  }

  // sort by total referrals desc so the most active doctors are first in the picker
  return [...map.values()].sort(
    (a, b) =>
      b.points.reduce((s, p) => s + p.referrals, 0) - a.points.reduce((s, p) => s + p.referrals, 0),
  )
}

/**
 * Count of items needing attention that are relevant to a given period.
 *
 * Mirrors the exclusions applied on the /attention page (lib/queries/attention.ts):
 * unmatched lines already resolved in services_catalog, or explicitly dismissed via
 * "ignore", don't count as needing attention anymore.
 */
export async function getAttentionCount(period: string): Promise<number> {
  const state = db()

  const lines = state.commissionLines.filter(
    (l) =>
      l.period === period &&
      (l.status === "pending_review" || l.status === "unmatched") &&
      (l.item_id === null ||
        (!state.servicesCatalog.some((sc) => sc.service_id === l.item_id) &&
          !state.unmatchedIgnored.some((ui) => ui.item_id === l.item_id))),
  ).length

  const unmappedSources = state.sources.filter((s) => s.status === "unmapped").length
  const unflaggedStaff = state.staff.filter((s) => s.is_doctor === null).length

  return lines + unmappedSources + unflaggedStaff
}
