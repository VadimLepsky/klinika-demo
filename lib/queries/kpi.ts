import "server-only"
import { db } from "@/lib/demo/store"
import { formatMonth, nextMonthValue, periodKey } from "@/lib/format"
import { emptyKpiBandsByMetric, type KpiBand, type KpiBandsByMetric, type KpiMetric } from "@/lib/kpi"

export type MonthOption = { value: string; label: string }

/**
 * Valid "Platí od" months for a KPI assignment: every month from the earliest
 * period through next month, excluding frozen months.
 */
export async function getKpiAssignableMonths(): Promise<MonthOption[]> {
  const state = db()
  if (state.periods.length === 0) return []

  const sorted = [...state.periods].sort((a, b) => (a.period < b.period ? -1 : 1))
  const frozenMonths = new Set(sorted.filter((p) => p.status === "frozen").map((p) => periodKey(p.period).slice(0, 7)))
  const [startY, startM] = periodKey(sorted[0].period).slice(0, 7).split("-").map(Number)
  const [endY, endM] = nextMonthValue().split("-").map(Number)

  const months: MonthOption[] = []
  let y = startY
  let m = startM
  while (y < endY || (y === endY && m <= endM)) {
    const value = `${y}-${String(m).padStart(2, "0")}`
    if (!frozenMonths.has(value)) {
      months.push({ value, label: formatMonth(`${value}-01`) })
    }
    m += 1
    if (m > 12) {
      m = 1
      y += 1
    }
  }
  return months
}

export type KpiProfile = {
  id: string
  name: string
  active: boolean
  max_bonus: number
  max_penalty: number
  min_sample: number
}
export type KpiProfileWithCount = KpiProfile & { doctor_count: number; ever_assigned: boolean }

export async function getKpiProfilesWithCounts(): Promise<KpiProfileWithCount[]> {
  const state = db()
  return state.kpiProfiles
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "cs"))
    .map((p) => ({
      id: p.id,
      name: p.name,
      active: p.active,
      max_bonus: p.max_bonus,
      max_penalty: p.max_penalty,
      min_sample: p.min_sample,
      doctor_count: state.doctorKpiProfiles.filter((d) => d.profile_id === p.id && d.valid_to === null).length,
      ever_assigned: state.doctorKpiProfiles.some((d) => d.profile_id === p.id),
    }))
}

/** Active profiles only — the options for the doctor KPI-assignment select. */
export async function getActiveKpiProfiles(): Promise<KpiProfile[]> {
  return db()
    .kpiProfiles.filter((p) => p.active)
    .sort((a, b) => a.name.localeCompare(b.name, "cs"))
    .map((p) => ({
      id: p.id,
      name: p.name,
      active: true,
      max_bonus: p.max_bonus,
      max_penalty: p.max_penalty,
      min_sample: p.min_sample,
    }))
}

/** Every KPI profile's bands, grouped by metric, keyed by profile id, in one query. */
export async function getKpiBandsByProfile(): Promise<Map<string, KpiBandsByMetric>> {
  const map = new Map<string, KpiBandsByMetric>()
  for (const b of db().kpiProfileBands) {
    if (!map.has(b.profile_id)) map.set(b.profile_id, emptyKpiBandsByMetric())
    const band: KpiBand = { min_value: b.min_value, max_value: b.max_value, points: b.points }
    map.get(b.profile_id)![b.metric as KpiMetric].push(band)
  }
  return map
}

/** Current KPI-profile badge for every doctor with an open assignment. A missing master_id means "Bez KPI" (never assigned). */
export type DoctorKpiBadge = { profile_id: string | null; profile_name: string | null }

export async function getDoctorKpiBadges(): Promise<Map<string, DoctorKpiBadge>> {
  const state = db()
  const map = new Map<string, DoctorKpiBadge>()
  for (const d of state.doctorKpiProfiles) {
    if (d.valid_to !== null) continue
    const profile = state.kpiProfiles.find((p) => p.id === d.profile_id)
    map.set(d.master_id, {
      profile_id: d.profile_id,
      profile_name: profile?.name ?? null,
    })
  }
  return map
}

export type DoctorKpiHistoryRow = {
  id: string
  profile_id: string | null
  profile_name: string | null
  valid_from: string
  valid_to: string | null
}

/** Every doctor's full KPI-assignment history, keyed by master_id, in one query (newest first). */
export async function getAllDoctorKpiHistory(): Promise<Map<string, DoctorKpiHistoryRow[]>> {
  const state = db()
  const map = new Map<string, DoctorKpiHistoryRow[]>()
  for (const d of [...state.doctorKpiProfiles].sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1))) {
    const profile = state.kpiProfiles.find((p) => p.id === d.profile_id)
    if (!map.has(d.master_id)) map.set(d.master_id, [])
    map.get(d.master_id)!.push({
      id: d.id,
      profile_id: d.profile_id,
      profile_name: profile?.name ?? null,
      valid_from: periodKey(d.valid_from),
      valid_to: d.valid_to ? periodKey(d.valid_to) : null,
    })
  }
  return map
}

export type DoctorKpiMonthly = {
  profile_id: string | null
  profile_name: string | null
  profile_min_sample: number | null
  showup_pct: number | null
  avg_check: number | null
  activity_pct: number | null
  planned_count: number
  showup_points: number
  avg_check_points: number
  activity_points: number
  k_raw: number
  k_kpi: number
  sample_ok: boolean
  commission_source: number
  commission_performer: number
  final_commission: number
}

/** A doctor's computed KPI result for one month, produced by the external worker. Null if never computed. */
export async function getDoctorKpiMonthly(masterId: string, period: string): Promise<DoctorKpiMonthly | null> {
  const state = db()
  const row = state.doctorKpiMonthly.find((d) => d.master_id === masterId && d.period === period)
  if (!row) return null
  const profile = state.kpiProfiles.find((p) => p.id === row.profile_id)
  return {
    profile_id: row.profile_id,
    profile_name: profile?.name ?? null,
    profile_min_sample: profile?.min_sample ?? null,
    showup_pct: row.showup_pct,
    avg_check: row.avg_check,
    activity_pct: row.activity_pct,
    planned_count: row.planned_count,
    showup_points: row.showup_points,
    avg_check_points: row.avg_check_points,
    activity_points: row.activity_points,
    k_raw: row.k_raw,
    k_kpi: row.k_kpi,
    sample_ok: row.sample_ok,
    commission_source: row.commission_source,
    commission_performer: row.commission_performer,
    final_commission: row.final_commission,
  }
}
