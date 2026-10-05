"use client"

import { useEffect, useState, useTransition } from "react"
import { Gauge, Trash2, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { assignDoctorKpiProfile, deleteDoctorKpiAssignment } from "@/app/(app)/settings/kpi/actions"
import { formatMonth, monthInputToDate } from "@/lib/format"
import type { DoctorKpiBadge, DoctorKpiHistoryRow, MonthOption } from "@/lib/queries/kpi"
import type { KpiProfile } from "@/lib/queries/kpi"

const NONE_VALUE = "none"

export function DoctorKpiDialog({
  masterId,
  doctorName,
  profiles,
  current,
  history,
  defaultMonth,
  monthOptions,
}: {
  masterId: string
  doctorName: string
  profiles: KpiProfile[]
  current: DoctorKpiBadge | undefined
  history: DoctorKpiHistoryRow[]
  defaultMonth: string
  monthOptions: MonthOption[]
}) {
  const [open, setOpen] = useState(false)
  const [profileId, setProfileId] = useState(current?.profile_id ?? NONE_VALUE)
  const [month, setMonth] = useState(defaultMonth)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      setProfileId(current?.profile_id ?? NONE_VALUE)
      setMonth(
        monthOptions.some((o) => o.value === defaultMonth) ? defaultMonth : monthOptions.at(-1)?.value ?? defaultMonth,
      )
      setError(null)
    }
  }, [open, current, defaultMonth, monthOptions])

  const profileItems: Record<string, string> = { [NONE_VALUE]: "Bez KPI" }
  for (const p of profiles) profileItems[p.id] = p.name

  const monthItems: Record<string, string> = {}
  for (const o of monthOptions) monthItems[o.value] = o.label

  const save = () => {
    setError(null)
    startTransition(async () => {
      const res = await assignDoctorKpiProfile(
        masterId,
        profileId === NONE_VALUE ? null : profileId,
        monthInputToDate(month),
      )
      if (res.ok) {
        toast.success("KPI profil byl aktualizován.", {
          description: "Změny se projeví při dalším přepočtu měsíce.",
        })
        setOpen(false)
      } else {
        setError(res.error)
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteDoctorKpiAssignment(masterId, id)
      if (res.ok) {
        toast.success("Záznam historie byl smazán.")
      } else {
        toast.error(res.error)
      }
    })
  }

  const currentLabel = current?.profile_name ?? "Bez KPI"

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <button type="button" className="cursor-pointer">
            {current?.profile_id ? (
              <Badge variant="secondary" className="gap-1">
                <Gauge className="size-3" />
                {currentLabel}
              </Badge>
            ) : (
              <Badge variant="outline" className="gap-1 text-muted-foreground">
                <Gauge className="size-3" />
                Bez KPI
              </Badge>
            )}
          </button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>KPI: {doctorName}</DialogTitle>
          <DialogDescription>Upravuje provizi za žádanky koeficientem K od zvoleného měsíce.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="doctor-kpi-profile">Profil</Label>
            <Select
              value={profileId}
              onValueChange={(v) => {
                if (v) {
                  setProfileId(v)
                  setError(null)
                }
              }}
              disabled={pending}
              items={profileItems}
            >
              <SelectTrigger id="doctor-kpi-profile" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value={NONE_VALUE}>Bez KPI</SelectItem>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="doctor-kpi-valid-from">Platí od</Label>
            <Select
              value={month}
              onValueChange={(v) => {
                if (v) {
                  setMonth(v)
                  setError(null)
                }
              }}
              disabled={pending}
              items={monthItems}
            >
              <SelectTrigger id="doctor-kpi-valid-from" className="w-full sm:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {monthOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Alert>
            <TriangleAlert />
            <AlertDescription>Zmrazené měsíce nejsou dostupné k výběru.</AlertDescription>
          </Alert>

          {history.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">Historie</span>
              <ul className="flex flex-col gap-1 text-sm text-muted-foreground">
                {history.map((h, i) => {
                  const monthValue = h.valid_from.slice(0, 7)
                  const canDelete = i === 0 && h.valid_to === null && monthOptions.some((o) => o.value === monthValue)
                  return (
                    <li key={h.id} className="flex items-center justify-between gap-2">
                      <span>
                        {h.profile_name ?? "Bez KPI"} · {formatMonth(h.valid_from)} –{" "}
                        {h.valid_to ? formatMonth(h.valid_to) : "dosud"}
                      </span>
                      {canDelete ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(h.id)}
                          disabled={pending}
                          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive disabled:opacity-50"
                          aria-label="Smazat poslední záznam historie"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          ) : null}
        </div>

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
