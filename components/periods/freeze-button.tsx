"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { Lock, Snowflake } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { freezePeriod } from "@/app/(app)/periods/actions"
import { blockerLines } from "@/components/periods/blocker-summary"
import { useI18n } from "@/lib/i18n/client"
import type { PeriodBlockers } from "@/lib/queries/periods"

export function FreezeButton({
  period,
  status,
  canFreeze,
  blockers,
}: {
  period: string
  status: string
  canFreeze: boolean
  blockers: PeriodBlockers
}) {
  const { t, formatMonth } = useI18n()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  if (status === "frozen") {
    return (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Lock className="size-3.5" />
        {t("Uzavřeno")}
      </span>
    )
  }

  const reasons = blockerLines(blockers, t)

  const confirm = () => {
    startTransition(async () => {
      const res = await freezePeriod(period)
      if (res.ok) {
        toast.success(t("{month} bylo uzavřeno.", { month: formatMonth(period) }))
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  if (!canFreeze) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span tabIndex={0} className="inline-block">
              <Button size="sm" variant="outline" disabled>
                <Snowflake data-icon="inline-start" />
                {t("Uzavřít")}
              </Button>
            </span>
          }
        />
        <TooltipContent className="max-w-xs">
          <span className="block font-medium">{t("Uzavření není možné:")}</span>
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

  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <Snowflake data-icon="inline-start" />
        {t("Uzavřít")}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Uzavřít {month}?", { month: formatMonth(period) })}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("Měsíc bude uzamčen. Přepočet už nebude možný.")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("Zrušit")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {t("Uzavřít")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
