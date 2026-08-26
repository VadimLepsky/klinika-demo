import "server-only"
import { writeAudit as append } from "@/lib/demo/store"
import { getActorEmail } from "@/lib/session"

/**
 * Appends an entry to the audit log. Every rule mutation MUST call this.
 */
export async function writeAudit(params: {
  action: string
  entity: string
  entityId: string | number
  oldValue?: unknown
  newValue?: unknown
}): Promise<void> {
  const email = await getActorEmail()
  append({ actor: email, ...params })
}
