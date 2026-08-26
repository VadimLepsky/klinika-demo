import Link from "next/link"
import { CircleAlert } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import type { PeriodBlockers } from "@/lib/queries/periods"

function blockerLines(b: PeriodBlockers): { text: string; href?: string }[] {
  const out: { text: string; href?: string }[] = []
  if (b.pendingReview > 0) out.push({ text: `Vyžaduje pozornost: ${b.pendingReview} pol.` })
  if (b.unmatched > 0) out.push({ text: `Nerozpoznáno: ${b.unmatched} pol.`, href: "/attention#unmatched" })
  if (b.unmappedSources > 0)
    out.push({ text: `Nepřiřazené zdroje: ${b.unmappedSources}`, href: "/attention#sources" })
  if (b.unflaggedStaff > 0)
    out.push({ text: `Neoznačení zaměstnanci: ${b.unflaggedStaff}`, href: "/attention#staff" })
  return out
}

/** Amber "N položek blokuje" badge that reveals the per-category breakdown in a tooltip. */
export function BlockerSummary({ blockers }: { blockers: PeriodBlockers }) {
  const total = blockers.pendingReview + blockers.unmatched + blockers.unmappedSources + blockers.unflaggedStaff

  if (total === 0) {
    return <span className="text-sm text-muted-foreground">Připraveno k uzavření</span>
  }

  const reasons = blockerLines(blockers)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className="inline-flex items-center gap-1.5 text-sm text-amber-500 focus:outline-none"
          >
            <CircleAlert className="size-3.5 shrink-0" />
            {total} pol. blokuje
          </span>
        }
      />
      <TooltipContent className="max-w-xs">
        <span className="block font-medium">Blokuje uzavření:</span>
        <ul className="mt-1 list-disc pl-4">
          {reasons.map((r) =>
            r.href ? (
              <li key={r.text}>
                <Link href={r.href} className="underline underline-offset-2 hover:no-underline">
                  {r.text}
                </Link>
              </li>
            ) : (
              <li key={r.text}>{r.text}</li>
            ),
          )}
        </ul>
      </TooltipContent>
    </Tooltip>
  )
}
