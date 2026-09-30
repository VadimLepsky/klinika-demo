"use client"

import { useState, useTransition, type ReactElement } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createKpiProfile, updateKpiProfile } from "@/app/(app)/settings/kpi/actions"
import {
  KPI_METRICS,
  KPI_METRIC_HINTS,
  KPI_METRIC_LABELS,
  type KpiBandInput,
  type KpiBandInputsByMetric,
  type KpiBandsByMetric,
  type KpiMetric,
} from "@/lib/kpi"
import type { KpiProfile } from "@/lib/queries/kpi"

/** A band row being edited. Numeric fields are kept as free-form text so typing digits never gets zero-padded. */
type EditableBand = { key: string; min: string; max: string; points: string }

let nextKey = 0

function toEditableRows(rows: { min_value: number; max_value: number | null; points: number }[]): EditableBand[] {
  return rows.map((b) => ({
    key: `b${nextKey++}`,
    min: String(b.min_value),
    max: b.max_value != null ? String(b.max_value) : "",
    points: String(b.points),
  }))
}

const DEFAULT_ROWS: Record<KpiMetric, { min: string; max: string; points: string }[]> = {
  showup: [
    { min: "0", max: "55", points: "-0.15" },
    { min: "55", max: "70", points: "-0.10" },
    { min: "70", max: "85", points: "0.00" },
    { min: "85", max: "", points: "0.10" },
  ],
  avg_check: [
    { min: "0", max: "600", points: "-0.10" },
    { min: "600", max: "900", points: "0.00" },
    { min: "900", max: "", points: "0.05" },
  ],
  activity: [
    { min: "", max: "", points: "0.05" },
    { min: "", max: "", points: "0.00" },
    { min: "", max: "", points: "-0.05" },
  ],
}

function defaultEditableState(): Record<KpiMetric, EditableBand[]> {
  return {
    showup: DEFAULT_ROWS.showup.map((r) => ({ key: `b${nextKey++}`, ...r })),
    avg_check: DEFAULT_ROWS.avg_check.map((r) => ({ key: `b${nextKey++}`, ...r })),
    activity: DEFAULT_ROWS.activity.map((r) => ({ key: `b${nextKey++}`, ...r })),
  }
}

function initialEditableState(initialBands?: KpiBandsByMetric): Record<KpiMetric, EditableBand[]> {
  if (!initialBands) return defaultEditableState()
  return {
    showup: toEditableRows(initialBands.showup),
    avg_check: toEditableRows(initialBands.avg_check),
    activity: toEditableRows(initialBands.activity),
  }
}

function parseNum(raw: string): number {
  return Number.parseFloat(raw.replace(",", "."))
}

/** Drops rows whose "od" is empty, then parses the rest to numbers for validation/submission. */
function buildBandInputs(rows: EditableBand[]): KpiBandInput[] {
  return rows
    .filter((r) => r.min.trim() !== "")
    .map((r) => ({
      minValue: parseNum(r.min),
      maxValue: r.max.trim() === "" ? null : parseNum(r.max),
      points: r.points.trim() === "" ? Number.NaN : parseNum(r.points),
    }))
}

function validateMetricRows(rows: KpiBandInput[]): string | null {
  if (rows.length === 0) return null
  const sorted = [...rows].sort((a, b) => a.minValue - b.minValue)
  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i]
    if (!Number.isFinite(b.minValue)) return "Práh „od“ musí být číslo."
    if (!Number.isFinite(b.points)) return "Body musí být číslo."
    if (b.maxValue != null && (!Number.isFinite(b.maxValue) || b.maxValue <= b.minValue)) {
      return "„do“ musí být větší než „od“."
    }
    const next = sorted[i + 1]
    if (next) {
      if (b.maxValue == null) return "Horní mez je nutná pro všechny řádky kromě posledního."
      if (next.minValue < b.maxValue) return "Prahy se nesmí překrývat."
    }
  }
  return null
}

