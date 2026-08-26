import "server-only"
import { buildDemoState, rollupMonthly } from "./seed"
import type { DemoState } from "./types"

// The demo runs entirely in memory: the seeded dataset lives in the server
// process and the rule mutations rewrite it in place. Cached on globalThis so
// the state survives hot reloads in dev and module re-evaluation in prod.
const GLOBAL_KEY = Symbol.for("demo.clinic.state")

type GlobalWithState = typeof globalThis & { [GLOBAL_KEY]?: DemoState }

export function db(): DemoState {
  const g = globalThis as GlobalWithState
  if (!g[GLOBAL_KEY]) g[GLOBAL_KEY] = buildDemoState()
  return g[GLOBAL_KEY]
}

/** Fresh row id for records created through the UI. */
export function newId(): string {
  const state = db()
  return String(state.nextRowId++)
}

/** Recomputes the monthly rollup after the lines or the rules changed. */
export function recomputeMonthly(): void {
  const state = db()
  state.commissionMonthly = rollupMonthly(state.commissionLines)
}

/** Appends an audit entry — every rule mutation writes one, as in production. */
export function writeAudit(params: {
  actor: string
  action: string
  entity: string
  entityId: string | number
  oldValue?: unknown
  newValue?: unknown
}): void {
  const state = db()
  state.auditLog.unshift({
    id: state.nextAuditId++,
    at: new Date().toISOString(),
    user_email: params.actor,
    action: params.action,
    entity: params.entity,
    entity_id: String(params.entityId),
    old_value: params.oldValue ?? null,
    new_value: params.newValue ?? null,
  })
}
