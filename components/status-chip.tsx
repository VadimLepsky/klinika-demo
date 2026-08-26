import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

export type LineStatus = "accrued" | "skipped" | "pending_review" | "unmatched"

const STATUS_META: Record<LineStatus, { label: string; className: string }> = {
  accrued: {
    label: "připsáno",
    className: "bg-status-accrued text-status-accrued-foreground",
  },
  skipped: {
    label: "přeskočeno",
    className: "bg-status-skipped text-status-skipped-foreground",
  },
  pending_review: {
    label: "vyžaduje pozornost",
    className: "bg-status-pending text-status-pending-foreground",
  },
  unmatched: {
    label: "nerozpoznáno",
    className: "bg-status-unmatched text-status-unmatched-foreground",
  },
}

export function StatusChip({ status, reason }: { status: LineStatus; reason?: string | null }) {
  const meta = STATUS_META[status] ?? STATUS_META.skipped
  const chip = (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  )

  if (!reason) return chip

  return (
    <Tooltip>
      <TooltipTrigger render={chip} />
      <TooltipContent>{reason}</TooltipContent>
    </Tooltip>
  )
}
