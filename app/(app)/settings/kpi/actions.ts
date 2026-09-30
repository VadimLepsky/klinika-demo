"use server"

import { revalidatePath } from "next/cache"
import { db, newId } from "@/lib/demo/store"
import { writeAudit } from "@/lib/audit"
import { getActorEmail } from "@/lib/session"
import { formatMonth, periodKey } from "@/lib/format"
import { KPI_METRICS, type KpiBandInputsByMetric, type KpiMetric } from "@/lib/kpi"

type ActionResult = { ok: true } | { ok: false; error: string }

const MAX_NAME_LENGTH = 100
const IN_USE_ERROR = "Profil byl někdy přiřazen lékaři. Deaktivujte ho místo smazání."

function revalidateKpiPaths() {
  revalidatePath("/settings/kpi")
  revalidatePath("/settings/staff")
  revalidatePath("/")
  revalidatePath("/doctors/[master_id]")
}

function normalizeName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ")
  if (!name || name.length > MAX_NAME_LENGTH) return null
  return name
}

function validateLimits(maxBonus: number, maxPenalty: number, minSample: number): string | null {
  if (!Number.isFinite(maxBonus) || maxBonus < 0 || maxBonus > 1.5) return "Max. bonus musí být od 0 do 150 %."
  if (!Number.isFinite(maxPenalty) || maxPenalty < 0 || maxPenalty > 1) return "Max. postih musí být od 0 do 100 %."
  if (!Number.isInteger(minSample) || minSample < 0) return "Minimální počet doporučení musí být celé číslo ≥ 0."
  return null
}

/** A row with an empty `minValue` is dropped before this runs — see the dialog's submit handler. */
function validateBandRows(rows: { minValue: number; maxValue: number | null; points: number }[]): string | null {
  if (rows.length === 0) return null
  const sorted = [...rows].sort((a, b) => a.minValue - b.minValue)
  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i]
    if (!Number.isFinite(b.minValue)) return "Práh „od“ musí být číslo."
    if (!Number.isFinite(b.points)) return "Body musí být číslo."
    if (b.maxValue != null && (!Number.isFinite(b.maxValue) || b.maxValue <= b.minValue)) {
      return "„do“ musí být větší než „od“."
    }
    const next = sorted[i + 1]
    if (next) {
      if (b.maxValue == null) return "Horní mez je nutná pro všechny řádky kromě posledního."
      if (next.minValue < b.maxValue) return "Prahy se nesmí překrývat."
    }
  }
  return null
}