export function KpiProfileEditDialog({
  trigger,
  profile,
  initialBands,
}: {
  trigger: ReactElement
  profile?: KpiProfile
  initialBands?: KpiBandsByMetric
}) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(profile?.name ?? "")
  const [maxBonusPct, setMaxBonusPct] = useState(profile ? String(Math.round(profile.max_bonus * 10000) / 100) : "20")
  const [maxPenaltyPct, setMaxPenaltyPct] = useState(
    profile ? String(Math.round(profile.max_penalty * 10000) / 100) : "30",
  )
  const [minSample, setMinSample] = useState(profile ? String(profile.min_sample) : "10")
  const [bands, setBands] = useState<Record<KpiMetric, EditableBand[]>>(() => initialEditableState(initialBands))
  const [errors, setErrors] = useState<Record<KpiMetric, string | null>>({ showup: null, avg_check: null, activity: null })
  const [pending, startTransition] = useTransition()

  const reset = () => {
    setName(profile?.name ?? "")
    setMaxBonusPct(profile ? String(Math.round(profile.max_bonus * 10000) / 100) : "20")
    setMaxPenaltyPct(profile ? String(Math.round(profile.max_penalty * 10000) / 100) : "30")
    setMinSample(profile ? String(profile.min_sample) : "10")
    setBands(initialEditableState(initialBands))
    setErrors({ showup: null, avg_check: null, activity: null })
  }

  const updateRow = (metric: KpiMetric, key: string, patch: Partial<EditableBand>) => {
    setBands((prev) => ({ ...prev, [metric]: prev[metric].map((r) => (r.key === key ? { ...r, ...patch } : r)) }))
  }
  const removeRow = (metric: KpiMetric, key: string) => {
    setBands((prev) => ({ ...prev, [metric]: prev[metric].filter((r) => r.key !== key) }))
  }
  const addRow = (metric: KpiMetric) => {
    setBands((prev) => ({ ...prev, [metric]: [...prev[metric], { key: `b${nextKey++}`, min: "", max: "", points: "" }] }))
  }

  const maxBonusFrac = Number.isFinite(parseNum(maxBonusPct)) ? parseNum(maxBonusPct) / 100 : 0
  const maxPenaltyFrac = Number.isFinite(parseNum(maxPenaltyPct)) ? parseNum(maxPenaltyPct) / 100 : 0

  const submit = () => {
    const maxBonus = parseNum(maxBonusPct) / 100
    const maxPenalty = parseNum(maxPenaltyPct) / 100
    const minSampleNum = Number.parseInt(minSample, 10)

    if (!name.trim()) {
      toast.error("Zadejte název.")
      return
    }
    if (!Number.isFinite(maxBonus) || maxBonus < 0 || maxBonus > 1.5) {
      toast.error("Neplatný maximální bonus.")
      return
    }
    if (!Number.isFinite(maxPenalty) || maxPenalty < 0 || maxPenalty > 1) {
      toast.error("Neplatný maximální postih.")
      return
    }
    if (!Number.isInteger(minSampleNum) || minSampleNum < 0) {
      toast.error("Neplatný minimální počet doporučení.")
      return
    }

    const payload = {} as KpiBandInputsByMetric
    const newErrors: Record<KpiMetric, string | null> = { showup: null, avg_check: null, activity: null }
    let hasError = false
    for (const metric of KPI_METRICS) {
      const parsed = buildBandInputs(bands[metric])
      const err = validateMetricRows(parsed)
      newErrors[metric] = err
      if (err) hasError = true
      payload[metric] = parsed
    }
    setErrors(newErrors)
    if (hasError) return

    startTransition(async () => {
      const res = profile
        ? await updateKpiProfile(profile.id, name, maxBonus, maxPenalty, minSampleNum, payload)
        : await createKpiProfile(name, maxBonus, maxPenalty, minSampleNum, payload)
      if (res.ok) {
        toast.success(profile ? "Profil byl aktualizován." : "Profil byl vytvořen.")
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
        if (v) reset()
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{profile ? "Upravit KPI profil" : "Nový KPI profil"}</DialogTitle>
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
              <FieldLabel htmlFor="kpi-profile-name">Název</FieldLabel>
              <Input
                id="kpi-profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
                maxLength={100}
                autoFocus
              />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel htmlFor="kpi-max-bonus">Max. bonus, %</FieldLabel>
                <Input
                  id="kpi-max-bonus"
                  inputMode="decimal"
                  value={maxBonusPct}
                  onChange={(e) => setMaxBonusPct(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  disabled={pending}
                  className="tabular-nums"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kpi-max-penalty">Max. postih, %</FieldLabel>
                <Input
                  id="kpi-max-penalty"
                  inputMode="decimal"
                  value={maxPenaltyPct}
                  onChange={(e) => setMaxPenaltyPct(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  disabled={pending}
                  className="tabular-nums"
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="kpi-min-sample">Min. doporučení</FieldLabel>
                <Input
                  id="kpi-min-sample"
                  inputMode="numeric"
                  value={minSample}
                  onChange={(e) => setMinSample(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  disabled={pending}
                  className="tabular-nums"
                />
                <FieldDescription>Méně — koeficient 0,50</FieldDescription>
              </Field>
            </div>
          </FieldGroup>

          <div className="flex flex-col gap-5">
            {KPI_METRICS.map((metric) => (
              <div key={metric} className="flex flex-col gap-2 rounded-lg border border-border p-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-sm font-medium text-foreground">{KPI_METRIC_LABELS[metric]}</span>
                    <p className="text-xs text-muted-foreground">{KPI_METRIC_HINTS[metric]}</p>
                  </div>
                  <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => addRow(metric)}>
                    <Plus data-icon="inline-start" />
                    Přidat řádek
                  </Button>
                </div>

                <div className="flex flex-col gap-2">
                  {bands[metric].map((row) => (
                    <div key={row.key} className="flex items-center gap-2">
                      <Input
                        placeholder="od"
                        inputMode="decimal"
                        value={row.min}
                        disabled={pending}
                        onChange={(e) => updateRow(metric, row.key, { min: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="w-20 tabular-nums"
                        aria-label="Od"
                      />
                      <span className="text-sm text-muted-foreground">–</span>
                      <Input
                        placeholder="bez limitu"
                        inputMode="decimal"
                        value={row.max}
                        disabled={pending}
                        onChange={(e) => updateRow(metric, row.key, { max: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="w-24 tabular-nums"
                        aria-label="Do"
                      />
                      <Input
                        placeholder="body"
                        inputMode="decimal"
                        value={row.points}
                        disabled={pending}
                        onChange={(e) => updateRow(metric, row.key, { points: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="w-24 tabular-nums"
                        aria-label="Body"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={pending}
                        onClick={() => removeRow(metric, row.key)}
                        aria-label="Smazat řádek"
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  ))}
                  {bands[metric].length === 0 ? <p className="text-sm text-muted-foreground">Žádné řádky.</p> : null}
                </div>
                {errors[metric] ? <p className="text-sm text-destructive">{errors[metric]}</p> : null}
              </div>
            ))}
            <p className="text-xs text-muted-foreground">
              {`K = 1 + součet bodů, v rozmezí od ${(1 - maxPenaltyFrac).toFixed(2)} do ${(1 + maxBonusFrac).toFixed(2)}. Násobí se pouze provize ze zdrojových pravidel; stěry beze změny.`}
            </p>
          </div>

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="ghost">Zrušit</Button>} />
            <Button type="submit" disabled={pending || !name.trim()}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {profile ? "Uložit" : "Vytvořit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
