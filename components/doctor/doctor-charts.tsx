"use client"

import { useState, type ReactNode } from "react"
import { Building2, Globe } from "lucide-react"
import { CartesianGrid, Legend, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Tooltip as UiTooltip,
  TooltipContent as UiTooltipContent,
  TooltipTrigger as UiTooltipTrigger,
} from "@/components/ui/tooltip"
import { formatCoefficient, formatCurrency, formatCurrencyRounded, formatMonth, formatNumber } from "@/lib/format"
import { SERIES_COLORS } from "@/lib/category-colors"
import { cn } from "@/lib/utils"
import type { DoctorMonthPoint, DoctorMonthStats } from "@/lib/queries/doctor"

const referralsConfig: ChartConfig = {
  referrals: { label: "Doporučeno pacientů", color: SERIES_COLORS.referrals },
  referred_base: { label: "Objem doporučených", color: SERIES_COLORS.referredSum },
}
const commissionConfig: ChartConfig = {
  commission: { label: "Provize", color: SERIES_COLORS.commission },
}
const patientsConfig: ChartConfig = {
  patients_served: { label: "Ošetřeno pacientů", color: SERIES_COLORS.patients },
  coefficient: { label: "Koeficient doporučení", color: SERIES_COLORS.coefficient },
}

const percentFmt = new Intl.NumberFormat("cs-CZ", { minimumFractionDigits: 1, maximumFractionDigits: 1 })

function formatPercent(value: number | null): string {
  if (value == null) return "—"
  return `${percentFmt.format(value)}%`
}

const TILE_CLASS = "flex min-w-0 flex-col justify-center gap-1 rounded-lg border bg-muted/30 px-3 py-3"
const VALUE_CLASS = "whitespace-nowrap text-xl font-semibold tabular-nums"

function MetricTile({
  label,
  value,
  secondary,
  gapStyle,
}: {
  label: string
  value: string
  secondary?: ReactNode
  gapStyle?: string
}) {
  return (
    <div className={TILE_CLASS} style={gapStyle ? { gap: gapStyle } : undefined}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className={cn(VALUE_CLASS, "text-foreground")}>{value}</span>
      {secondary ? <div className="flex flex-col text-xs text-muted-foreground tabular-nums">{secondary}</div> : null}
    </div>
  )
}

function consultLines(stats: DoctorMonthStats | null): ReactNode {
  if (!stats) return undefined
  const { consult_offline_primary, consult_offline_repeat, consult_online_primary, consult_online_repeat } = stats
  if (consult_offline_primary + consult_offline_repeat + consult_online_primary + consult_online_repeat === 0) {
    return undefined
  }
  return (
    <>
      <span>Konzultace:</span>
      <span className="flex items-center gap-1" title="Offline">
        <Building2 className="size-3 shrink-0" aria-label="Offline" />
        {formatNumber(consult_offline_primary)} prim. · {formatNumber(consult_offline_repeat)} opak.
      </span>
      <span className="flex items-center gap-1" title="Online">
        <Globe className="size-3 shrink-0" aria-label="Online" />
        {formatNumber(consult_online_primary)} prim. · {formatNumber(consult_online_repeat)} opak.
      </span>
    </>
  )
}

function showupColorClass(pct: number): string {
  if (pct >= 80) return "text-status-accrued-foreground"
  if (pct >= 60) return "text-status-pending-foreground"
  return "text-status-unmatched-foreground"
}

function ShowupTile({ stats }: { stats: DoctorMonthStats | null }) {
  const label = <span className="text-sm text-muted-foreground">Docházkovost</span>
  const totalSum = stats ? stats.showup_done_sum + stats.showup_cancel_sum : 0
  const hasVisits = stats != null && stats.showup_done_count + stats.showup_cancel_count > 0

  if (!stats || !hasVisits || totalSum <= 0) {
    return (
      <div className={TILE_CLASS} style={{ gap: "18px" }}>
        {label}
        <span className={cn(VALUE_CLASS, "text-foreground")}>—</span>
      </div>
    )
  }

  const pct = Math.round((stats.showup_done_sum / totalSum) * 100)

  return (
    <UiTooltip>
      <UiTooltipTrigger
        render={
          <div className={cn(TILE_CLASS, "cursor-help")} tabIndex={0} style={{ gap: "18px" }}>
            {label}
            <span className={cn(VALUE_CLASS, showupColorClass(pct))}>{`${formatNumber(pct)}%`}</span>
          </div>
        }
      />
      <UiTooltipContent>
        <p>{`Provedeno a zaplaceno: ${formatNumber(stats.showup_done_count)} návštěv (${formatCurrency(stats.showup_done_sum)})`}</p>
        <p>{`Zrušeno (ztraceno): ${formatNumber(stats.showup_cancel_count)} návštěv (${formatCurrency(stats.showup_cancel_sum)})`}</p>
      </UiTooltipContent>
    </UiTooltip>
  )
}

