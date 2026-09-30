"use server"

import { revalidatePath } from "next/cache"
import { db, newId } from "@/lib/demo/store"
import { writeAudit } from "@/lib/audit"
import { getActorEmail } from "@/lib/session"
import { BAND_COLORS, type CoefficientBand } from "@/lib/coefficient"

type ActionResult = { ok: true } | { ok: false; error: string }

const MAX_NAME_LENGTH = 100
const ASSIGNED_ERROR = "Nejprve specializaci odeberte lékařům nebo ji deaktivujte."

function revalidateSpecializationPaths() {
  revalidatePath("/settings/specializations")
  revalidatePath("/settings/staff")
  revalidatePath("/")
  revalidatePath("/doctors/[master_id]")
}

function normalizeName(raw: string): string | null {
  const name = raw.trim().replace(/\s+/g, " ")
  if (!name || name.length > MAX_NAME_LENGTH) return null
  return name
}

/**
 * Validates a proposed set of custom coefficient bands. An empty array is valid
 * (the specialization falls back to the shared default bands). A non-empty set
 * must start at 0%, have no duplicate thresholds, and every row must have a
 * known color.
 */
function validateBands(bands: CoefficientBand[]): string | null {
  if (bands.length === 0) return null
  const sorted = [...bands].sort((a, b) => a.min_pct - b.min_pct)
  if (sorted[0].min_pct !== 0) return "První práh musí začínat na 0 %."
  const seen = new Set<number>()
  for (const band of sorted) {
    if (!Number.isFinite(band.min_pct) || band.min_pct < 0 || band.min_pct > 100) {
      return "Práh musí být číslo od 0 do 100."
    }
    if (seen.has(band.min_pct)) return "Prahy musí být jedinečné."
    seen.add(band.min_pct)
    if (!BAND_COLORS.includes(band.color)) return "Neplatná barva prahu."
  }
  return null
}

