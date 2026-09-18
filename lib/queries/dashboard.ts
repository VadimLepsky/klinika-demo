import "server-only"
import { db } from "@/lib/demo/store"
import { getDoctorDisplayNames } from "@/lib/doctor-name"
import { periodKey } from "@/lib/format"
import {
  getReferralsByDoctor,
  getReferralsByDoctorAndMonth,
  getReferralsMonthlyTotals,
  getReferralsTotal,
} from "@/lib/queries/referrals"
import { getReferredVolumeByDoctor, getReferredVolumeTotal } from "@/lib/queries/referred-volume"

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
  totalPatientsServed: number
}

export async function getKpis(period: string): Promise<DashboardKpis> {
  const state = db()
  const monthly = state.commissionMonthly.filter((m) => m.period === period)

  const totalCommission = monthly.reduce((s, m) => s + m.commission, 0)
  const doctorsWithCommission = new Set(
    monthly.filter((m) => m.commission > 0).map((m) => m.master_id),
  ).size
  const totalPatientsServed = state.doctorMonthlyStats
    .filter((d) => d.period === period)
    .reduce((s, d) => s + d.patients_served, 0)

  const [totalReferrals, totalBase] = await Promise.all([
    getReferralsTotal(period),
    getReferredVolumeTotal(period),
  ])

  return { totalCommission, totalBase, doctorsWithCommission, totalPatientsServed, totalReferrals }
}

export type DoctorRow = {
  master_id: string
  full_name: string
  is_doctor: boolean | null
  referrals: number
  base: number
  commission: number
  patients_served: number
  paid: boolean
  paid_by: string | null
  paid_at: string | null
}

export async function getDoctorsForMonth(period: string): Promise<DoctorRow[]> {
  const state = db()
  const rows = new Map<string, DoctorRow>()

  const [referralsByDoctor, referredVolumeByDoctor] = await Promise.all([
    getReferralsByDoctor(period),
    getReferredVolumeByDoctor(period),
  ])

  for (const m of state.commissionMonthly) {
    if (m.period !== period) continue
    const staff = state.staff.find((s) => s.master_id === m.master_id)
    const stats = state.doctorMonthlyStats.find(
      (d) => d.master_id === m.master_id && d.period === period,
    )
    const payout = state.doctorPayouts.find(
      (p) => p.master_id === m.master_id && p.period === period,
    )
    const found = rows.get(m.master_id)
    if (found) {
      found.commission += m.commission
    } else {
      rows.set(m.master_id, {
        master_id: m.master_id,
        full_name: m.master_id,
        is_doctor: staff?.is_doctor ?? null,
        referrals: referralsByDoctor.get(m.master_id) ?? 0,
        base: referredVolumeByDoctor.get(m.master_id) ?? 0,
        patients_served: stats?.patients_served ?? 0,
        commission: m.commission,
        paid: payout != null,
        paid_by: payout?.paid_by ?? null,
        paid_at: payout?.paid_at ?? null,
      })
    }
  }

  const displayNames = await getDoctorDisplayNames([...rows.keys()])
  for (const [masterId, row] of rows) {
    row.full_name = displayNames.get(masterId) ?? `#${masterId}`
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
  const referralsByPeriod = await getReferralsMonthlyTotals()
  return state.periods
    .slice()
    .sort((a, b) => (a.period < b.period ? -1 : 1))
    .map((p) => ({
      period: periodKey(p.period),
      referrals: referralsByPeriod.get(periodKey(p.period)) ?? 0,
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
  const referralsByDoctor = await getReferralsByDoctorAndMonth()

  const map = new Map<string, DoctorReferralSeries>()
  for (const [masterId, byPeriod] of referralsByDoctor) {
    const staff = state.staff.find((s) => s.master_id === masterId)
    const points = [...byPeriod.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, referrals]) => ({ period, referrals }))
    map.set(masterId, {
      master_id: masterId,
      full_name: staff?.full_name ?? `Neznámý lékař #${masterId}`,
      points,
    })
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
