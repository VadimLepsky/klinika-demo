// Row shapes of the demo dataset. They mirror the reporting/rules tables the
// production app reads from Postgres, so every query keeps its original result
// type — only the source of the rows changed.

export type LineStatusValue = "accrued" | "skipped" | "pending_review" | "unmatched"

export type PeriodRec = {
  period: string
  status: "draft" | "frozen"
  frozen_at: string | null
  frozen_by: string | null
  total_commission: number | null
}

export type StaffRec = {
  master_id: string
  full_name: string
  is_doctor: boolean | null
  note: string | null
}

export type SourceRec = {
  source_id: string
  label: string
  status: "doctor" | "non_commission" | "unmapped"
  master_id: string | null
  note: string | null
}

export type BucketRec = {
  bucket: string
  label: string
  beneficiary: "source" | "performer"
  sort_order: number | null
}

export type BucketRateRec = {
  id: string
  bucket: string
  rate: number
  valid_from: string
  valid_to: string | null
}

export type CategoryMappingRec = {
  id: string
  category_id: string
  bucket: string | null
  valid_from: string
  valid_to: string | null
}

export type ServiceMappingRec = {
  id: string
  service_id: string
  bucket: string | null
  valid_from: string
  valid_to: string | null
}

export type ServiceExclusionRec = {
  id: string
  service_id: string
  reason: string | null
  valid_from: string
  valid_to: string | null
}

export type ServiceCatalogRec = {
  service_id: string
  name: string
  price: number
  category_id: string | null
  category_name: string | null
  note: string | null
}

export type CommissionLineRec = {
  id: string
  period: string
  visit_id: string
  source_id: string | null
  beneficiary_master_id: string | null
  item_id: string | null
  item_name: string
  category_id: string | null
  bucket: string | null
  base_amount: number
  rate: number | null
  commission: number
  status: LineStatusValue
  reason: string | null
}

export type CommissionMonthlyRec = {
  period: string
  master_id: string
  bucket: string
  qty: number
  base: number
  rate: number
  commission: number
}

/**
 * One doctor's monthly activity snapshot, as the (fictional) external worker
 * would produce it. `referred_patients` is the headline "doporučeno pacientů"
 * metric (unique patients); `referrals` is the raw referral-visit count.
 */
export type DoctorMonthlyStatsRec = {
  period: string
  master_id: string
  patients_served: number
  referrals: number
  referred_patients: number
  referrals_commissionable: number
  visits_performed: number
  self_records: number
  showup_done_count: number
  showup_done_sum: number
  showup_cancel_count: number
  showup_cancel_sum: number
  consult_offline_primary: number
  consult_offline_repeat: number
  consult_online_primary: number
  consult_online_repeat: number
}

export type UnmatchedIgnoredRec = {
  item_id: string
  reason: string | null
  user_email: string | null
  at: string
}

export type AuditRec = {
  id: number
  at: string
  user_email: string | null
  action: string
  entity: string
  entity_id: string | null
  old_value: unknown
  new_value: unknown
}

export type DoctorPayoutRec = {
  period: string
  master_id: string
  paid_by: string
  paid_at: string
}

export type Role = "admin" | "viewer"

export type AppUserRec = {
  id: string
  email: string
  full_name: string
  role: Role
  created_at: string
  invited_by: string | null
}

/* ------------------------------ specializations ---------------------------- */

export type SpecializationRec = {
  id: string
  name: string
  active: boolean
}

export type StaffSpecializationRec = {
  master_id: string
  specialization_id: string
  is_primary: boolean
}

export type BandColorValue = "red" | "yellow" | "green" | "blue" | "grey"

export type SpecializationBandRec = {
  specialization_id: string
  min_pct: number
  color: BandColorValue
}

/* ---------------------------------- KPI ------------------------------------ */

export type KpiMetricValue = "showup" | "avg_check" | "activity"

export type KpiProfileRec = {
  id: string
  name: string
  active: boolean
  max_bonus: number
  max_penalty: number
  min_sample: number
}

export type KpiProfileBandRec = {
  profile_id: string
  metric: KpiMetricValue
  min_value: number
  max_value: number | null
  points: number
}

/** A doctor's KPI-profile assignment history — one open row (valid_to = null) at a time. */
export type DoctorKpiProfileRec = {
  id: string
  master_id: string
  profile_id: string | null
  valid_from: string
  valid_to: string | null
}

/** A doctor's computed KPI result for one month — produced by the (fictional) external worker. */
export type DoctorKpiMonthlyRec = {
  master_id: string
  period: string
  profile_id: string | null
  showup_pct: number | null
  avg_check: number | null
  activity_pct: number | null
  planned_count: number
  showup_points: number
  avg_check_points: number
  activity_points: number
  k_raw: number
  k_kpi: number
  sample_ok: boolean
  commission_source: number
  commission_performer: number
  final_commission: number
}

/* ------------------------------ doctor rates -------------------------------- */

export type DoctorBucketRateRec = {
  master_id: string
  bucket: string
  enabled: boolean
  rate: number | null
  valid_from: string
  valid_to: string | null
}

export type DemoState = {
  periods: PeriodRec[]
  staff: StaffRec[]
  sources: SourceRec[]
  buckets: BucketRec[]
  bucketRates: BucketRateRec[]
  categoryMapping: CategoryMappingRec[]
  serviceMapping: ServiceMappingRec[]
  serviceExclusions: ServiceExclusionRec[]
  servicesCatalog: ServiceCatalogRec[]
  commissionLines: CommissionLineRec[]
  commissionMonthly: CommissionMonthlyRec[]
  doctorMonthlyStats: DoctorMonthlyStatsRec[]
  doctorPayouts: DoctorPayoutRec[]
  unmatchedIgnored: UnmatchedIgnoredRec[]
  users: AppUserRec[]
  specializations: SpecializationRec[]
  staffSpecializations: StaffSpecializationRec[]
  specializationBands: SpecializationBandRec[]
  kpiProfiles: KpiProfileRec[]
  kpiProfileBands: KpiProfileBandRec[]
  doctorKpiProfiles: DoctorKpiProfileRec[]
  doctorKpiMonthly: DoctorKpiMonthlyRec[]
  doctorBucketRates: DoctorBucketRateRec[]
  auditLog: AuditRec[]
  nextAuditId: number
  nextRowId: number
}