export async function createSpecialization(rawName: string): Promise<ActionResult> {
  const actor = await getActorEmail()
  const name = normalizeName(rawName)
  if (!name) return { ok: false, error: `Zadejte název (do ${MAX_NAME_LENGTH} znaků).` }
  try {
    const state = db()
    if (state.specializations.some((s) => s.name === name)) {
      return { ok: false, error: "Specializace s tímto názvem už existuje." }
    }
    const id = newId()
    state.specializations.push({ id, name, active: true })

    await writeAudit({
      action: "specialization.create",
      entity: "specializations",
      entityId: id,
      oldValue: null,
      newValue: { name },
    })
    revalidateSpecializationPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/**
 * Replaces a specialization's name and custom coefficient bands. Passing an
 * empty `bands` array clears any custom bands, reverting the specialization
 * to the shared default bands used everywhere `resolveCoefficientBand` falls back.
 */
export async function updateSpecialization(
  id: string,
  rawName: string,
  bands: CoefficientBand[],
): Promise<ActionResult> {
  const actor = await getActorEmail()
  const name = normalizeName(rawName)
  if (!name) return { ok: false, error: `Zadejte název (do ${MAX_NAME_LENGTH} znaků).` }
  const bandsError = validateBands(bands)
  if (bandsError) return { ok: false, error: bandsError }

  try {
    const state = db()
    const current = state.specializations.find((s) => s.id === id)
    if (!current) return { ok: false, error: "Specializace nebyla nalezena." }

    const oldBands = state.specializationBands
      .filter((b) => b.specialization_id === id)
      .map((b) => ({ min_pct: b.min_pct, color: b.color }))
    const sortedNew = [...bands].sort((a, b) => a.min_pct - b.min_pct)
    const nameChanged = current.name !== name
    const bandsChanged = JSON.stringify(oldBands) !== JSON.stringify(sortedNew)
    if (!nameChanged && !bandsChanged) return { ok: true }

    if (nameChanged) current.name = name
    if (bandsChanged) {
      state.specializationBands = state.specializationBands.filter((b) => b.specialization_id !== id)
      for (const band of sortedNew) {
        state.specializationBands.push({ specialization_id: id, min_pct: band.min_pct, color: band.color })
      }
    }

    await writeAudit({
      action: "specialization.update",
      entity: "specializations",
      entityId: id,
      oldValue: { name: current.name, bands: oldBands },
      newValue: { name, bands: sortedNew },
    })
    revalidateSpecializationPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

export async function setSpecializationActive(id: string, active: boolean): Promise<ActionResult> {
  const actor = await getActorEmail()
  try {
    const state = db()
    const current = state.specializations.find((s) => s.id === id)
    if (!current) return { ok: false, error: "Specializace nebyla nalezena." }
    if (current.active === active) return { ok: true }

    const oldActive = current.active
    current.active = active

    await writeAudit({
      action: active ? "specialization.activate" : "specialization.deactivate",
      entity: "specializations",
      entityId: id,
      oldValue: { name: current.name, active: oldActive },
      newValue: { name: current.name, active },
    })
    revalidateSpecializationPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

export async function deleteSpecialization(id: string): Promise<ActionResult> {
  const actor = await getActorEmail()
  try {
    const state = db()
    const current = state.specializations.find((s) => s.id === id)
    if (!current) return { ok: false, error: "Specializace nebyla nalezena." }
    const assignedCount = state.staffSpecializations.filter((ss) => ss.specialization_id === id).length
    if (assignedCount > 0) return { ok: false, error: ASSIGNED_ERROR }

    state.specializations = state.specializations.filter((s) => s.id !== id)
    state.specializationBands = state.specializationBands.filter((b) => b.specialization_id !== id)

    await writeAudit({
      action: "specialization.delete",
      entity: "specializations",
      entityId: id,
      oldValue: current,
      newValue: null,
    })
    revalidateSpecializationPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/**
 * Replaces a doctor's active specialization assignments. Assignments to inactive
 * specializations are not editable here and are kept; an inactive primary is
 * demoted to additional when a new primary is chosen.
 */
export async function saveDoctorSpecializations(
  masterId: string,
  primaryId: string | null,
  additionalIds: string[],
): Promise<ActionResult> {
  const actor = await getActorEmail()

  const additional = [...new Set(additionalIds)].filter((id) => id !== primaryId)
  const requested = primaryId ? [primaryId, ...additional] : additional

  try {
    const state = db()
    const staff = state.staff.find((s) => s.master_id === masterId)
    if (staff?.is_doctor !== true) {
      return { ok: false, error: "Specializaci lze přiřadit jen lékaři." }
    }
    const activeIds = new Set(state.specializations.filter((s) => s.active).map((s) => s.id))
    if (!requested.every((id) => activeIds.has(id))) {
      return { ok: false, error: "Některá specializace je neaktivní nebo neexistuje. Obnovte stránku." }
    }

    const oldRows = state.staffSpecializations.filter((ss) => ss.master_id === masterId)
    const oldValue = {
      primary: oldRows.find((r) => r.is_primary)?.specialization_id ?? null,
      additional: oldRows.filter((r) => !r.is_primary).map((r) => r.specialization_id),
    }

    // Drop the doctor's assignments to ACTIVE specializations only — inactive ones stay untouched.
    state.staffSpecializations = state.staffSpecializations.filter(
      (ss) => ss.master_id !== masterId || !activeIds.has(ss.specialization_id),
    )
    if (primaryId) {
      state.staffSpecializations.push({ master_id: masterId, specialization_id: primaryId, is_primary: true })
    }
    for (const id of additional) {
      state.staffSpecializations.push({ master_id: masterId, specialization_id: id, is_primary: false })
    }

    await writeAudit({
      action: "staff.specializations",
      entity: "staff_specializations",
      entityId: masterId,
      oldValue,
      newValue: { primary: primaryId, additional },
    })
    revalidateSpecializationPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}
