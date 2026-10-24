import "server-only"
import { db } from "@/lib/demo/store"
import { getDoctorDisplayNames } from "@/lib/doctor-name"
import { periodKey } from "@/lib/format"
import { getI18n } from "@/lib/i18n/server"
import { getReferredVolumeByDoctor, getReferredVolumeRows, getReferredVolumeTotal } from "@/lib/queries/referred-volume"

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
  /** Unique patients referred (sum over doctors) — main "Pacientů doporučeno" metric. */
  totalReferredPatients: number
  totalBase: number
  doctorsWithCommission: number
  totalPatientsServed: number
  totalSelfRecords: number
  totalVisitsPerformed: number
}

/**
 * masterIds (all dashboard queries): null = every doctor; an array restricts
 * commission_monthly / doctor_monthly_stats to those doctors (specialization filter).
 */
export async function getKpis(period: string, masterIds: string[] | null = null): Promise<DashboardKpis> {
  const state = db()
  const masterIdSet = masterIds ? new Set(masterIds) : null

  const monthly = state.commissionMonthly.filter(
    (m) => m.period === period && (!masterIdSet || masterIdSet.has(m.master_id)),
  )
  const totalCommission = monthly.reduce((s, m) => s + m.commission, 0)
  const doctorsWithCommission = new Set(monthly.filter((m) => m.commission > 0).map((m) => m.master_id)).size

  const stats = state.doctorMonthlyStats.filter(
    (d) => d.period === period && (!masterIdSet || masterIdSet.has(d.master_id)),
  )
  const isDoctorSet = new Set(state.staff.filter((s) => s.is_doctor === true).map((s) => s.master_id))

  const totalPatientsServed = stats
    .filter((d) => isDoctorSet.has(d.master_id))
    .reduce((s, d) => s + d.patients_served, 0)
  const totalReferrals = stats.reduce((s, d) => s + d.referrals, 0)
  const totalReferredPatients = stats.reduce((s, d) => s + d.referred_patients, 0)
  const totalSelfRecords = stats.filter((d) => isDoctorSet.has(d.master_id)).reduce((s, d) => s + d.self_records, 0)
  const totalVisitsPerformed = stats
    .filter((d) => isDoctorSet.has(d.master_id))
    .reduce((s, d) => s + d.visits_performed, 0)

  const totalBase = await getReferredVolumeTotal(period, masterIds)

  return {
    totalCommission,
    totalBase,
    doctorsWithCommission,
    totalPatientsServed,
    totalReferrals,
    totalReferredPatients,
    totalSelfRecords,
    totalVisitsPerformed,
  }
}

export type DoctorRow = {
  master_id: string
  full_name: string
  is_doctor: boolean | null
  referrals: number
  referred_patients: number
  base: number
  commission: number
  patients_served: number
  paid: boolean
  paid_by: string | null
  paid_at: string | null
  k_kpi: number | null
  final_commission: number | null
}

export async function getDoctorsForMonth(period: string, masterIds: string[] | null = null): Promise<DoctorRow[]> {
  const state = db()
  const masterIdSet = masterIds ? new Set(masterIds) : null
  const rows = new Map<string, DoctorRow>()

  const referredVolumeByDoctor = await getReferredVolumeByDoctor(period, masterIds)

  const doctorIds = state.staff.filter((s) => s.is_doctor === true).map((s) => s.master_id)
  for (const masterId of doctorIds) {
    if (masterIdSet && !masterIdSet.has(masterId)) continue
    const commission = state.commissionMonthly
      .filter((m) => m.period === period && m.master_id === masterId)
      .reduce((s, m) => s + m.commission, 0)
    const stats = state.doctorMonthlyStats.find((d) => d.master_id === masterId && d.period === period)
    if (!stats && commission === 0) continue

    const staff = state.staff.find((s) => s.master_id === masterId)
    const payout = state.doctorPayouts.find((p) => p.master_id === masterId && p.period === period)
    const kpi = state.doctorKpiMonthly.find((k) => k.master_id === masterId && k.period === period)

    rows.set(masterId, {
      master_id: masterId,
      full_name: masterId,
      is_doctor: staff?.is_doctor ?? null,
      referrals: stats?.referrals ?? 0,
      referred_patients: stats?.referred_patients ?? 0,
      base: referredVolumeByDoctor.get(masterId) ?? 0,
      patients_served: stats?.patients_served ?? 0,
      commission,
      paid: payout != null,
      paid_by: payout?.paid_by ?? null,
      paid_at: payout?.paid_at ?? null,
      k_kpi: kpi?.k_kpi ?? null,
      final_commission: kpi?.final_commission ?? null,
    })
  }

  const displayNames = await getDoctorDisplayNames([...rows.keys()])
  for (const [masterId, row] of rows) {
    row.full_name = displayNames.get(masterId) ?? `#${masterId}`
  }

  return [...rows.values()].sort((a, b) => b.commission - a.commission || b.referrals - a.referrals)
}

