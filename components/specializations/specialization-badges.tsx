"use client"

import { Badge } from "@/components/ui/badge"
import { useI18n } from "@/lib/i18n/client"
import type { DoctorSpecializations } from "@/lib/queries/specializations"
import { cn } from "@/lib/utils"

export function SpecializationBadges({
  specs,
  emptyLabel,
  className,
}: {
  specs: DoctorSpecializations | undefined
  emptyLabel?: string
  className?: string
}) {
  const { t } = useI18n()
  const primary = specs?.primary ?? null
  const additional = specs?.additional ?? []

  if (!primary && additional.length === 0) {
    return emptyLabel ? <span className="text-sm text-muted-foreground">{emptyLabel}</span> : null
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {primary ? <Badge title={t("Hlavní specializace")}>{t(primary.name)}</Badge> : null}
      {additional.map((s) => (
        <Badge key={s.id} variant="secondary" className="text-muted-foreground" title={t("Další specializace")}>
          {t(s.name)}
        </Badge>
      ))}
    </div>
  )
}
