import "server-only"
import { db } from "@/lib/demo/store"
import { periodKey } from "@/lib/format"

export type StaffOption = {
  master_id: string
  full_name: string
}

/** Doctors available to link sources to (is_doctor = true). */
export async function getDoctorOptions(): Promise<StaffOption[]> {
  return db()
    .staff.filter((s) => s.is_doctor === true)
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "cs"))
    .map((s) => ({ master_id: s.master_id, full_name: s.full_name }))
}

export type UnmappedSource = {
  source_id: string
  label: string
  note: string | null
  suggestion: StaffOption | null
}

/** Normalize a Czech label for fuzzy comparison. */
function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/** Token-overlap similarity in [0,1]; good enough to suggest a likely doctor. */
function similarity(a: string, b: string): number {
  const ta = new Set(norm(a).split(" ").filter(Boolean))
  const tb = new Set(norm(b).split(" ").filter(Boolean))
  if (ta.size === 0 || tb.size === 0) return 0
  let shared = 0
  for (const t of ta) if (tb.has(t)) shared++
  return shared / Math.max(ta.size, tb.size)
}

export async function getUnmappedSources(): Promise<UnmappedSource[]> {
  const rows = db()
    .sources.filter((s) => s.status === "unmapped")
    .sort((a, b) => a.label.localeCompare(b.label, "cs"))

  const doctors = await getDoctorOptions()

  return rows.map((r) => {
    let best: StaffOption | null = null
    let bestScore = 0.34 // require a minimum overlap to suggest anything
    for (const d of doctors) {
      const score = similarity(r.label, d.full_name)
      if (score > bestScore) {
        bestScore = score
        best = d
      }
    }
    return {
      source_id: r.source_id,
      label: r.label,
      note: r.note ?? null,
      suggestion: best,
    }
  })
}

export type UnflaggedStaff = {
  master_id: string
  full_name: string
  note: string | null
}

export async function getUnflaggedStaff(): Promise<UnflaggedStaff[]> {
  return db()
    .staff.filter((s) => s.is_doctor === null)
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "cs"))
    .map((s) => ({ master_id: s.master_id, full_name: s.full_name, note: s.note ?? null }))
}

export type NewCategory = {
  category_id: string
  example_name: string
  line_count: number
  affected_month: string
}

const PENDING_REASON = "nová kategorie bez sazby"

/** Pass a period to scope to that month; omit to see the new categories across all periods. */
export async function getNewCategories(period?: string): Promise<NewCategory[]> {
  const state = db()
  const groups = new Map<string, { count: number; month: string; name: string }>()

  for (const l of state.commissionLines) {
    if (l.status !== "pending_review" || l.reason !== PENDING_REASON) continue
    if (period && l.period !== period) continue
    if (!l.category_id) continue
    const catalogName = state.servicesCatalog.find(
      (sc) => sc.category_id === l.category_id,
    )?.category_name
    const found = groups.get(l.category_id)
    if (found) {
      found.count += 1
      if (l.period < found.month) found.month = l.period
    } else {
      groups.set(l.category_id, {
        count: 1,
        month: l.period,
        name: catalogName ?? l.item_name,
      })
    }
  }

  return [...groups.entries()]
    .map(([category_id, g]) => ({
      category_id,
      example_name: g.name ?? "—",
      line_count: g.count,
      affected_month: periodKey(g.month),
    }))
    .sort((a, b) => b.line_count - a.line_count)
}

export type BucketOption = {
  bucket: string
  label: string
}

export async function getBucketOptions(): Promise<BucketOption[]> {
  return db()
    .buckets.slice()
    .sort((a, b) => (a.sort_order ?? 1e9) - (b.sort_order ?? 1e9) || a.bucket.localeCompare(b.bucket))
    .map((b) => ({ bucket: b.bucket, label: b.label }))
}

export type UnmatchedLineGroup = {
  period: string
  item_id: string
  item_name: string
  line_count: number
  total_amount: number
  reason: string | null
}

/**
 * Unresolved check lines grouped by (period, item_id) so the same missing
 * service isn't repeated once per check. Excludes items that already exist
 * in services_catalog (resolved) or have been explicitly ignored.
 *
 * Pass a period to scope to that month; omit to see unmatched lines across all periods.
 */
export async function getUnmatchedLines(period?: string): Promise<UnmatchedLineGroup[]> {
  const state = db()
  const groups = new Map<string, UnmatchedLineGroup>()

  for (const l of state.commissionLines) {
    if (l.status !== "unmatched" || l.item_id == null) continue
    if (period && l.period !== period) continue
    if (state.servicesCatalog.some((sc) => sc.service_id === l.item_id)) continue
    if (state.unmatchedIgnored.some((ui) => ui.item_id === l.item_id)) continue

    const key = `${l.period}|${l.item_id}`
    const found = groups.get(key)
    if (found) {
      found.line_count += 1
      found.total_amount += l.base_amount
    } else {
      groups.set(key, {
        period: periodKey(l.period),
        item_id: l.item_id,
        item_name: l.item_name ?? "—",
        line_count: 1,
        total_amount: l.base_amount,
        reason: l.reason ?? null,
      })
    }
  }

  return [...groups.values()]
    .sort((a, b) => (a.period === b.period ? b.line_count - a.line_count : a.period < b.period ? 1 : -1))
    .slice(0, 500)
}

export type IgnoredUnmatchedLine = {
  item_id: string
  item_name: string
  reason: string | null
  user_email: string | null
  at: string
}

/** Items hidden from "Nerozpoznané položky" via the "Ignorovat" action. */
export async function getIgnoredUnmatchedLines(): Promise<IgnoredUnmatchedLine[]> {
  const state = db()
  return state.unmatchedIgnored
    .slice()
    .sort((a, b) => (a.at < b.at ? 1 : -1))
    .map((ui) => ({
      item_id: ui.item_id,
      item_name:
        state.commissionLines.find((l) => l.item_id === ui.item_id)?.item_name ?? "—",
      reason: ui.reason ?? null,
      user_email: ui.user_email ?? null,
      at: String(ui.at),
    }))
}

export type ExistingCategory = {
  category_id: string
  category_name: string
}

/** CRM categories that already have an active bucket mapping, for the "Přidat službu" dialog. */
export async function getExistingCategories(): Promise<ExistingCategory[]> {
  const state = db()
  const out = new Map<string, string>()

  for (const cm of state.categoryMapping) {
    if (cm.valid_to !== null) continue
    const name = state.servicesCatalog.find(
      (sc) => sc.category_id === cm.category_id && sc.category_name,
    )?.category_name
    if (name) out.set(cm.category_id, name)
  }

  return [...out.entries()]
    .map(([category_id, category_name]) => ({ category_id, category_name }))
    .sort((a, b) => a.category_name.localeCompare(b.category_name, "cs"))
}
