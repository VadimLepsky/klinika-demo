"use server"

import { revalidatePath } from "next/cache"
import { db, newId } from "@/lib/demo/store"
import { writeAudit } from "@/lib/audit"
import { getActorEmail } from "@/lib/session"
import { monthInputToDate, nextMonthValue } from "@/lib/format"

type ActionResult = { ok: true } | { ok: false; error: string }

/** Link an unmapped source to a doctor (status='doctor', master_id set). */
export async function mapSourceToDoctor(sourceId: string, masterId: string): Promise<ActionResult> {
  try {
    const state = db()
    const row = state.sources.find((s) => s.source_id === sourceId)
    if (!row) return { ok: false, error: "Zdroj nebyl nalezen." }

    const old = { status: row.status, master_id: row.master_id }
    row.status = "doctor"
    row.master_id = masterId

    await writeAudit({
      action: "source.map",
      entity: "sources",
      entityId: sourceId,
      oldValue: old,
      newValue: { status: "doctor", master_id: masterId },
    })
    revalidatePath("/attention")
    revalidatePath("/settings/sources")
    revalidatePath("/periods")
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Mark an unmapped source as non-commission. */
export async function markSourceNonCommission(sourceId: string): Promise<ActionResult> {
  try {
    const state = db()
    const row = state.sources.find((s) => s.source_id === sourceId)
    if (!row) return { ok: false, error: "Zdroj nebyl nalezen." }

    const old = { status: row.status, master_id: row.master_id }
    row.status = "non_commission"
    row.master_id = null

    await writeAudit({
      action: "source.non_commission",
      entity: "sources",
      entityId: sourceId,
      oldValue: old,
      newValue: { status: "non_commission", master_id: null },
    })
    revalidatePath("/attention")
    revalidatePath("/settings/sources")
    revalidatePath("/periods")
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Flag a staff member as doctor / not doctor. */
export async function flagStaff(masterId: string, isDoctor: boolean): Promise<ActionResult> {
  try {
    const state = db()
    const row = state.staff.find((s) => s.master_id === masterId)
    if (!row) return { ok: false, error: "Zaměstnanec nebyl nalezen." }

    const old = { is_doctor: row.is_doctor }
    row.is_doctor = isDoctor

    await writeAudit({
      action: "staff.flag",
      entity: "staff",
      entityId: masterId,
      oldValue: old,
      newValue: { is_doctor: isDoctor },
    })
    revalidatePath("/attention")
    revalidatePath("/settings/staff")
    revalidatePath("/periods")
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/**
 * Map a new category to a bucket (or NULL = non-commission), versioned with
 * valid_from = first day of the affected month.
 */
export async function mapCategory(
  categoryId: string,
  bucket: string | null,
  validFrom: string,
): Promise<ActionResult> {
  try {
    const state = db()
    // Close any currently-open mapping for this category.
    for (const cm of state.categoryMapping) {
      if (cm.category_id === categoryId && cm.valid_to === null) cm.valid_to = validFrom
    }
    state.categoryMapping.push({
      id: newId(),
      category_id: categoryId,
      bucket,
      valid_from: validFrom,
      valid_to: null,
    })

    // Lines that were waiting for this rule are no longer pending.
    for (const line of state.commissionLines) {
      if (line.category_id === categoryId && line.status === "pending_review") {
        line.status = "skipped"
        line.reason = bucket
          ? "kategorie přiřazena — přepočet proběhne v dalším běhu"
          : "kategorie bez provize"
      }
    }

    await writeAudit({
      action: "category.map",
      entity: "category_mapping",
      entityId: categoryId,
      oldValue: null,
      newValue: { bucket, valid_from: validFrom },
    })
    revalidatePath("/attention")
    revalidatePath("/settings/mapping")
    revalidatePath("/periods")
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/**
 * Registers a previously-unresolved check item in services_catalog, either
 * under an existing mapped category or with a direct per-service bucket
 * override. Removes it from the "Nerozpoznané položky" card going forward.
 */
export async function addUnmatchedService(
  itemId: string,
  itemName: string,
  target: { mode: "category"; categoryId: string } | { mode: "bucket"; bucket: string },
): Promise<ActionResult> {
  const cleanName = itemName.trim()
  if (cleanName.length === 0) return { ok: false, error: "Název služby je prázdný." }

  try {
    const state = db()
    if (state.servicesCatalog.some((sc) => sc.service_id === itemId)) {
      return { ok: false, error: "Tato služba už v číselníku je." }
    }

    if (target.mode === "category") {
      const categoryName =
        state.servicesCatalog.find((sc) => sc.category_id === target.categoryId)?.category_name ??
        null

      state.servicesCatalog.push({
        service_id: itemId,
        name: cleanName,
        price: 0,
        category_id: target.categoryId,
        category_name: categoryName,
        note: "přidáno ručně",
      })
      await writeAudit({
        action: "unmatched.add_service",
        entity: "services_catalog",
        entityId: itemId,
        oldValue: null,
        newValue: { name: cleanName, category_id: target.categoryId },
      })
    } else {
      if (!state.buckets.some((b) => b.bucket === target.bucket)) {
        return { ok: false, error: "Pravidlo nebylo nalezeno." }
      }

      state.servicesCatalog.push({
        service_id: itemId,
        name: cleanName,
        price: 0,
        category_id: null,
        category_name: null,
        note: "přidáno ručně",
      })
      const validFrom = monthInputToDate(nextMonthValue())
      state.serviceMapping.push({
        id: newId(),
        service_id: itemId,
        bucket: target.bucket,
        valid_from: validFrom,
        valid_to: null,
      })
      await writeAudit({
        action: "unmatched.add_service",
        entity: "services_catalog",
        entityId: itemId,
        oldValue: null,
        newValue: { name: cleanName, bucket: target.bucket, valid_from: validFrom },
      })
    }

    revalidatePath("/attention")
    revalidatePath("/settings/mapping")
    revalidatePath("/periods")
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Hides an unresolved item from the card and unblocks period freeze for it. */
export async function ignoreUnmatchedLine(itemId: string, reason: string): Promise<ActionResult> {
  const cleanReason = reason.trim()
  try {
    const state = db()
    const email = await getActorEmail()
    const existing = state.unmatchedIgnored.find((ui) => ui.item_id === itemId)
    if (existing) {
      existing.reason = cleanReason || null
      existing.user_email = email
      existing.at = new Date().toISOString()
    } else {
      state.unmatchedIgnored.push({
        item_id: itemId,
        reason: cleanReason || null,
        user_email: email,
        at: new Date().toISOString(),
      })
    }

    await writeAudit({
      action: "unmatched.ignore",
      entity: "unmatched_ignored",
      entityId: itemId,
      oldValue: null,
      newValue: { reason: cleanReason || null },
    })
    revalidatePath("/attention")
    revalidatePath("/periods")
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}

/** Reverses "Ignorovat" — the item reappears in the unresolved card. */
export async function unignoreUnmatchedLine(itemId: string): Promise<ActionResult> {
  try {
    const state = db()
    const old = state.unmatchedIgnored.find((ui) => ui.item_id === itemId)
    state.unmatchedIgnored = state.unmatchedIgnored.filter((ui) => ui.item_id !== itemId)

    await writeAudit({
      action: "unmatched.unignore",
      entity: "unmatched_ignored",
      entityId: itemId,
      oldValue: old ? { reason: old.reason } : null,
      newValue: null,
    })
    revalidatePath("/attention")
    revalidatePath("/periods")
    revalidatePath("/")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}
