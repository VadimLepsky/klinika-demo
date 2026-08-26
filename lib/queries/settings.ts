import "server-only"
import { db } from "@/lib/demo/store"
import { periodKey } from "@/lib/format"

const bySortOrder = (a: { sort_order: number | null; bucket: string }, b: { sort_order: number | null; bucket: string }) =>
  (a.sort_order ?? 1e9) - (b.sort_order ?? 1e9) || a.bucket.localeCompare(b.bucket)

/* ---------------------------------- Rates --------------------------------- */

export type BucketRate = {
  bucket: string
  label: string
  beneficiary: string
  sort_order: number | null
  current_rate: number | null
  valid_from: string | null
}

export async function getBucketsWithRates(): Promise<BucketRate[]> {
  const state = db()
  return state.buckets
    .slice()
    .sort(bySortOrder)
    .map((b) => {
      const rate = state.bucketRates.find((r) => r.bucket === b.bucket && r.valid_to === null)
      return {
        bucket: b.bucket,
        label: b.label,
        beneficiary: b.beneficiary,
        sort_order: b.sort_order,
        current_rate: rate ? rate.rate : null,
        valid_from: rate ? rate.valid_from : null,
      }
    })
}

export type BucketManagementRow = {
  bucket: string
  label: string
  beneficiary: string
  sort_order: number | null
  current_rate: number | null
  valid_from: string | null
  mapping_count: number
  canDelete: boolean
}

/** Buckets with rate + usage info for the /settings/buckets admin page. */
export async function getBucketsForManagement(): Promise<BucketManagementRow[]> {
  const state = db()
  return state.buckets
    .slice()
    .sort(bySortOrder)
    .map((b) => {
      const rate = state.bucketRates.find((r) => r.bucket === b.bucket && r.valid_to === null)
      const mappingCount = state.categoryMapping.filter((cm) => cm.bucket === b.bucket).length
      const monthlyCount = state.commissionMonthly.filter((m) => m.bucket === b.bucket).length
      return {
        bucket: b.bucket,
        label: b.label,
        beneficiary: b.beneficiary,
        sort_order: b.sort_order,
        current_rate: rate ? rate.rate : null,
        valid_from: rate ? rate.valid_from : null,
        mapping_count: mappingCount,
        canDelete: mappingCount === 0 && monthlyCount === 0,
      }
    })
}

export type RateHistoryRow = {
  id: string
  rate: number
  valid_from: string
  valid_to: string | null
}

export async function getRateHistory(bucket: string): Promise<RateHistoryRow[]> {
  return db()
    .bucketRates.filter((r) => r.bucket === bucket)
    .sort((a, b) => (a.valid_from < b.valid_from ? 1 : -1))
    .map((r) => ({
      id: r.id,
      rate: r.rate,
      valid_from: r.valid_from,
      valid_to: r.valid_to,
    }))
}

/* --------------------------------- Mapping -------------------------------- */

export type CategoryMappingRow = {
  category_id: string
  category_name: string
  bucket: string | null
  bucket_label: string | null
  valid_from: string
}

export async function getCategoryMappings(): Promise<CategoryMappingRow[]> {
  const state = db()
  const latest = new Map<string, (typeof state.categoryMapping)[number]>()

  for (const cm of state.categoryMapping) {
    if (cm.valid_to !== null) continue
    const found = latest.get(cm.category_id)
    if (!found || cm.valid_from > found.valid_from) latest.set(cm.category_id, cm)
  }

  return [...latest.values()]
    .sort((a, b) => Number(a.category_id) - Number(b.category_id))
    .map((cm) => ({
      category_id: cm.category_id,
      category_name:
        state.servicesCatalog.find((sc) => sc.category_id === cm.category_id && sc.category_name)
          ?.category_name ?? `Kategorie ${cm.category_id}`,
      bucket: cm.bucket,
      bucket_label: state.buckets.find((b) => b.bucket === cm.bucket)?.label ?? null,
      valid_from: cm.valid_from,
    }))
}

export type ServiceExclusionRow = {
  id: string
  service_id: string
  service_name: string
  reason: string | null
  valid_from: string
  valid_to: string | null
}

export async function getServiceExclusions(): Promise<ServiceExclusionRow[]> {
  const state = db()
  return state.serviceExclusions
    .slice()
    .sort((a, b) => {
      if (a.valid_to === null && b.valid_to !== null) return -1
      if (a.valid_to !== null && b.valid_to === null) return 1
      return a.valid_from < b.valid_from ? 1 : -1
    })
    .map((se) => ({
      id: se.id,
      service_id: se.service_id,
      service_name:
        state.servicesCatalog.find((sc) => sc.service_id === se.service_id)?.name ??
        `Služba ${se.service_id}`,
      reason: se.reason ?? null,
      valid_from: se.valid_from,
      valid_to: se.valid_to,
    }))
}

export type ServiceMappingRow = {
  id: string
  service_id: string
  service_name: string
  bucket: string | null
  bucket_label: string | null
  valid_from: string
  valid_to: string | null
}

export async function getServiceMappings(): Promise<ServiceMappingRow[]> {
  const state = db()
  return state.serviceMapping
    .slice()
    .sort((a, b) => {
      if (a.valid_to === null && b.valid_to !== null) return -1
      if (a.valid_to !== null && b.valid_to === null) return 1
      return a.valid_from < b.valid_from ? 1 : -1
    })
    .map((sm) => ({
      id: sm.id,
      service_id: sm.service_id,
      service_name:
        state.servicesCatalog.find((sc) => sc.service_id === sm.service_id)?.name ??
        `Služba ${sm.service_id}`,
      bucket: sm.bucket,
      bucket_label: state.buckets.find((b) => b.bucket === sm.bucket)?.label ?? null,
      valid_from: sm.valid_from,
      valid_to: sm.valid_to,
    }))
}

/* --------------------------------- Sources -------------------------------- */

export type SourceRow = {
  source_id: string
  label: string
  status: string
  master_id: string | null
  doctor_name: string | null
  note: string | null
}

export async function getSources(): Promise<SourceRow[]> {
  const state = db()
  return state.sources
    .slice()
    .sort((a, b) => a.label.localeCompare(b.label, "cs"))
    .map((s) => ({
      source_id: s.source_id,
      label: s.label,
      status: s.status,
      master_id: s.master_id,
      doctor_name: state.staff.find((st) => st.master_id === s.master_id)?.full_name ?? null,
      note: s.note ?? null,
    }))
}

/* ---------------------------------- Staff --------------------------------- */

export type StaffRow = {
  master_id: string
  full_name: string
  is_doctor: boolean | null
  note: string | null
}

export async function getStaff(): Promise<StaffRow[]> {
  return db()
    .staff.slice()
    .sort((a, b) => a.full_name.localeCompare(b.full_name, "cs"))
    .map((s) => ({
      master_id: s.master_id,
      full_name: s.full_name,
      is_doctor: s.is_doctor,
      note: s.note ?? null,
    }))
}

/* --------------------------------- Helpers -------------------------------- */

export { periodKey }