export type MonthlySeriesPoint = {
  period: string
  /** Unique patients referred (sum over doctors). */
  referrals: number
  commission: number
  referred_base: number
}

export async function getMonthlySeries(masterIds: string[] | null = null): Promise<MonthlySeriesPoint[]> {
  const state = db()
  const masterIdSet = masterIds ? new Set(masterIds) : null

  const volumeRows = await getReferredVolumeRows(undefined, undefined, masterIds)
  const volumeByPeriod = new Map<string, number>()
  for (const v of volumeRows) volumeByPeriod.set(v.period, (volumeByPeriod.get(v.period) ?? 0) + v.referred_base)

  return state.periods
    .slice()
    .sort((a, b) => (a.period < b.period ? -1 : 1))
    .map((p) => {
      const period = periodKey(p.period)
      const commission = state.commissionMonthly
        .filter((m) => m.period === p.period && (!masterIdSet || masterIdSet.has(m.master_id)))
        .reduce((s, m) => s + m.commission, 0)
      const referrals = state.doctorMonthlyStats
        .filter((d) => d.period === p.period && (!masterIdSet || masterIdSet.has(d.master_id)))
        .reduce((s, d) => s + d.referred_patients, 0)
      return { period, referrals, commission, referred_base: volumeByPeriod.get(period) ?? 0 }
    })
}

export type DoctorWithoutCommission = {
  master_id: string
  full_name: string
  patients_served: number
  referrals: number
}

/**
 * "Lékaři bez provize": doctors (is_doctor = true, not marked "ukončen…" in the note)
 * with no positive commission in the month. Same specialization filter as the other queries.
 */
export async function getDoctorsWithoutCommission(
  period: string,
  masterIds: string[] | null = null,
): Promise<DoctorWithoutCommission[]> {
  const state = db()
  const masterIdSet = masterIds ? new Set(masterIds) : null

  const rows = state.staff.filter((s) => {
    if (s.is_doctor !== true) return false
    if (s.note && /ukončen|odešl/i.test(s.note)) return false
    if (masterIdSet && !masterIdSet.has(s.master_id)) return false
    const hasCommission = state.commissionMonthly.some(
      (m) => m.master_id === s.master_id && m.period === period && m.commission > 0,
    )
    return !hasCommission
  })

  const names = await getDoctorDisplayNames(rows.map((r) => r.master_id))
  return rows
    .map((r) => {
      const stats = state.doctorMonthlyStats.find((d) => d.master_id === r.master_id && d.period === period)
      return {
        master_id: r.master_id,
        full_name: names.get(r.master_id) ?? `#${r.master_id}`,
        patients_served: stats?.patients_served ?? 0,
        referrals: stats?.referred_patients ?? 0,
      }
    })
    .sort((a, b) => b.patients_served - a.patients_served)
}

export type DoctorReferralSeries = {
  master_id: string
  full_name: string
  points: { period: string; referrals: number }[]
}

/** Per-doctor referrals across all months, for the overlay multiselect. */
export async function getDoctorReferralSeries(): Promise<DoctorReferralSeries[]> {
  const state = db()
  const { t } = await getI18n()

  const referralsByDoctor = new Map<string, Map<string, number>>()
  for (const d of state.doctorMonthlyStats) {
    if (d.referred_patients <= 0) continue
    if (!referralsByDoctor.has(d.master_id)) referralsByDoctor.set(d.master_id, new Map())
    referralsByDoctor.get(d.master_id)!.set(periodKey(d.period), d.referred_patients)
  }

  const map = new Map<string, DoctorReferralSeries>()
  for (const [masterId, byPeriod] of referralsByDoctor) {
    const staff = state.staff.find((s) => s.master_id === masterId)
    const points = [...byPeriod.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([period, referrals]) => ({ period, referrals }))
    map.set(masterId, {
      master_id: masterId,
      full_name: staff?.full_name ?? t("Neznámý lékař #{id}", { id: masterId }),
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
