"use client"

import { useState, useTransition, type ReactElement } from "react"
import { Plus, RotateCcw, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { updateSpecialization } from "@/app/(app)/settings/specializations/actions"
import {
  BAND_COLOR_LABELS,
  BAND_COLORS,
  DEFAULT_COEFFICIENT_BANDS,
  getBandSwatchClassName,
  type BandColor,
  type CoefficientBand,
} from "@/lib/coefficient"
import { useI18n } from "@/lib/i18n/client"
import { cn } from "@/lib/utils"

/** A band row being edited. `minPct` is kept as free-form text so typing digits never gets zero-padded. */
type EditableBand = { key: string; minPct: string; color: BandColor }

let nextKey = 0
function toEditable(bands: CoefficientBand[]): EditableBand[] {
  return [...bands]
    .sort((a, b) => a.min_pct - b.min_pct)
    .map((b) => ({ key: `b${nextKey++}`, minPct: String(b.min_pct), color: b.color }))
}

export function SpecializationEditDialog({
  trigger,
  specId,
  initialName,
  initialBands,
}: {
  trigger: ReactElement
  specId: string
  initialName: string
  initialBands: CoefficientBand[]
}) {
  const { t } = useI18n()
  const colorItems = Object.fromEntries(BAND_COLORS.map((c) => [c, t(BAND_COLOR_LABELS[c])]))
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(initialName)
  const [bands, setBands] = useState<EditableBand[]>(() => toEditable(initialBands))
  const [pending, startTransition] = useTransition()

  const reset = () => {
    setName(initialName)
    setBands(toEditable(initialBands))
  }

  const updateBand = (key: string, patch: Partial<EditableBand>) => {
    setBands((prev) => prev.map((b) => (b.key === key ? { ...b, ...patch } : b)))
  }

  const removeBand = (key: string) => {
    setBands((prev) => prev.filter((b) => b.key !== key))
  }

  const addBand = () => {
    setBands((prev) => [...prev, { key: `b${nextKey++}`, minPct: "", color: "grey" }])
  }

  // Preview bar only: parse for display, treating an empty/invalid draft as 0 so it doesn't collapse the bar.
  const previewBands = bands.map((b, i) => ({
    key: b.key,
    min_pct: i === 0 ? 0 : Number(b.minPct) || 0,
    color: b.color,
  }))
  const sortedPreview = [...previewBands].sort((a, b) => a.min_pct - b.min_pct)

  const submit = () => {
    if (bands.length > 0) {
      for (let i = 1; i < bands.length; i++) {
        const value = Number(bands[i].minPct)
        if (bands[i].minPct.trim() === "" || !Number.isFinite(value) || value <= 0 || value > 100) {
          toast.error(t("Práh musí být číslo větší než 0."))
          return
        }
      }
      const values = bands.map((b, i) => (i === 0 ? 0 : Number(b.minPct)))
      if (new Set(values).size !== values.length) {
        toast.error(t("Prahy musí být jedinečné."))
        return
      }
    }

    const payload: CoefficientBand[] = bands
      .map((b, i) => ({ min_pct: i === 0 ? 0 : Number(b.minPct), color: b.color }))
      .sort((a, b) => a.min_pct - b.min_pct)

    startTransition(async () => {
      const res = await updateSpecialization(specId, name, payload)
      if (res.ok) {
        toast.success(t("Specializace byla aktualizována."))
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("Upravit specializaci")}</DialogTitle>
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
              <FieldLabel htmlFor="specialization-edit-name">{t("Název")}</FieldLabel>
              <Input
                id="specialization-edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={pending}
                maxLength={100}
                autoFocus
              />
            </Field>
          </FieldGroup>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">{t("Prahy koeficientu")}</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => setBands(toEditable(DEFAULT_COEFFICIENT_BANDS))}
                >
                  <RotateCcw data-icon="inline-start" />
                  {t("Výchozí")}
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={pending} onClick={addBand}>
                  <Plus data-icon="inline-start" />
                  {t("Přidat práh")}
                </Button>
              </div>
            </div>

            {bands.length > 0 ? (
              <div className="flex h-2 overflow-hidden rounded-full border border-border">
                {sortedPreview.map((b, i) => {
                  const next = sortedPreview[i + 1]
                  const width = (next ? next.min_pct : 100) - b.min_pct
                  return (
                    <div
                      key={b.key}
                      className={getBandSwatchClassName(b.color)}
                      style={{ width: `${Math.max(width, 0)}%` }}
                      title={`${b.min_pct}%+`}
                    />
                  )
                })}
              </div>
            ) : null}

            <div className="flex flex-col gap-2">
              {bands.map((b, i) => (
                <div key={b.key} className="flex items-center gap-2">
                  <div className="flex w-[92px] shrink-0 items-center gap-1">
                    {i === 0 ? (
                      <Input value="0" disabled className="tabular-nums" aria-label={t("Práh, %")} />
                    ) : (
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={100}
                        value={b.minPct}
                        disabled={pending}
                        onChange={(e) => updateBand(b.key, { minPct: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        className="tabular-nums"
                        aria-label={t("Práh, %")}
                      />
                    )}
                    <span className="text-sm text-muted-foreground">%</span>
                  </div>
                  <Select
                    value={b.color}
                    onValueChange={(value) => value && updateBand(b.key, { color: value as BandColor })}
                    disabled={pending}
                    items={colorItems}
                  >
                    <SelectTrigger className="w-[140px] shrink-0" aria-label={t("Barva")}>
                      <span className="flex items-center gap-2">
                        <span className={cn("size-2.5 rounded-full", getBandSwatchClassName(b.color))} />
                        <SelectValue />
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {BAND_COLORS.map((color) => (
                        <SelectItem key={color} value={color}>
                          <span className="flex items-center gap-2">
                            <span className={cn("size-2.5 rounded-full", getBandSwatchClassName(color))} />
                            {colorItems[color]}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={pending}
                    onClick={() => removeBand(b.key)}
                    aria-label={t("Smazat práh")}
                  >
                    <Trash2 />
                  </Button>
                </div>
              ))}
              {bands.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("Používají se výchozí prahy.")}</p>
              ) : null}
            </div>
          </div>

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
