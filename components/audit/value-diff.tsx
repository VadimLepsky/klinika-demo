const FIELD_LABEL: Record<string, string> = {
  status: "stav",
  label: "název",
  name: "název",
  beneficiary: "příjemce",
  category_id: "kategorie",
  service_id: "služba",
  rate: "sazba",
  bucket: "skupina",
  is_doctor: "lékař",
  note: "poznámka",
  master_id: "lékař (id)",
  valid_from: "platí od",
  valid_to: "platí do",
  total_commission: "provize",
  frozen_by: "uzavřel",
  reason: "důvod",
}

const VALUE_LABEL: Record<string, string> = {
  doctor: "lékař",
  non_commission: "bez provize",
  unmapped: "nepřiřazeno",
  frozen: "uzavřeno",
  draft: "rozpracováno",
  true: "ano",
  false: "ne",
}

function renderScalar(v: unknown): string {
  if (v === null || v === undefined) return "—"
  if (typeof v === "boolean") return v ? "ano" : "ne"
  const s = String(v)
  return VALUE_LABEL[s] ?? s
}

/** Formats an audit jsonb payload as a compact "field: value" list. */
export function ValueDiff({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return <span className="text-muted-foreground">—</span>
  }

  if (typeof value !== "object") {
    const rendered = renderScalar(value)
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
        const label = FIELD_LABEL[k] ?? k
        const rendered = renderScalar(v)
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
