"use server"

import { actionError, tr } from "@/lib/i18n/server"
import { revalidatePath } from "next/cache"
import { db } from "@/lib/demo/store"
import { writeAudit } from "@/lib/audit"
import { getSessionUser } from "@/lib/session"

type ActionResult = { ok: true } | { ok: false; error: string }

/**
 * Changes a user's role and records it in audit_log.
 * Admin-only, and a user can never change their own role (also enforced in the UI).
 */
export async function changeUserRole(userId: string, role: "admin" | "viewer"): Promise<ActionResult> {
  if (role !== "admin" && role !== "viewer") return { ok: false, error: await tr("Neplatná role.") }

  const me = await getSessionUser()
  if (!me || me.role !== "admin") return { ok: false, error: await tr("Nedostatečná oprávnění.") }
  if (String(me.id) === String(userId)) return { ok: false, error: await tr("Nelze změnit vlastní roli.") }

  try {
    const state = db()
    const row = state.users.find((u) => u.id === userId)
    if (!row) return { ok: false, error: await tr("Uživatel nebyl nalezen.") }
    if (row.role === role) return { ok: true }

    const oldRole = row.role
    row.role = role

    await writeAudit({
      action: "user.role_change",
      entity: "users",
      entityId: row.email,
      oldValue: { role: oldRole },
      newValue: { role },
    })
    revalidatePath("/settings/users")
    return { ok: true }
  } catch (e) {
    return { ok: false, error: await actionError(e) }
  }
}
