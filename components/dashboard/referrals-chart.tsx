"use client"

import { useMemo, useState } from "react"
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
import { useI18n } from "@/lib/i18n/client"
import { SERIES_COLORS } from "@/lib/category-colors"
import type { MonthlySeriesPoint } from "@/lib/queries/dashboard"

export function ReferralsChart({ series }: { series: MonthlySeriesPoint[] }) {
  const { t, formatCurrency, formatMonth, formatNumber, formatCompact } = useI18n()
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())
  const referralsLabel = t("Odeslaní pacienti")
  const baseLabel = t("Objem žádanek (Kč)")
  const chartConfig: ChartConfig = {
    clinic: { label: referralsLabel, color: SERIES_COLORS.referrals },
    referred_base: { label: baseLabel, color: SERIES_COLORS.referredSum },
  }

  const chartData = useMemo(() => {
    return series.map((point) => ({
      period: point.period,
      label: formatMonth(point.period),
      clinic: point.referrals,
      referred_base: point.referred_base,
    }))
  }, [series, formatMonth])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>{t("Vývoj odeslaných pacientů a objemu žádanek")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8 }}>
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
                  formatter={(value, _name, item) => {
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
              formatter={(value) => (value === "clinic" ? referralsLabel : baseLabel)}
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
              dataKey="clinic"
              hide={hiddenSeries.has("clinic")}
              type="monotone"
              stroke="var(--color-clinic)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
            <Line
              yAxisId="base"
              dataKey="referred_base"
              hide={hiddenSeries.has("referred_base")}
              type="monotone"
              stroke="var(--color-referred_base)"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
