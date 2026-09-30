"use server"

import { revalidatePath } from "next/cache"
import { db, newId } from "@/lib/demo/store"
import { writeAudit } from "@/lib/audit"
import { getActorEmail } from "@/lib/session"

type ActionResult = { ok: true } | { ok: false; error: string }

function revalidateBucketPaths() {
  revalidatePath("/settings/buckets")
  revalidatePath("/settings/mapping")
  revalidatePath("/attention")
}

/**
 * Creates a new commission bucket with its first (open-ended) rate.
 * The bucket key is immutable once created.
 */
export async function createBucket(
  label: string,
  key: string,
  beneficiary: "source" | "performer",
  ratePercent: number,
  validFrom: string,
): Promise<ActionResult & { bucket?: { bucket: string; label: string } }> {
  const cleanLabel = label.trim()
  const cleanKey = key.trim().toLowerCase()

  if (cleanLabel.length < 2) return { ok: false, error: "Zadejte název pravidla." }
  if (!/^[a-z][a-z0-9_]{1,39}$/.test(cleanKey)) {
    return { ok: false, error: "Klíč: pouze malá písmena bez diakritiky, číslice a podtržítka, od 2 znaků." }
  }
  if (beneficiary !== "source" && beneficiary !== "performer") {
    return { ok: false, error: "Zvolte příjemce." }
  }
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    return { ok: false, error: "Sazba musí být v rozmezí 0–100 %." }
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(validFrom)) {
    return { ok: false, error: "Neplatné datum." }
  }

  try {
    const state = db()
    if (state.buckets.some((b) => b.bucket === cleanKey)) {
      return { ok: false, error: "Tento klíč se už používá." }
    }

    const nextSort =
      state.buckets.reduce((max, b) => Math.max(max, b.sort_order ?? 0), 0) + 10

    state.buckets.push({
      bucket: cleanKey,
      label: cleanLabel,
      beneficiary,
      sort_order: nextSort,
    })

    const rate = Math.round((ratePercent / 100) * 10000) / 10000
    state.bucketRates.push({
      id: newId(),
      bucket: cleanKey,
      rate,
      valid_from: validFrom,
      valid_to: null,
    })

    await writeAudit({
      action: "bucket.create",
      entity: "commission_buckets",
      entityId: cleanKey,
      oldValue: null,
      newValue: { label: cleanLabel, beneficiary, rate, valid_from: validFrom },
    })

    revalidateBucketPaths()
    return { ok: true, bucket: { bucket: cleanKey, label: cleanLabel } }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Renames a bucket's label. Key and beneficiary are immutable here. */
export async function updateBucketLabel(bucket: string, label: string): Promise<ActionResult> {
  const cleanLabel = label.trim()
  if (cleanLabel.length < 2) return { ok: false, error: "Zadejte název pravidla." }
  try {
    const state = db()
    const row = state.buckets.find((b) => b.bucket === bucket)
    if (!row) return { ok: false, error: "Pravidlo nebylo nalezeno." }

    const old = row.label
    row.label = cleanLabel

    await writeAudit({
      action: "bucket.update",
      entity: "commission_buckets",
      entityId: bucket,
      oldValue: { label: old },
      newValue: { label: cleanLabel },
    })
    revalidateBucketPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Deletes a bucket. Rejects if any rule still references it. */
export async function deleteBucket(bucket: string): Promise<ActionResult> {
  try {
    const state = db()
    const old = state.buckets.find((b) => b.bucket === bucket)
    if (!old) return { ok: false, error: "Pravidlo nebylo nalezeno." }

    const catCount = state.categoryMapping.filter((cm) => cm.bucket === bucket).length
    const monthlyCount = state.commissionMonthly.filter((m) => m.bucket === bucket).length
    const svcCount = state.serviceMapping.filter((sm) => sm.bucket === bucket).length

    if (catCount > 0 || monthlyCount > 0 || svcCount > 0) {
      return { ok: false, error: "Pravidlo se používá a nelze ho smazat." }
    }

    state.bucketRates = state.bucketRates.filter((r) => r.bucket !== bucket)
    state.buckets = state.buckets.filter((b) => b.bucket !== bucket)

    await writeAudit({
      action: "bucket.delete",
      entity: "commission_buckets",
      entityId: bucket,
      oldValue: { label: old.label, beneficiary: old.beneficiary },
      newValue: null,
    })
    revalidateBucketPaths()
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/**
 * Version a bucket rate: close the current open row (valid_to = validFrom),
 * then insert the new rate open-ended. Never overwrites — history is preserved.
 * validFrom is the first day of a month (YYYY-MM-01).
 */
export async function updateRate(
  bucket: string,
  ratePercent: number,
  validFrom: string,
): Promise<ActionResult> {
  if (!Number.isFinite(ratePercent) || ratePercent < 0 || ratePercent > 100) {
    return { ok: false, error: "Sazba musí být v rozmezí 0–100 %." }
  }
  const rate = Math.round((ratePercent / 100) * 10000) / 10000
  try {
    const state = db()
    const open = state.bucketRates.find((r) => r.bucket === bucket && r.valid_to === null)
    const oldRate = open ? open.rate : null
    if (open) open.valid_to = validFrom

    state.bucketRates.push({
      id: newId(),
      bucket,
      rate,
      valid_from: validFrom,
      valid_to: null,
    })

    await writeAudit({
      action: "rate.update",
      entity: "bucket_rates",
      entityId: bucket,
      oldValue: oldRate != null ? { rate: oldRate } : null,
      newValue: { rate, valid_from: validFrom },
    })
    revalidatePath("/settings/buckets")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Add a service exclusion (open-ended). */
export async function addServiceExclusion(
  serviceId: string,
  reason: string,
  validFrom: string,
): Promise<ActionResult> {
  const id = Number(serviceId)
  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Neplatné ID služby." }
  }
  try {
    const state = db()
    state.serviceExclusions.push({
      id: newId(),
      service_id: String(id),
      reason: reason || null,
      valid_from: validFrom,
      valid_to: null,
    })
    await writeAudit({
      action: "service_exclusion.create",
      entity: "service_exclusions",
      entityId: serviceId,
      oldValue: null,
      newValue: { reason, valid_from: validFrom },
    })
    revalidatePath("/settings/mapping")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Close an open service exclusion (valid_to = today). */
export async function endServiceExclusion(id: string): Promise<ActionResult> {
  try {
    const state = db()
    const today = new Date().toISOString().slice(0, 10)
    const row = state.serviceExclusions.find((se) => se.id === id && se.valid_to === null)
    if (row) row.valid_to = today

    await writeAudit({
      action: "service_exclusion.end",
      entity: "service_exclusions",
      entityId: id,
      oldValue: { valid_to: null },
      newValue: { valid_to: today },
    })
    revalidatePath("/settings/mapping")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Update a source's status / doctor link / note from the CRUD table. */
export async function updateSource(
  sourceId: string,
  status: string,
  masterId: string | null,
  note: string | null,
): Promise<ActionResult> {
  const allowed = ["doctor", "non_commission", "unmapped"]
  if (!allowed.includes(status)) return { ok: false, error: "Neplatný stav." }
  const effectiveMaster = status === "doctor" ? masterId : null
  if (status === "doctor" && !effectiveMaster) {
    return { ok: false, error: "Pro stav «Lékař» zvolte lékaře." }
  }
  try {
    const state = db()
    const row = state.sources.find((s) => s.source_id === sourceId)
    const old = row ? { status: row.status, master_id: row.master_id, note: row.note } : null
    if (row) {
      row.status = status as typeof row.status
      row.master_id = effectiveMaster
      row.note = note
    }

    await writeAudit({
      action: "source.update",
      entity: "sources",
      entityId: sourceId,
      oldValue: old,
      newValue: { status, master_id: effectiveMaster, note },
    })
    revalidatePath("/settings/sources")
    revalidatePath("/attention")
    revalidatePath("/periods")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Update a staff member's doctor flag / note from the CRUD table. */
export async function updateStaff(
  masterId: string,
  isDoctor: boolean | null,
  note: string | null,
): Promise<ActionResult> {
  try {
    const state = db()
    const row = state.staff.find((s) => s.master_id === masterId)
    const old = row ? { is_doctor: row.is_doctor, note: row.note } : null
    if (row) {
      row.is_doctor = isDoctor
      row.note = note
    }

    await writeAudit({
      action: "staff.update",
      entity: "staff",
      entityId: masterId,
      oldValue: old,
      newValue: { is_doctor: isDoctor, note },
    })
    revalidatePath("/settings/staff")
    revalidatePath("/attention")
    revalidatePath("/periods")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/**
 * Save a doctor's per-bucket commission overrides, versioned by valid_from.
 *
 * Desired state per rule:
 *  - switch off               -> { enabled: false, rate: null }  (no commission)
 *  - switch on, empty rate     -> use the general rate            (no active row)
 *  - switch on, personal rate  -> { enabled: true, rate }         (personal rate)
 *
 * For every rule whose state actually changes: close the currently active row
 * (valid_to = validFrom), drop any row that already starts at validFrom (same-month
 * correction), then insert the new row unless the new state is the "general rate +
 * enabled" default. Existing rows are never mutated in place — history stays intact.
 * One audit_log entry is written per changed rule.
 */
export async function saveDoctorBucketRates(
  masterId: string,
  validFrom: string,
  rules: { bucket: string; enabled: boolean; ratePct: number | null }[],
): Promise<ActionResult> {
  const actor = await getActorEmail()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(validFrom)) {
    return { ok: false, error: "Neplatné datum." }
  }

  try {
    const state = db()
    const period = state.periods.find((p) => p.period === validFrom)
    if (period?.status === "frozen") {
      return { ok: false, error: "Měsíc je zmrazen — zvolte jiný." }
    }

    const validBuckets = new Set(state.buckets.map((b) => b.bucket))

    type OverrideState = { enabled: boolean; rate: number | null }
    const currentState = (bucket: string): OverrideState => {
      const active = state.doctorBucketRates.find(
        (r) => r.master_id === masterId && r.bucket === bucket && r.valid_to === null,
      )
      return active ? { enabled: active.enabled, rate: active.rate } : { enabled: true, rate: null }
    }

    let changed = 0

    for (const rule of rules) {
      if (!validBuckets.has(rule.bucket)) continue

      let desired: OverrideState
      if (!rule.enabled) {
        desired = { enabled: false, rate: null }
      } else if (rule.ratePct == null) {
        desired = { enabled: true, rate: null }
      } else {
        if (!Number.isFinite(rule.ratePct) || rule.ratePct < 0 || rule.ratePct > 100) {
          return { ok: false, error: "Sazba musí být v rozmezí 0–100 %." }
        }
        desired = { enabled: true, rate: Math.round((rule.ratePct / 100) * 10000) / 10000 }
      }

      const current = currentState(rule.bucket)
      if (current.enabled === desired.enabled && current.rate === desired.rate) continue
      changed++

      for (const r of state.doctorBucketRates) {
        if (
          r.master_id === masterId &&
          r.bucket === rule.bucket &&
          r.valid_to === null &&
          r.valid_from < validFrom
        ) {
          r.valid_to = validFrom
        }
      }
      state.doctorBucketRates = state.doctorBucketRates.filter(
        (r) => !(r.master_id === masterId && r.bucket === rule.bucket && r.valid_from === validFrom),
      )

      const isDefault = desired.enabled && desired.rate == null
      if (!isDefault) {
        state.doctorBucketRates.push({
          master_id: masterId,
          bucket: rule.bucket,
          enabled: desired.enabled,
          rate: desired.rate,
          valid_from: validFrom,
          valid_to: null,
        })
      }

      await writeAudit({
        action: "doctor_rate.update",
        entity: "doctor_bucket_rates",
        entityId: `${masterId}:${rule.bucket}`,
        oldValue: { enabled: current.enabled, rate: current.rate },
        newValue: { enabled: desired.enabled, rate: desired.rate },
      })
    }

    if (changed === 0) return { ok: true }

    revalidatePath("/settings/staff")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}
