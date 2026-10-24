"use server"

import { db, newId } from "@/lib/demo/store"
import { writeAudit } from "@/lib/audit"
import { getActorEmail } from "@/lib/session"
import { getI18n } from "@/lib/i18n/server"

// ---------- správa uživatelů (pouze na pozvání) ----------

/** Creates a user from /settings/users. Returns a temporary password —
 *  shown once, to be handed to the colleague in person. */
export async function inviteUser(formData: FormData) {
  const actor = await getActorEmail() // admin only
  const { t } = await getI18n()
  const role = formData.get("role") === "admin" ? "admin" : "viewer"
  const email = String(formData.get("email") ?? "").trim().toLowerCase()
  const fullName = String(formData.get("full_name") ?? "").trim()
  if (!email || !fullName) throw new Error(t("email a jméno jsou povinné"))

  const state = db()
  if (state.users.some((u) => u.email === email)) throw new Error(t("Uživatel s tímto e-mailem už existuje"))

  const tempPassword = Array.from({ length: 9 }, () => {
    const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789"
    return chars[Math.floor(Math.random() * chars.length)]
  }).join("")

  const inviter = state.users.find((u) => u.email === actor)
  const newUser = {
    id: newId(),
    email,
    full_name: fullName,
    role: role as "admin" | "viewer",
    created_at: new Date().toISOString(),
    invited_by: inviter?.id ?? null,
  }
  state.users.push(newUser)

  await writeAudit({
    action: "user.invite",
    entity: "users",
    entityId: email,
    oldValue: null,
    newValue: { full_name: fullName, role },
  })

  return { tempPassword }
}

/** Deletes a user from /settings/users. Admin only, not self, not the last admin. */
export async function deleteUser(userId: string) {
  const actor = await getActorEmail() // admin only, otherwise throws
  const { t } = await getI18n()

  const state = db()
  const me = state.users.find((u) => u.email === actor)
  if (!me) throw new Error(t("Uživatel nebyl nalezen"))
  if (String(me.id) === String(userId)) throw new Error(t("Nelze smazat vlastní účet"))

  const target = state.users.find((u) => u.id === userId)
  if (!target) throw new Error(t("Uživatel nebyl nalezen"))

  if (target.role === "admin") {
    const adminCount = state.users.filter((u) => u.role === "admin").length
    if (adminCount <= 1) throw new Error(t("Nelze smazat posledního administrátora"))
  }

  // clear self-references so nothing points at the deleted user
  for (const u of state.users) if (u.invited_by === userId) u.invited_by = null
  state.users = state.users.filter((u) => u.id !== userId)

  await writeAudit({
    action: "user.delete",
    entity: "users",
    entityId: target.email,
    oldValue: { full_name: target.full_name, role: target.role },
    newValue: null,
  })
}
