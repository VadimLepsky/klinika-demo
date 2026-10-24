"use client"

import { useState, useTransition, type ReactElement } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { deleteSpecialization, setSpecializationActive } from "@/app/(app)/settings/specializations/actions"
import { SpecializationEditDialog } from "@/components/settings/specialization-edit-dialog"
import { getBandRangeLabel, getBandSwatchClassName, type CoefficientBand } from "@/lib/coefficient"
import type { SpecializationWithCount } from "@/lib/queries/specializations"
import { useI18n } from "@/lib/i18n/client"

const ASSIGNED_TOOLTIP = "Nejprve specializaci odeberte lékařům nebo ji deaktivujte."

function BandsPreview({ bands }: { bands: CoefficientBand[] }) {
  const { t } = useI18n()
  if (bands.length === 0) return <span className="text-sm text-muted-foreground">{t("Výchozí")}</span>
  const sorted = [...bands].sort((a, b) => a.min_pct - b.min_pct)
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <div className="flex h-2 w-24 cursor-help overflow-hidden rounded-full border border-border">
            {sorted.map((b, i) => {
              const next = sorted[i + 1]
              const width = (next ? next.min_pct : 100) - b.min_pct
              return (
                <div key={i} className={getBandSwatchClassName(b.color)} style={{ width: `${Math.max(width, 0)}%` }} />
              )
            })}
          </div>
        }
      />
      <TooltipContent>
        <div className="flex flex-col gap-1">
          {sorted.map((b, i) => (
            <span key={i}>{getBandRangeLabel(b, sorted, t)}</span>
          ))}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}

export function SpecializationNameDialog({
  trigger,
  title,
  initialName = "",
  onSubmit,
  successMessage,
}: {
  trigger: ReactElement
  title: string
  initialName?: string
  onSubmit: (name: string) => Promise<{ ok: true } | { ok: false; error: string }>
  successMessage: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [pending, startTransition] = useTransition()

  const submit = () => {
    startTransition(async () => {
      const res = await onSubmit(name)
      if (res.ok) {
        toast.success(successMessage)
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) setName(initialName)
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
          className="flex flex-col gap-6"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="specialization-name">{t("Název")}</FieldLabel>
              <Input
                id="specialization-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
                maxLength={100}
                autoFocus
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost">{t("Zrušit")}</Button>} />
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {t("Uložit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

function DeleteButton({ spec }: { spec: SpecializationWithCount }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  const assigned = spec.doctor_count > 0

  if (assigned) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span tabIndex={0} className="inline-flex">
              <Button variant="outline" size="sm" disabled className="pointer-events-none">
                <Trash2 data-icon="inline-start" />
                {t("Smazat")}
              </Button>
            </span>
          }
        />
        <TooltipContent>{t(ASSIGNED_TOOLTIP)}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
            {t("Smazat")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Smazat specializaci «{name}»?", { name: t(spec.name) })}</AlertDialogTitle>
          <AlertDialogDescription>{t("Tuto akci nelze vrátit zpět.")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Zrušit")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                const res = await deleteSpecialization(spec.id)
                if (res.ok) toast.success(t("Specializace «{name}» byla smazána.", { name: t(spec.name) }))
                else toast.error(res.error)
              })
            }
          >
            {t("Smazat")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ToggleActiveButton({ spec }: { spec: SpecializationWithCount }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setSpecializationActive(spec.id, !spec.active)
          if (res.ok)
            toast.success(spec.active ? t("Specializace byla deaktivována.") : t("Specializace byla aktivována."))
          else toast.error(res.error)
        })
      }
    >
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {spec.active ? t("Deaktivovat") : t("Aktivovat")}
    </Button>
  )
}

export function SpecializationsTable({
  specializations,
  bandsBySpecialization,
}: {
  specializations: SpecializationWithCount[]
  bandsBySpecialization: Map<string, CoefficientBand[]>
}) {
  const { t } = useI18n()
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="w-full min-w-[820px]">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">{t("Název")}</TableHead>
            <TableHead className="w-[100px] text-right">{t("Lékařů")}</TableHead>
            <TableHead className="w-[140px]">{t("Stav")}</TableHead>
            <TableHead className="w-[140px]">{t("Prahy")}</TableHead>
            <TableHead className="w-[300px] pr-4 text-right">{t("Akce")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {specializations.length > 0 ? (
            specializations.map((s) => {
              const bands = bandsBySpecialization.get(s.id) ?? []
              return (
                <TableRow key={s.id}>
                  <TableCell className="pl-4 font-medium text-foreground">{t(s.name)}</TableCell>
                  <TableCell className="text-right tabular-nums">{s.doctor_count}</TableCell>
                  <TableCell>
                    {s.active ? (
                      <Badge variant="secondary">{t("Aktivní")}</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground">
                        {t("Neaktivní")}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <BandsPreview bands={bands} />
                  </TableCell>
                  <TableCell className="pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <SpecializationEditDialog
                        specId={s.id}
                        initialName={s.name}
                        initialBands={bands}
                        trigger={
                          <Button variant="outline" size="sm">
                            <Pencil data-icon="inline-start" />
                            {t("Upravit")}
                          </Button>
                        }
                      />
                      <ToggleActiveButton spec={s} />
                      <DeleteButton spec={s} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                {t("Zatím žádná specializace.")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
