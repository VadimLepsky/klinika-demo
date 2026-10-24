"use server"

import { tr } from "@/lib/i18n/server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/demo/store"
import { writeAudit } from "@/lib/audit"
import { getActorEmail } from "@/lib/session"
import { getPeriodsWithBlockers } from "@/lib/queries/periods"

type Result = { ok: true } | { ok: false; error: string }

/**
 * Freezes a month.
 *
 * Re-validates blockers server-side (never trusts the client), then:
 *  - total_commission is recomputed from commission_monthly (the authoritative
 *    source), NEVER by summing commission_lines.commission.
 *  - writes a 'period.freeze' audit entry.
 */
export async function freezePeriod(period: string): Promise<Result> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(period)) {
    return { ok: false, error: await tr("Neplatné období.") }
  }

  const all = await getPeriodsWithBlockers()
  const target = all.find((p) => p.period === period)

  if (!target) return { ok: false, error: await tr("Období nebylo nalezeno.") }
  if (target.status === "frozen") return { ok: false, error: await tr("Měsíc už je zmrazen.") }
  if (!target.canFreeze) {
    return { ok: false, error: await tr("Měsíc má nedokončené položky — zmrazení není možné.") }
  }

  const email = await getActorEmail()
  const state = db()

  // Authoritative total: commission_monthly, not commission_lines.
  const total = state.commissionMonthly
    .filter((m) => m.period === period)
    .reduce((s, m) => s + m.commission, 0)

  const row = state.periods.find((p) => p.period === period)
  if (row) {
    row.status = "frozen"
    row.frozen_at = new Date().toISOString()
    row.frozen_by = email
    row.total_commission = Math.round(total * 100) / 100
  }

  await writeAudit({
    action: "period.freeze",
    entity: "periods",
    entityId: period,
    oldValue: { status: target.status, total_commission: target.total_commission },
    newValue: { status: "frozen", frozen_by: email, total_commission: total },
  })

  revalidatePath("/periods")
  revalidatePath("/")
  revalidatePath("/audit")
  return { ok: true }
}
