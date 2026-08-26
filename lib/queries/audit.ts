import "server-only"
import { db } from "@/lib/demo/store"

export type AuditEntry = {
  id: number
  at: string
  user_email: string | null
  action: string
  entity: string
  entity_id: string | null
  old_value: unknown
  new_value: unknown
}

/** Distinct entity names present in audit_log, for the filter dropdown. */
export async function getAuditEntities(): Promise<string[]> {
  return [...new Set(db().auditLog.map((e) => e.entity))].sort()
}

/** Reverse-chronological audit entries, optionally filtered by entity. */
export async function getAuditLog(entity?: string, limit = 200): Promise<AuditEntry[]> {
  return db()
    .auditLog.filter((e) => !entity || e.entity === entity)
    .sort((a, b) => (a.at === b.at ? b.id - a.id : a.at < b.at ? 1 : -1))
    .slice(0, limit)
    .map((e) => ({
      id: e.id,
      at: new Date(e.at).toISOString(),
      user_email: e.user_email ?? null,
      action: e.action,
      entity: e.entity,
      entity_id: e.entity_id ?? null,
      old_value: e.old_value ?? null,
      new_value: e.new_value ?? null,
    }))
}
