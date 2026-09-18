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

export type DoctorMonthlyStatsRec = {
  period: string
  master_id: string
  patients_served: number
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

/** One referral visit — mirrors a `visits` row that counts toward "Počet doporučení". */
export type ReferralVisitRec = {
  period: string
  master_id: string
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
  referralVisits: ReferralVisitRec[]
  doctorPayouts: DoctorPayoutRec[]
  unmatchedIgnored: UnmatchedIgnoredRec[]
  users: AppUserRec[]
  auditLog: AuditRec[]
  nextAuditId: number
  nextRowId: number
}
