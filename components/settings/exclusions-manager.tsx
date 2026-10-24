"use client"

import { useState, useTransition } from "react"
import { Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Field, FieldGroup } from "@/components/ui/field"
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
import { addServiceExclusion, endServiceExclusion } from "@/app/(app)/settings/actions"
import { nextMonthValue, monthInputToDate } from "@/lib/format"
import { useI18n } from "@/lib/i18n/client"
import type { ServiceExclusionRow } from "@/lib/queries/settings"

function AddExclusionDialog() {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [serviceId, setServiceId] = useState("")
  const [reason, setReason] = useState("")
  const [month, setMonth] = useState(nextMonthValue())
  const [pending, startTransition] = useTransition()

  const save = () => {
    if (!serviceId.trim()) {
      toast.error(t("Zadejte ID služby."))
      return
    }
    startTransition(async () => {
      const res = await addServiceExclusion(serviceId.trim(), reason.trim(), monthInputToDate(month))
      if (res.ok) {
        toast.success(t("Výjimka byla přidána."))
        setOpen(false)
        setServiceId("")
        setReason("")
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button size="sm">
            <Plus data-icon="inline-start" />
            {t("Přidat výjimku")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Nová výjimka služby")}</DialogTitle>
          <DialogDescription>
            {t("Služba se od zvoleného měsíce nebude započítávat do provizí.")}
          </DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <Label htmlFor="service-id">{t("ID služby")}</Label>
            <Input
              id="service-id"
              inputMode="numeric"
              value={serviceId}
              onChange={(e) => setServiceId(e.target.value)}
              placeholder={t("např. 10432")}
              disabled={pending}
            />
          </Field>
          <Field>
            <Label htmlFor="reason">{t("Důvod")}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("např. EKG provádí sám lékař")}
              disabled={pending}
            />
          </Field>
          <Field>
            <Label htmlFor="excl-from">{t("Platí od")}</Label>
            <Input
              id="excl-from"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={pending}
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">{t("Zrušit")}</Button>} />
          <Button onClick={save} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {t("Přidat")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ExclusionRowItem({ row }: { row: ServiceExclusionRow }) {
  const { t, formatDate } = useI18n()
  const [pending, startTransition] = useTransition()
  const active = row.valid_to === null

  const end = () => {
    startTransition(async () => {
      const res = await endServiceExclusion(row.id)
      if (res.ok) toast.success(t("Výjimka byla ukončena."))
      else toast.error(res.error)
    })
  }

  return (
    <TableRow>
      <TableCell
        className="max-w-0 truncate pl-4 font-medium text-foreground"
        title={t(row.service_name)}
      >
        {t(row.service_name)}
      </TableCell>
      <TableCell className="max-w-0 truncate text-muted-foreground" title={row.reason ? t(row.reason) : undefined}>
        {row.reason ? t(row.reason) : "—"}
      </TableCell>
      <TableCell className="whitespace-nowrap text-muted-foreground">
        {formatDate(row.valid_from)}
      </TableCell>
      <TableCell className="whitespace-nowrap">
        {active ? (
          <Badge>{t("platná")}</Badge>
        ) : (
          <Badge variant="outline">{t("do {date}", { date: formatDate(row.valid_to) })}</Badge>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap text-right pr-4">
        {active ? (
          <Button size="sm" variant="outline" onClick={end} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <X data-icon="inline-start" />}
            {t("Ukončit")}
          </Button>
        ) : null}
      </TableCell>
    </TableRow>
  )
}

export function ExclusionsManager({ rows }: { rows: ServiceExclusionRow[] }) {
  const { t } = useI18n()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm text-muted-foreground">
          {t("Služby záměrně vyloučené z provizí (např. ty, které provádí sám lékař).")}
        </p>
        <AddExclusionDialog />
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="table-fixed w-full min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t("Služba")}</TableHead>
              <TableHead className="w-[220px]">{t("Důvod")}</TableHead>
              <TableHead className="w-[120px]">{t("Platí od")}</TableHead>
              <TableHead className="w-[140px]">{t("Stav")}</TableHead>
              <TableHead className="w-[130px] text-right pr-4">{t("Akce")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length > 0 ? (
              rows.map((r) => <ExclusionRowItem key={r.id} row={r} />)
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("Žádné výjimky.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
