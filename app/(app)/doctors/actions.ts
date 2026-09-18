"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/demo/store"
import { writeAudit } from "@/lib/audit"
import { requireUser } from "@/lib/session"

type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Toggles "Vyplaceno" for a doctor in a given period. Deliberately available
 * to BOTH admin and viewer roles (unlike every other mutation in this app,
 * which is admin-only) — this is an operational checkbox, not a rules change.
 * Works on frozen periods too; payout status is independent of the freeze.
 */
export async function togglePayout(masterId: string, period: string, paid: boolean): Promise<ActionResult> {
  const actor = await requireUser() // NOT getActorEmail — admin AND viewer allowed

  try {
    const state = db()
    const staffRow = state.staff.find((s) => s.master_id === masterId)
    const fullName = staffRow?.full_name ?? `Neznámý lékař #${masterId}`

    if (paid) {
      if (!state.doctorPayouts.some((p) => p.master_id === masterId && p.period === period)) {
        state.doctorPayouts.push({ period, master_id: masterId, paid_by: actor, paid_at: new Date().toISOString() })
      }
    } else {
      state.doctorPayouts = state.doctorPayouts.filter(
        (p) => !(p.master_id === masterId && p.period === period),
      )
    }

    await writeAudit({
      action: paid ? "payout.mark" : "payout.unmark",
      entity: "doctor_payouts",
      entityId: `${period}:${masterId}`,
      oldValue: null,
      newValue: { full_name: fullName, period },
    })

    revalidatePath("/")
    revalidatePath(`/doctors/${masterId}`)
    return { ok: true }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Chyba" }
  }
}
