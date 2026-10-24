import { ChevronRight, TriangleAlert } from "lucide-react"
import Link from "next/link"
import { getI18n } from "@/lib/i18n/server"
import { withPeriod } from "@/lib/period-link"

export async function AttentionBanner({ count, period }: { count: number; period: string }) {
  if (count <= 0) return null
  const { tn } = await getI18n()

  return (
    <Link
      href={withPeriod("/attention", period)}
      className="flex items-center gap-3 rounded-lg border border-status-pending-foreground/30 bg-status-pending px-4 py-3 text-status-pending-foreground transition-colors hover:bg-status-pending/80"
    >
      <TriangleAlert className="size-5 shrink-0" />
      <span className="text-sm font-medium">
        {tn(
          count,
          "{n} položka vyžaduje pozornost — zobrazit",
          "{n} položky vyžadují pozornost — zobrazit",
          "{n} položek vyžaduje pozornost — zobrazit",
        )}
      </span>
      <ChevronRight className="ml-auto size-4 shrink-0" />
    </Link>
  )
}
