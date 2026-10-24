import type { TFunction } from "@/lib/i18n/translate"

const ENTITY_LABEL: Record<string, string> = {
  periods: "Období",
  sources: "Zdroje",
  staff: "Zaměstnanci",
  bucket_rates: "Sazby",
  commission_buckets: "Pravidla provizí",
  category_mapping: "Kategorie",
  service_exclusions: "Výjimky služeb",
  service_mapping: "Mapování služeb",
  services_catalog: "Číselník služeb",
  unmatched_ignored: "Ignorované položky",
  users: "Uživatelé",
  doctor_payouts: "Výplaty",
  specializations: "Specializace",
  staff_specializations: "Specializace zaměstnanců",
  kpi_profiles: "KPI profily",
  doctor_kpi_profiles: "Přiřazení KPI",
  doctor_bucket_rates: "Osobní sazby",
}

/** Localized label for an audit_log entity name. */
export function entityLabel(entity: string, t: TFunction): string {
  const label = ENTITY_LABEL[entity]
  return label ? t(label) : entity
}
