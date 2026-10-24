"use client"

import { useI18n } from "@/lib/i18n/client"
import type { TFunction } from "@/lib/i18n/translate"

const FIELD_LABEL: Record<string, string> = {
  status: "stav",
  label: "název",
  name: "název",
  full_name: "jméno",
  beneficiary: "příjemce",
  category_id: "kategorie",
  service_id: "služba",
  rate: "sazba",
  bucket: "pravidlo",
  is_doctor: "lékař",
  note: "poznámka",
  master_id: "lékař (id)",
  valid_from: "platí od",
  valid_to: "platí do",
  total_commission: "provize",
  frozen_by: "uzavřel",
  reason: "důvod",
  role: "role",
  period: "období",
  active: "aktivní",
  enabled: "načítat se",
  maxBonus: "max. bonus",
  maxPenalty: "max. postih",
  minSample: "min. vzorek",
  bands: "prahy",
  primary: "hlavní",
  additional: "další",
  profile_id: "profil (id)",
}

const VALUE_LABEL: Record<string, string> = {
  doctor: "lékař",
  non_commission: "bez provize",
  unmapped: "nepřiřazeno",
  frozen: "uzavřeno",
  draft: "rozpracováno",
  admin: "administrátor",
  viewer: "prohlížení",
  true: "ano",
  false: "ne",
}

// Free-text values (rule names, reasons…) go through t() too, so seeded demo
// data reads in the UI language; anything not in the catalog shows as stored.
function renderScalar(v: unknown, t: TFunction): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "boolean") return v ? t("ano") : t("ne")
  const s = String(v)
  return t(VALUE_LABEL[s] ?? s)
}

/** Formats an audit jsonb payload as a compact "field: value" list. */
export function ValueDiff({ value }: { value: unknown }) {
  const { t } = useI18n()
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }

  if (typeof value !== "object") {
    const rendered = renderScalar(value, t)
    return (
      <span className="block max-w-full truncate text-foreground" title={rendered}>
        {rendered}
      </span>
    )
  }

  const entries = Object.entries(value as Record<string, unknown>)
  if (entries.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      {entries.map(([k, v]) => {
        const label = FIELD_LABEL[k] ? t(FIELD_LABEL[k]) : k
        const rendered = renderScalar(v, t)
        return (
          <span
            key={k}
            className="block max-w-full truncate text-xs"
            title={`${label}: ${rendered}`}
          >
            <span className="text-muted-foreground">{label}: </span>
            <span className="text-foreground tabular-nums">{rendered}</span>
          </span>
        )
      })}
    </span>
  )
}
