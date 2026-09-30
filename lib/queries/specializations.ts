import "server-only"
import { db } from "@/lib/demo/store"
import type { CoefficientBand } from "@/lib/coefficient"

export type Specialization = { id: string; name: string; active: boolean }
export type SpecializationWithCount = Specialization & { doctor_count: number }
export type DoctorSpecializations = { primary: Specialization | null; additional: Specialization[] }

const ID_PATTERN = /^\d+$/

export function isSpecializationId(value: string | null | undefined): value is string {
  return !!value && ID_PATTERN.test(value)
}

export async function getSpecializationsWithCounts(): Promise<SpecializationWithCount[]> {
  const state = db()
  return state.specializations
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name, "cs"))
    .map((s) => ({
      id: s.id,
      name: s.name,
      active: s.active,
      doctor_count: state.staffSpecializations.filter((ss) => ss.specialization_id === s.id).length,
    }))
}

/** Active specializations only — the options for every select and the "/" filter. */
export async function getActiveSpecializations(): Promise<Specialization[]> {
  return db()
    .specializations.filter((s) => s.active)
    .sort((a, b) => a.name.localeCompare(b.name, "cs"))
    .map((s) => ({ id: s.id, name: s.name, active: true }))
}

/**
 * Assigned specializations keyed by master_id. Includes inactive ones: deactivating
 * a specialization hides it from selects, but existing assignments stay intact.
 */
export async function getStaffSpecializations(
  masterId?: string,
): Promise<Record<string, DoctorSpecializations>> {
  const state = db()
  const result: Record<string, DoctorSpecializations> = {}
  const rows = state.staffSpecializations.filter((ss) => !masterId || ss.master_id === masterId)

  for (const r of rows) {
    const spec = state.specializations.find((s) => s.id === r.specialization_id)
    if (!spec) continue
    const entry = (result[r.master_id] ??= { primary: null, additional: [] })
    if (r.is_primary) entry.primary = spec
    else entry.additional.push(spec)
  }
  for (const key of Object.keys(result)) {
    result[key].additional.sort((a, b) => a.name.localeCompare(b.name, "cs"))
  }
  return result
}

/** Doctors that have the specialization as primary OR additional. */
export async function getDoctorIdsForSpecialization(specId: string): Promise<string[]> {
  if (!isSpecializationId(specId)) return []
  return [
    ...new Set(
      db()
        .staffSpecializations.filter((ss) => ss.specialization_id === specId)
        .map((ss) => ss.master_id),
    ),
  ]
}

/** Every specialization's custom coefficient bands, keyed by specialization id, in one query. */
export async function getBandsBySpecialization(): Promise<Map<string, CoefficientBand[]>> {
  const map = new Map<string, CoefficientBand[]>()
  for (const b of db().specializationBands) {
    if (!map.has(b.specialization_id)) map.set(b.specialization_id, [])
    map.get(b.specialization_id)!.push({ min_pct: b.min_pct, color: b.color })
  }
  return map
}

/**
 * A doctor's own coefficient bands, resolved from their PRIMARY specialization,
 * keyed by master_id. Doctors without a primary specialization or whose specialization
 * has no custom bands are simply absent from the map — call sites fall back to the
 * shared defaults via `resolveCoefficientBand`.
 */
export async function getPrimarySpecializationBandsForDoctors(
  masterIds: string[],
): Promise<Map<string, CoefficientBand[]>> {
  const state = db()
  const bandsBySpec = await getBandsBySpecialization()
  const map = new Map<string, CoefficientBand[]>()
  for (const masterId of new Set(masterIds)) {
    const primary = state.staffSpecializations.find((ss) => ss.master_id === masterId && ss.is_primary)
    if (!primary) continue
    const bands = bandsBySpec.get(primary.specialization_id)
    if (bands && bands.length > 0) map.set(masterId, bands)
  }
  return map
}