export function DoctorCharts({
  series,
  selectedPeriod,
}: {
  series: DoctorMonthPoint[]
  selectedPeriod: string
}) {
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())
  const data = series.map((p) => ({
    label: formatMonth(p.period),
    referrals: p.referrals,
    referred_base: p.referred_base,
    commission: p.commission,
    patients_served: p.patients_served,
    coefficient: p.patients_served > 0 ? (p.referrals / p.patients_served) * 100 : null,
  }))

  const current = series.find((p) => p.period === selectedPeriod) ?? null
  const stats = current?.stats ?? null
  const avgCheck =
    stats && stats.referrals_commissionable > 0 ? (current?.referred_base ?? 0) / stats.referrals_commissionable : null
  const avgPerPatient =
    current && current.patients_served > 0 ? current.referred_base / current.patients_served : null

  return (
    <div className="grid grid-cols-1 gap-4 min-[1100px]:grid-cols-2">
      <Card className="flex h-[380px] flex-col">
        <CardHeader>
          <CardTitle>Doporučení po měsících</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ChartContainer config={referralsConfig} className="aspect-auto h-full w-full">
            <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis
                yAxisId="referrals"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="base"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={64}
                tickFormatter={(value) =>
                  new Intl.NumberFormat("cs-CZ", { notation: "compact", maximumFractionDigits: 0 }).format(
                    Number(value),
                  )
                }
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const key = String(item.dataKey)
                      const label = key === "referred_base" ? "Objem doporučených" : "Doporučeno pacientů"
                      return (
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {key === "referred_base"
                              ? formatCurrency(Number(value))
                              : new Intl.NumberFormat("cs-CZ").format(Number(value))}
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Legend
                formatter={(value) => (value === "referrals" ? "Doporučeno pacientů" : "Objem doporučených")}
                onClick={(entry) => {
                  const key = String(entry.dataKey)
                  setHiddenSeries((current) => {
                    const next = new Set(current)
                    if (next.has(key)) next.delete(key)
                    else next.add(key)
                    return next
                  })
                }}
              />
              <Line
                yAxisId="referrals"
                dataKey="referrals"
                hide={hiddenSeries.has("referrals")}
                type="monotone"
                stroke="var(--color-referrals)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="base"
                dataKey="referred_base"
                hide={hiddenSeries.has("referred_base")}
                type="monotone"
                stroke="var(--color-referred_base)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="flex h-[380px] flex-col">
        <CardHeader>
          <CardTitle>Provize po měsících</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ChartContainer config={commissionConfig} className="aspect-auto h-full w-full">
            <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={64}
                tickFormatter={(v) => new Intl.NumberFormat("cs-CZ", { notation: "compact" }).format(Number(v))}
              />
              <ChartTooltip content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />} />
              <Line
                dataKey="commission"
                type="monotone"
                stroke="var(--color-commission)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="flex h-[380px] flex-col">
        <CardHeader>
          <CardTitle>Pacienti a koeficient</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <ChartContainer config={patientsConfig} className="aspect-auto h-full w-full">
            <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis
                yAxisId="patients"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={40}
                allowDecimals={false}
              />
              <YAxis
                yAxisId="coefficient"
                orientation="right"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={56}
                tickFormatter={(value) => `${new Intl.NumberFormat("cs-CZ").format(Number(value))}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const key = String(item.dataKey)
                      const label = key === "coefficient" ? "Koeficient doporučení" : "Ošetřeno pacientů"
                      return (
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {key === "coefficient" ? formatPercent(Number(value)) : formatNumber(Number(value))}
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Legend
                formatter={(value) => (value === "patients_served" ? "Ošetřeno pacientů" : "Koeficient doporučení")}
                onClick={(entry) => {
                  const key = String(entry.dataKey)
                  setHiddenSeries((current) => {
                    const next = new Set(current)
                    if (next.has(key)) next.delete(key)
                    else next.add(key)
                    return next
                  })
                }}
              />
              <Line
                yAxisId="patients"
                dataKey="patients_served"
                hide={hiddenSeries.has("patients_served")}
                type="monotone"
                stroke="var(--color-patients_served)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="coefficient"
                dataKey="coefficient"
                hide={hiddenSeries.has("coefficient")}
                type="monotone"
                stroke="var(--color-coefficient)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
                connectNulls={false}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card className="flex h-[380px] flex-col">
        <CardHeader>
          <CardTitle>Ukazatele za období</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-4">
            <MetricTile
              label="Doporučeno pacientů"
              value={stats ? formatNumber(stats.referred_patients) : "—"}
              secondary={
                stats ? (
                  <>
                    <span>{`koeficient ${formatCoefficient(stats.referred_patients, stats.patients_served)}`}</span>
                    <span>{`celkem doporučení: ${formatNumber(stats.referrals)}`}</span>
                  </>
                ) : undefined
              }
              gapStyle="3px"
            />
            <MetricTile
              label="Pacientů"
              value={stats ? formatNumber(stats.patients_served) : "—"}
              secondary={consultLines(stats)}
              gapStyle={consultLines(stats) ? "3px" : "18px"}
            />
            <ShowupTile stats={stats} />
            <MetricTile
              label="Prům. účet doporučení"
              value={stats && avgCheck != null ? formatCurrencyRounded(avgCheck) : "—"}
              gapStyle="18px"
            />
            <MetricTile
              label="Prům. částka na pacienta"
              value={stats && avgPerPatient != null ? formatCurrencyRounded(avgPerPatient) : "—"}
              gapStyle="18px"
            />
            <MetricTile
              label="Přeobjednání"
              value={stats ? formatNumber(stats.self_records) : "—"}
              secondary={
                stats ? `koeficient ${formatCoefficient(stats.self_records, stats.visits_performed)}` : undefined
              }
              gapStyle="3px"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
