const ENTITY_LABEL: Record<string, string> = {
  periods: "Období",
  sources: "Zdroje",
  staff: "Zaměstnanci",
  bucket_rates: "Sazby",
  commission_buckets: "Skupiny",
  category_mapping: "Kategorie",
  service_exclusions: "Výjimky služeb",
  service_mapping: "Mapování služeb",
  services_catalog: "Číselník služeb",
  unmatched_ignored: "Ignorované položky",
}

/** Czech label for an audit_log entity name. */
export function entityLabel(entity: string): string {
  return ENTITY_LABEL[entity] ?? entity
}