export async function createKpiProfile(
  rawName: string,
  maxBonus: number,
  maxPenalty: number,
  minSample: number,
  bands: KpiBandInputsByMetric,
): Promise<ActionResult> {
  const actor = await getActorEmail()
  const name = normalizeName(rawName)
  if (!name) return { ok: false, error: `Zadejte název (do ${MAX_NAME_LENGTH} znaků).` }
  const limitsError = validateLimits(maxBonus, maxPenalty, minSample)
  if (limitsError) return { ok: false, error: limitsError }
  for (const metric of KPI_METRICS) {
    const err = validateBandRows(bands[metric])
    if (err) return { ok: false, error: err }
  }

  try {
    const state = db()
    if (state.kpiProfiles.some((p) => p.name === name)) {
      return { ok: false, error: "Profil s tímto názvem už existuje." }
    }
    const id = newId()
    state.kpiProfiles.push({ id, name, active: true, max_bonus: maxBonus, max_penalty: maxPenalty, min_sample: minSample })
    for (const metric of KPI_METRICS) {
      for (const b of bands[metric]) {
        state.kpiProfileBands.push({ profile_id: id, metric, min_value: b.minValue, max_value: b.maxValue, points: b.points })
      }
    }

    await writeAudit({
      action: "kpi_profile.create",
      entity: "kpi_profiles",
      entityId: id,
      oldValue: null,
      newValue: { name, maxBonus, maxPenalty, minSample, bands },
    })
    revalidateKpiPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

export async function updateKpiProfile(
  id: string,
  rawName: string,
  maxBonus: number,
  maxPenalty: number,
  minSample: number,
  bands: KpiBandInputsByMetric,
): Promise<ActionResult> {
  const actor = await getActorEmail()
  const name = normalizeName(rawName)
  if (!name) return { ok: false, error: `Zadejte název (do ${MAX_NAME_LENGTH} znaků).` }
  const limitsError = validateLimits(maxBonus, maxPenalty, minSample)
  if (limitsError) return { ok: false, error: limitsError }
  for (const metric of KPI_METRICS) {
    const err = validateBandRows(bands[metric])
    if (err) return { ok: false, error: err }
  }

  try {
    const state = db()
    const current = state.kpiProfiles.find((p) => p.id === id)
    if (!current) return { ok: false, error: "Profil nebyl nalezen." }

    const oldBands: Record<KpiMetric, { min_value: number; max_value: number | null; points: number }[]> = {
      showup: [],
      avg_check: [],
      activity: [],
    }
    for (const b of state.kpiProfileBands.filter((b) => b.profile_id === id)) {
      oldBands[b.metric].push({ min_value: b.min_value, max_value: b.max_value, points: b.points })
    }

    const fieldsChanged =
      current.name !== name ||
      current.max_bonus !== maxBonus ||
      current.max_penalty !== maxPenalty ||
      current.min_sample !== minSample
    const bandsChanged = JSON.stringify(oldBands) !== JSON.stringify(bands)
    if (!fieldsChanged && !bandsChanged) return { ok: true }

    if (fieldsChanged) {
      current.name = name
      current.max_bonus = maxBonus
      current.max_penalty = maxPenalty
      current.min_sample = minSample
    }
    if (bandsChanged) {
      state.kpiProfileBands = state.kpiProfileBands.filter((b) => b.profile_id !== id)
      for (const metric of KPI_METRICS) {
        for (const b of bands[metric]) {
          state.kpiProfileBands.push({ profile_id: id, metric, min_value: b.minValue, max_value: b.maxValue, points: b.points })
        }
      }
    }

    await writeAudit({
      action: "kpi_profile.update",
      entity: "kpi_profiles",
      entityId: id,
      oldValue: { ...current, bands: oldBands },
      newValue: { name, maxBonus, maxPenalty, minSample, bands },
    })
    revalidateKpiPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

export async function setKpiProfileActive(id: string, active: boolean): Promise<ActionResult> {
  const actor = await getActorEmail()
  try {
    const state = db()
    const current = state.kpiProfiles.find((p) => p.id === id)
    if (!current) return { ok: false, error: "Profil nebyl nalezen." }
    if (current.active === active) return { ok: true }

    const oldActive = current.active
    current.active = active

    await writeAudit({
      action: active ? "kpi_profile.activate" : "kpi_profile.deactivate",
      entity: "kpi_profiles",
      entityId: id,
      oldValue: { name: current.name, active: oldActive },
      newValue: { name: current.name, active },
    })
    revalidateKpiPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

export async function deleteKpiProfile(id: string): Promise<ActionResult> {
  const actor = await getActorEmail()
  try {
    const state = db()
    const current = state.kpiProfiles.find((p) => p.id === id)
    if (!current) return { ok: false, error: "Profil nebyl nalezen." }
    const assignedCount = state.doctorKpiProfiles.filter((d) => d.profile_id === id).length
    if (assignedCount > 0) return { ok: false, error: IN_USE_ERROR }

    const bands = state.kpiProfileBands.filter((b) => b.profile_id === id)
    state.kpiProfiles = state.kpiProfiles.filter((p) => p.id !== id)
    state.kpiProfileBands = state.kpiProfileBands.filter((b) => b.profile_id !== id)

    await writeAudit({
      action: "kpi_profile.delete",
      entity: "kpi_profiles",
      entityId: id,
      oldValue: { ...current, bands },
      newValue: null,
    })
    revalidateKpiPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/**
 * Assigns (or clears, when `profileId` is null) a doctor's KPI profile starting from `validFrom`
 * ("YYYY-MM-DD", always the first of a month):
 *  - a row already starts exactly on `validFrom` (open or historical) -> update its profile_id only;
 *  - otherwise, the doctor's open row (valid_to IS NULL) starts before `validFrom` (or there is no
 *    open row yet) -> close the open row at `validFrom` and insert the new open row;
 *  - otherwise `validFrom` is earlier than the current open row -> reject with an inline error.
 */
export async function assignDoctorKpiProfile(
  masterId: string,
  profileId: string | null,
  validFrom: string,
): Promise<ActionResult> {
  const actor = await getActorEmail()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validFrom)) return { ok: false, error: "Neplatné datum." }

  try {
    const state = db()
    if (profileId) {
      const profile = state.kpiProfiles.find((p) => p.id === profileId)
      if (profile?.active !== true) return { ok: false, error: "Profil je neaktivní nebo neexistuje. Obnovte stránku." }
    }
    const staff = state.staff.find((s) => s.master_id === masterId)
    if (staff?.is_doctor !== true) return { ok: false, error: "KPI lze přiřadit jen lékaři." }

    const exactRow = state.doctorKpiProfiles.find((d) => d.master_id === masterId && d.valid_from === validFrom)

    let oldValue: { profile_id: string | null; valid_from: string | null }

    if (exactRow) {
      oldValue = { profile_id: exactRow.profile_id, valid_from: validFrom }
      exactRow.profile_id = profileId
    } else {
      const openRow = state.doctorKpiProfiles.find((d) => d.master_id === masterId && d.valid_to === null)

      if (openRow) {
        const openFrom = periodKey(openRow.valid_from)
        if (openFrom > validFrom) {
          return { ok: false, error: `Datum musí být nejdříve od stávajícího přiřazení (od ${formatMonth(openFrom)}).` }
        }
        oldValue = { profile_id: openRow.profile_id, valid_from: openFrom }
        openRow.valid_to = validFrom
      } else {
        oldValue = { profile_id: null, valid_from: null }
      }
      state.doctorKpiProfiles.push({
        id: newId(),
        master_id: masterId,
        profile_id: profileId,
        valid_from: validFrom,
        valid_to: null,
      })
    }

    await writeAudit({
      action: "doctor.kpi_profile",
      entity: "doctor_kpi_profiles",
      entityId: masterId,
      oldValue,
      newValue: { profile_id: profileId, valid_from: validFrom },
    })
    revalidateKpiPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/**
 * Deletes a doctor's most recent KPI assignment (must be the open row, valid_to IS NULL, and
 * not in a frozen month) and re-opens the previous row (valid_to = NULL), if any existed.
 */
export async function deleteDoctorKpiAssignment(masterId: string, assignmentId: string): Promise<ActionResult> {
  const actor = await getActorEmail()
  try {
    const state = db()
    const rows = state.doctorKpiProfiles
      .filter((d) => d.master_id === masterId)
      .sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1))
    const target = rows[0]
    if (!target || target.id !== assignmentId || target.valid_to !== null) {
      return { ok: false, error: "Lze smazat jen poslední záznam historie." }
    }
    const validFrom = periodKey(target.valid_from)
    const period = state.periods.find((p) => p.period === validFrom)
    if (period?.status === "frozen") {
      return { ok: false, error: "Zmrazený měsíc nelze mazat." }
    }

    const previous = rows[1] ?? null
    state.doctorKpiProfiles = state.doctorKpiProfiles.filter((d) => d.id !== target.id)
    if (previous) previous.valid_to = null

    await writeAudit({
      action: "doctor.kpi_profile.delete",
      entity: "doctor_kpi_profiles",
      entityId: masterId,
      oldValue: { profile_id: target.profile_id, valid_from: validFrom },
      newValue: previous ? { profile_id: previous.profile_id, valid_from: periodKey(previous.valid_from) } : null,
    })
    revalidateKpiPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}
