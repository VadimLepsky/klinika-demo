import { ChevronRight, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { withPeriod } from "@/lib/period-link"

export function AttentionBanner({ count, period }: { count: number; period: string }) {
  if (count <= 0) return null

  return (
    <Link
      href={withPeriod("/attention", period)}
      className="flex items-center gap-3 rounded-lg border border-status-pending-foreground/30 bg-status-pending px-4 py-3 text-status-pending-foreground transition-colors hover:bg-status-pending/80"
    >
      <TriangleAlert className="size-5 shrink-0" />
      <span className="text-sm font-medium">
        {count} {count === 1 ? "položka vyžaduje" : count < 5 ? "položky vyžadují" : "položek vyžaduje"} pozornost — zobrazit
      </span>
      <ChevronRight className="ml-auto size-4 shrink-0" />
    </Link>
  )
}
