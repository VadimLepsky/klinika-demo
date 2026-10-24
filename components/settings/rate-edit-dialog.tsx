"use client"

import { useState, useTransition } from "react"
import { Pencil, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateRate } from "@/app/(app)/settings/actions"
import { nextMonthValue, monthInputToDate } from "@/lib/format"
import { useI18n } from "@/lib/i18n/client"

export function RateEditDialog({
  bucket,
  label,
  currentRate,
}: {
  bucket: string
  label: string
  currentRate: number | null
}) {
  const { t, formatRate } = useI18n()
  const [open, setOpen] = useState(false)
  const [ratePct, setRatePct] = useState(currentRate != null ? String(currentRate * 100) : "")
  const [month, setMonth] = useState(nextMonthValue())
  const [pending, startTransition] = useTransition()

  const save = () => {
    const pct = Number.parseFloat(ratePct.replace(",", "."))
    if (!Number.isFinite(pct)) {
      toast.error(t("Zadejte platnou sazbu."))
      return
    }
    startTransition(async () => {
      const res = await updateRate(bucket, pct, monthInputToDate(month))
      if (res.ok) {
        toast.success(t("Sazba pro «{name}» byla aktualizována.", { name: t(label) }))
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil data-icon="inline-start" />
            {t("Změnit sazbu")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Sazba: {name}", { name: t(label) })}</DialogTitle>
          <DialogDescription>
            {t("Aktuální sazba: {rate}.", { rate: currentRate != null ? formatRate(currentRate) : t("není nastavena") })}{" "}
            {t("Nová sazba vytvoří novou verzi — dřívější období se nemění.")}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="rate">{t("Nová sazba, %")}</Label>
            <Input
              id="rate"
              inputMode="decimal"
              value={ratePct}
              onChange={(e) => setRatePct(e.target.value)}
              placeholder={t("např. 7")}
              disabled={pending}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="valid-from">{t("Platí od")}</Label>
            <Input
              id="valid-from"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={pending}
            />
          </div>
          <Alert>
            <TriangleAlert />
            <AlertDescription>
              {t("Změna se nedotkne uzavřených měsíců.")}
            </AlertDescription>
          </Alert>
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">{t("Zrušit")}</Button>} />
          <Button onClick={save} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {t("Uložit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
