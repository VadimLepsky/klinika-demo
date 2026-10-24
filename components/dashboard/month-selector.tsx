"use client"

import { useMemo, useState } from "react"
import { ChevronDown, ChevronLeft, ChevronRight, Lock } from "lucide-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useI18n } from "@/lib/i18n/client"
import type { Period } from "@/lib/queries/dashboard"

const MONTHS_SHORT_CS = [
  "Led",
  "Úno",
  "Bře",
  "Dub",
  "Kvě",
  "Čvn",
  "Čvc",
  "Srp",
  "Zář",
  "Říj",
  "Lis",
  "Pro",
]

function parsePeriod(period: string): { year: number; month: number } {
  return { year: Number(period.slice(0, 4)), month: Number(period.slice(5, 7)) - 1 }
}

export function MonthSelector({
  periods,
  current,
  allowAll = false,
}: {
  periods: Period[]
  current: string | null
  allowAll?: boolean
}) {
  const { t, formatMonth } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const currentPeriod = periods.find((p) => p.period === current)
  // Fall back to the most recent period's year (periods is DESC-sorted) so the
  // popover opens on a sensible year even when nothing is selected ("Všechna období").
  const fallbackYear = periods[0] ? parsePeriod(periods[0].period).year : new Date().getFullYear()
  const currentYear = current ? parsePeriod(current).year : fallbackYear
  const [year, setYear] = useState(currentYear)

  // Map of year -> month index (0-11) -> Period, for O(1) lookups while rendering the grid.
  const byYear = useMemo(() => {
    const map = new Map<number, Map<number, Period>>()
    for (const p of periods) {
      const { year: y, month: m } = parsePeriod(p.period)
      if (!map.has(y)) map.set(y, new Map())
      map.get(y)!.set(m, p)
    }
    return map
  }, [periods])

  // Years that actually have periods, ascending — arrows step through this list only.
  const years = useMemo(() => [...byYear.keys()].sort((a, b) => a - b), [byYear])
  const yearIndex = years.indexOf(year)
  const canGoPrevYear = yearIndex > 0
  const canGoNextYear = yearIndex >= 0 && yearIndex < years.length - 1

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("period", value)
    router.push(`${pathname}?${params.toString()}`)
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) setYear(currentYear)
  }

  const handleSelectMonth = (period: string) => {
    onChange(period)
    setOpen(false)
  }

  const handleSelectAll = () => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete("period")
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
    setOpen(false)
  }

  const monthsForYear = byYear.get(year)

  return (
    <div className="flex items-center gap-3">
      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger
          render={
            <Button variant="outline" className="w-[220px] justify-between">
              <span>{current ? formatMonth(current) : t("Všechna období")}</span>
              <ChevronDown data-icon="inline-end" />
            </Button>
          }
        />
        <PopoverContent className="w-64" align="start">
          {allowAll ? (
            <Button
              type="button"
              variant={current == null ? "default" : "ghost"}
              size="sm"
              className="mb-2 w-full"
              onClick={handleSelectAll}
            >
              {t("Všechna období")}
            </Button>
          ) : null}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canGoPrevYear}
              onClick={() => setYear(years[yearIndex - 1])}
              aria-label={t("Předchozí rok")}
            >
              <ChevronLeft />
            </Button>
            <span className="text-sm font-medium tabular-nums">{year}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={!canGoNextYear}
              onClick={() => setYear(years[yearIndex + 1])}
              aria-label={t("Následující rok")}
            >
              <ChevronRight />
            </Button>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {MONTHS_SHORT_CS.map((label, monthIndex) => {
              const period = monthsForYear?.get(monthIndex)
              const isSelected = period != null && period.period === current
              const isFrozen = period?.status === "frozen"

              return (
                <Button
                  key={monthIndex}
                  type="button"
                  variant={isSelected ? "default" : "ghost"}
                  size="sm"
                  disabled={period == null}
                  onClick={() => period && handleSelectMonth(period.period)}
                  className="relative w-full"
                >
                  {t(label)}
                  {isFrozen ? (
                    <Lock
                      className={cn(
                        "absolute top-0.5 right-0.5 size-2.5",
                        isSelected ? "text-primary-foreground/70" : "text-muted-foreground",
                      )}
                    />
                  ) : null}
                </Button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
      {currentPeriod?.status === "frozen" ? (
        <Badge variant="secondary" className="gap-1">
          <Lock className="size-3" />
          {t("Uzavřeno")}
        </Badge>
      ) : null}
    </div>
  )
}
