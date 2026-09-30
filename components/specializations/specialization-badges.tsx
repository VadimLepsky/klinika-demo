import { Badge } from "@/components/ui/badge"
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
  const primary = specs?.primary ?? null
  const additional = specs?.additional ?? []

  if (!primary && additional.length === 0) {
    return emptyLabel ? <span className="text-sm text-muted-foreground">{emptyLabel}</span> : null
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {primary ? <Badge title="Hlavní specializace">{primary.name}</Badge> : null}
      {additional.map((s) => (
        <Badge key={s.id} variant="secondary" className="text-muted-foreground" title="Další specializace">
          {s.name}
        </Badge>
      ))}
    </div>
  )
}
