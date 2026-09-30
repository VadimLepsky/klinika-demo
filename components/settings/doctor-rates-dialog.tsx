"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { SlidersHorizontal, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
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
import { saveDoctorBucketRates } from "@/app/(app)/settings/actions"
import { formatRate, monthInputToDate } from "@/lib/format"
import type { DoctorRateOverride } from "@/lib/queries/settings"

export type DoctorRateRule = { bucket: string; label: string; generalRate: number | null }

type RowState = { enabled: boolean; pct: string }

/** 0.05 -> "5" (clean, no floating-point noise). */
function ratePct(rate: number): string {
  return String(Math.round(rate * 10000) / 100)
}

function initialState(
  rules: DoctorRateRule[],
  overrides: Record<string, DoctorRateOverride>,
): Record<string, RowState> {
  const out: Record<string, RowState> = {}
  for (const rule of rules) {
    const o = overrides[rule.bucket]
    if (!o) {
      out[rule.bucket] = { enabled: true, pct: "" }
    } else if (!o.enabled) {
      out[rule.bucket] = { enabled: false, pct: "" }
    } else {
      out[rule.bucket] = { enabled: true, pct: o.rate != null ? ratePct(o.rate) : "" }
    }
  }
  return out
}

export function DoctorRatesDialog({
  masterId,
  doctorName,
  rules,
  overrides,
  defaultMonth,
  minMonth,
}: {
  masterId: string
  doctorName: string
  rules: DoctorRateRule[]
  overrides: Record<string, DoctorRateOverride>
  defaultMonth: string
  minMonth: string
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<Record<string, RowState>>(() => initialState(rules, overrides))
  const [month, setMonth] = useState(defaultMonth)
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (open) {
      setState(initialState(rules, overrides))
      setMonth(defaultMonth)
    }
  }, [open, rules, overrides, defaultMonth])

  const setEnabled = (bucket: string, enabled: boolean) =>
    setState((s) => ({ ...s, [bucket]: { ...s[bucket], enabled } }))
  const setPct = (bucket: string, pct: string) =>
    setState((s) => ({ ...s, [bucket]: { ...s[bucket], pct } }))

  const save = () => {
    const payload: { bucket: string; enabled: boolean; ratePct: number | null }[] = []
    for (const rule of rules) {
      const row = state[rule.bucket]
      let ratePctValue: number | null = null
      if (row.enabled && row.pct.trim() !== "") {
        const pct = Number.parseFloat(row.pct.replace(",", "."))
        if (!Number.isFinite(pct) || pct < 0 || pct > 100) {
          toast.error(`«${rule.label}»: neplatná sazba.`)
          return
        }
        ratePctValue = pct
      }
      payload.push({ bucket: rule.bucket, enabled: row.enabled, ratePct: ratePctValue })
    }

    startTransition(async () => {
      const res = await saveDoctorBucketRates(masterId, monthInputToDate(month), payload)
      if (res.ok) {
        toast.success("Sazby byly uloženy.", {
          description: "Změny se projeví při dalším přepočtu měsíce.",
        })
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  const rows = useMemo(() => rules, [rules])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <SlidersHorizontal data-icon="inline-start" />
            Sazby
          </Button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sazby: {doctorName}</DialogTitle>
          <DialogDescription>
            Osobní sazby podle pravidel. Prázdné pole znamená obecnou sazbu pravidla.
          </DialogDescription>
        </DialogHeader>

        <div className="-mx-6 max-h-[52vh] overflow-y-auto px-6 py-1">
          <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 sm:grid-cols-[1fr_auto_auto_auto]">
            <div className="hidden text-xs font-medium text-muted-foreground sm:block">Pravidlo</div>
            <div className="hidden text-right text-xs font-medium text-muted-foreground sm:block">
              Obecná
            </div>
            <div className="hidden text-center text-xs font-medium text-muted-foreground sm:block">
              Načítat
            </div>
            <div className="hidden text-right text-xs font-medium text-muted-foreground sm:block">
              Osobní, %
            </div>

            {rows.map((rule) => {
              const row = state[rule.bucket]
              if (!row) return null
              return (
                <div key={rule.bucket} className="contents">
                  <div className="col-span-2 mt-3 border-t border-border pt-3 sm:col-span-4 sm:hidden" />
                  <div className="min-w-0 truncate font-medium text-foreground" title={rule.label}>
                    {rule.label}
                  </div>
                  <div className="whitespace-nowrap text-right text-sm tabular-nums text-muted-foreground">
                    {rule.generalRate != null ? formatRate(rule.generalRate) : "—"}
                  </div>
                  <div className="flex justify-center">
                    <Switch
                      checked={row.enabled}
                      onCheckedChange={(v) => setEnabled(rule.bucket, v)}
                      disabled={pending}
                      aria-label={`Načítat podle pravidla «${rule.label}»`}
                    />
                  </div>
                  <div className="flex justify-end">
                    <Input
                      inputMode="decimal"
                      value={row.pct}
                      onChange={(e) => setPct(rule.bucket, e.target.value)}
                      placeholder={rule.generalRate != null ? ratePct(rule.generalRate) : "—"}
                      disabled={pending || !row.enabled}
                      className="w-24 text-right tabular-nums"
                      aria-label={`Osobní sazba podle pravidla «${rule.label}»`}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="doctor-rate-valid-from">Platí od</Label>
          <Input
            id="doctor-rate-valid-from"
            type="month"
            value={month}
            min={minMonth}
            onChange={(e) => setMonth(e.target.value)}
            disabled={pending}
            className="w-full sm:w-56"
          />
        </div>

        <Alert>
          <TriangleAlert />
          <AlertDescription>Zmrazené měsíce nejsou dostupné k výběru.</AlertDescription>
        </Alert>

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
