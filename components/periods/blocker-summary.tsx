"use client"

import Link from "next/link"
import { CircleAlert } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useI18n } from "@/lib/i18n/client"
import type { TFunction } from "@/lib/i18n/translate"
import type { PeriodBlockers } from "@/lib/queries/periods"

export function blockerLines(b: PeriodBlockers, t: TFunction): { text: string; href?: string }[] {
  const out: { text: string; href?: string }[] = []
  if (b.pendingReview > 0) out.push({ text: t("Vyžaduje pozornost: {n} pol.", { n: b.pendingReview }) })
  if (b.unmatched > 0) out.push({ text: t("Nerozpoznáno: {n} pol.", { n: b.unmatched }), href: "/attention#unmatched" })
  if (b.unmappedSources > 0)
    out.push({ text: t("Nepřiřazené zdroje: {n}", { n: b.unmappedSources }), href: "/attention#sources" })
  if (b.unflaggedStaff > 0)
    out.push({ text: t("Neoznačení zaměstnanci: {n}", { n: b.unflaggedStaff }), href: "/attention#staff" })
  return out
}

/** Amber "N položek blokuje" badge that reveals the per-category breakdown in a tooltip. */
export function BlockerSummary({ blockers }: { blockers: PeriodBlockers }) {
  const { t } = useI18n()
  const total = blockers.pendingReview + blockers.unmatched + blockers.unmappedSources + blockers.unflaggedStaff

  if (total === 0) {
    return <span className="text-sm text-muted-foreground">{t("Připraveno k uzavření")}</span>
  }

  const reasons = blockerLines(blockers, t)

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            tabIndex={0}
            className="inline-flex items-center gap-1.5 text-sm text-amber-500 focus:outline-none"
          >
            <CircleAlert className="size-3.5 shrink-0" />
            {t("{n} pol. blokuje", { n: total })}
          </span>
        }
      />
      <TooltipContent className="max-w-xs">
        <span className="block font-medium">{t("Blokuje uzavření:")}</span>
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
