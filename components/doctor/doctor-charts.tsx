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
import { useI18n } from "@/lib/i18n/client"
import { SERIES_COLORS } from "@/lib/category-colors"
import { cn } from "@/lib/utils"
import type { DoctorMonthPoint, DoctorMonthStats } from "@/lib/queries/doctor"

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

function ConsultLines({ stats }: { stats: DoctorMonthStats }) {
  const { t, formatNumber } = useI18n()
  const { consult_offline_primary, consult_offline_repeat, consult_online_primary, consult_online_repeat } = stats
  return (
    <>
      <span>{t("Konzultace:")}</span>
      <span className="flex items-center gap-1" title="Offline">
        <Building2 className="size-3 shrink-0" aria-label="Offline" />
        {t("{primary} prim. · {repeat} opak.", {
          primary: formatNumber(consult_offline_primary),
          repeat: formatNumber(consult_offline_repeat),
        })}
      </span>
      <span className="flex items-center gap-1" title="Online">
        <Globe className="size-3 shrink-0" aria-label="Online" />
        {t("{primary} prim. · {repeat} opak.", {
          primary: formatNumber(consult_online_primary),
          repeat: formatNumber(consult_online_repeat),
        })}
      </span>
    </>
  )
}

function showupColorClass(pct: number): string {
  if (pct >= 80) return "text-status-accrued-foreground"
  if (pct >= 60) return "text-status-pending-foreground"
  return "text-status-unmatched-foreground"
}

function hasConsults(stats: DoctorMonthStats | null): stats is DoctorMonthStats {
  if (!stats) return false
  const { consult_offline_primary, consult_offline_repeat, consult_online_primary, consult_online_repeat } = stats
  return consult_offline_primary + consult_offline_repeat + consult_online_primary + consult_online_repeat > 0
}

function ShowupTile({ stats }: { stats: DoctorMonthStats | null }) {
  const { t, formatCurrency, formatNumber } = useI18n()
  const label = <span className="text-sm text-muted-foreground">{t("Docházkovost")}</span>
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
        <p>
          {t("Provedeno a zaplaceno: {count} návštěv ({sum})", {
            count: formatNumber(stats.showup_done_count),
            sum: formatCurrency(stats.showup_done_sum),
          })}
        </p>
        <p>
          {t("Zrušeno (ztraceno): {count} návštěv ({sum})", {
            count: formatNumber(stats.showup_cancel_count),
            sum: formatCurrency(stats.showup_cancel_sum),
          })}
        </p>
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
  const { t, formatCoefficient, formatCompact, formatCurrency, formatCurrencyRounded, formatDecimal, formatMonth, formatNumber } =
    useI18n()
  const formatPercent = (value: number | null) => (value == null ? "—" : `${formatDecimal(value)}%`)
  const referralsLabel = t("Odeslaní pacienti")
  const baseLabel = t("Objem žádanek (Kč)")
  const patientsLabel = t("Ošetřeno pacientů")
  const coefficientLabel = t("Koeficient žádanek")
  const referralsConfig: ChartConfig = {
    referrals: { label: referralsLabel, color: SERIES_COLORS.referrals },
    referred_base: { label: baseLabel, color: SERIES_COLORS.referredSum },
  }
  const commissionConfig: ChartConfig = {
    commission: { label: t("Provize"), color: SERIES_COLORS.commission },
  }
  const patientsConfig: ChartConfig = {
    patients_served: { label: patientsLabel, color: SERIES_COLORS.patients },
    coefficient: { label: coefficientLabel, color: SERIES_COLORS.coefficient },
  }
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
          <CardTitle>{t("Odeslaní pacienti a objem žádanek po měsících")}</CardTitle>
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
                tickFormatter={(value) => formatCompact(Number(value))}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const key = String(item.dataKey)
                      const label = key === "referred_base" ? baseLabel : referralsLabel
                      return (
                        <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                          <span className="text-muted-foreground">{label}</span>
                          <span className="font-mono font-medium tabular-nums text-foreground">
                            {key === "referred_base"
                              ? formatCurrency(Number(value))
                              : formatNumber(Number(value))}
                          </span>
                        </div>
                      )
                    }}
                  />
                }
              />
              <Legend
                formatter={(value) => (value === "referrals" ? referralsLabel : baseLabel)}
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
          <CardTitle>{t("Provize po měsících")}</CardTitle>
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
                tickFormatter={(v) => formatCompact(Number(v))}
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
          <CardTitle>{t("Pacienti a koeficient")}</CardTitle>
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
                tickFormatter={(value) => `${formatNumber(Number(value))}%`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name, item) => {
                      const key = String(item.dataKey)
                      const label = key === "coefficient" ? coefficientLabel : patientsLabel
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
                formatter={(value) => (value === "patients_served" ? patientsLabel : coefficientLabel)}
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
          <CardTitle>{t("Ukazatele za období")}</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="grid h-full grid-cols-3 grid-rows-2 gap-4">
            <MetricTile
              label={referralsLabel}
              value={stats ? formatNumber(stats.referred_patients) : "—"}
              secondary={
                stats ? (
                  <>
                    <span>{t("koeficient {value}", { value: formatCoefficient(stats.referred_patients, stats.patients_served) })}</span>
                    <span>{t("Žádanky celkem: {n}", { n: formatNumber(stats.referrals) })}</span>
                  </>
                ) : undefined
              }
              gapStyle="3px"
            />
            <MetricTile
              label={t("Pacientů")}
              value={stats ? formatNumber(stats.patients_served) : "—"}
              secondary={hasConsults(stats) ? <ConsultLines stats={stats} /> : undefined}
              gapStyle={hasConsults(stats) ? "3px" : "18px"}
            />
            <ShowupTile stats={stats} />
            <MetricTile
              label={t("Prům. hodnota žádanky")}
              value={stats && avgCheck != null ? formatCurrencyRounded(avgCheck) : "—"}
              gapStyle="18px"
            />
            <MetricTile
              label={t("Prům. částka na pacienta")}
              value={stats && avgPerPatient != null ? formatCurrencyRounded(avgPerPatient) : "—"}
              gapStyle="18px"
            />
            <MetricTile
              label={t("Přeobjednání")}
              value={stats ? formatNumber(stats.self_records) : "—"}
              secondary={
                stats
                  ? t("koeficient {value}", { value: formatCoefficient(stats.self_records, stats.visits_performed) })
                  : undefined
              }
              gapStyle="3px"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
