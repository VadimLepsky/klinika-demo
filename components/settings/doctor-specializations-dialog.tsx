"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldGroup, FieldLabel, FieldLegend, FieldSet } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { SpecializationBadges } from "@/components/specializations/specialization-badges"
import { saveDoctorSpecializations } from "@/app/(app)/settings/specializations/actions"
import type { DoctorSpecializations, Specialization } from "@/lib/queries/specializations"

const NO_PRIMARY = "none"

function activeIdOrNull(spec: Specialization | null | undefined): string | null {
  return spec?.active ? spec.id : null
}

export function DoctorSpecializationsDialog({
  masterId,
  doctorName,
  specs,
  options,
}: {
  masterId: string
  doctorName: string
  specs: DoctorSpecializations | undefined
  options: Specialization[]
}) {
  const initialPrimary = activeIdOrNull(specs?.primary) ?? NO_PRIMARY
  const initialAdditional = (specs?.additional ?? []).filter((s) => s.active).map((s) => s.id)

  const [open, setOpen] = useState(false)
  const [primary, setPrimary] = useState(initialPrimary)
  const [additional, setAdditional] = useState<string[]>(initialAdditional)
  const [pending, startTransition] = useTransition()

  const primaryItems: Record<string, string> = {
    [NO_PRIMARY]: "Bez hlavní",
    ...Object.fromEntries(options.map((o) => [o.id, o.name])),
  }
  const additionalOptions = options.filter((o) => o.id !== primary)

  const toggleAdditional = (id: string, checked: boolean) =>
    setAdditional((prev) => (checked ? [...prev, id] : prev.filter((x) => x !== id)))

  const save = () => {
    const primaryId = primary === NO_PRIMARY ? null : primary
    startTransition(async () => {
      const res = await saveDoctorSpecializations(
        masterId,
        primaryId,
        additional.filter((id) => id !== primaryId),
      )
      if (res.ok) {
        toast.success(`Specializace «${doctorName}» byly uloženy.`)
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
        if (v) {
          setPrimary(initialPrimary)
          setAdditional(initialAdditional)
        }
      }}
    >
      <DialogTrigger
        render={
          <button
            type="button"
            className="flex min-h-8 w-full items-center rounded-md px-1 text-left hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Specializace: ${doctorName}`}
          >
            <SpecializationBadges specs={specs} emptyLabel="Neuvedeno" />
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Specializace</DialogTitle>
          <DialogDescription>{doctorName}</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor={`primary-spec-${masterId}`}>Hlavní</FieldLabel>
            <Select
              value={primary}
              onValueChange={(v) => {
                const next = (v as string | null) ?? NO_PRIMARY
                setPrimary(next)
                setAdditional((prev) => prev.filter((id) => id !== next))
              }}
              disabled={pending}
              items={primaryItems}
            >
              <SelectTrigger id={`primary-spec-${masterId}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={NO_PRIMARY}>Bez hlavní</SelectItem>
                  {options.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <FieldSet>
            <FieldLegend variant="label">Další</FieldLegend>
            {additionalOptions.length > 0 ? (
              <div className="flex max-h-56 flex-col gap-2 overflow-y-auto rounded-md border border-border p-3">
                {additionalOptions.map((o) => {
                  const id = `additional-spec-${masterId}-${o.id}`
                  return (
                    <div key={o.id} className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={additional.includes(o.id)}
                        onCheckedChange={(checked) => toggleAdditional(o.id, checked === true)}
                        disabled={pending}
                      />
                      <Label htmlFor={id} className="font-normal">
                        {o.name}
                      </Label>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Žádné aktivní specializace.</p>
            )}
          </FieldSet>
        </FieldGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Zrušit</Button>} />
          <Button onClick={save} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Uložit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
