import "server-only"
import { db } from "@/lib/demo/store"
import type { Role } from "@/lib/session"

export type AppUser = {
  id: string
  email: string
  full_name: string
  role: Role
  created_at: string
  invited_by: string | null
  inviter_name: string | null
  inviter_email: string | null
}

/** All users with the name/email of whoever invited them, oldest first. */
export async function getUsers(): Promise<AppUser[]> {
  const state = db()
  return state.users
    .slice()
    .sort((a, b) => (a.created_at < b.created_at ? -1 : 1))
    .map((u) => {
      const inviter = u.invited_by ? state.users.find((x) => x.id === u.invited_by) : null
      return {
        id: u.id,
        email: u.email,
        full_name: u.full_name,
        role: u.role,
        created_at: u.created_at,
        invited_by: u.invited_by,
        inviter_name: inviter?.full_name ?? null,
        inviter_email: inviter?.email ?? null,
      }
    })
}
