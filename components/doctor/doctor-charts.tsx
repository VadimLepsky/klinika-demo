"use client"

import { useState } from "react"
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
import { formatCurrency, formatMonth, formatNumber } from "@/lib/format"
import { SERIES_COLORS } from "@/lib/category-colors"
import type { DoctorMonthPoint } from "@/lib/queries/doctor"

const referralsConfig: ChartConfig = {
  referrals: { label: "Počet doporučení", color: SERIES_COLORS.referrals },
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
  const avgCheck = current && current.referrals > 0 ? current.referred_base / current.referrals : null
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
                      const label = key === "referred_base" ? "Objem doporučených" : "Počet doporučení"
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
                formatter={(value) => (value === "referrals" ? "Počet doporučení" : "Objem doporučených")}
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
          <div className="grid h-full grid-cols-2 grid-rows-2 gap-4">
            <div className="flex flex-col justify-center gap-1 rounded-lg border bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">Počet doporučení</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {current ? formatNumber(current.referrals) : "—"}
              </span>
            </div>
            <div className="flex flex-col justify-center gap-1 rounded-lg border bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">Pacientů</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {current ? formatNumber(current.patients_served) : "—"}
              </span>
            </div>
            <div className="flex flex-col justify-center gap-1 rounded-lg border bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">Průměrný účet doporučení</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {avgCheck != null ? formatCurrency(avgCheck) : "—"}
              </span>
            </div>
            <div className="flex flex-col justify-center gap-1 rounded-lg border bg-muted/30 px-4 py-3">
              <span className="text-sm text-muted-foreground">Průměrná částka na pacienta</span>
              <span className="text-2xl font-semibold tabular-nums text-foreground">
                {avgPerPatient != null ? formatCurrency(avgPerPatient) : "—"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
