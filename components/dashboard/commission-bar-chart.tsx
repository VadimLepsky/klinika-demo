"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
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

export function CommissionBarChart({ series }: { series: MonthlySeriesPoint[] }) {
  const { t, formatCurrency, formatMonth, formatCompact } = useI18n()
  const chartConfig: ChartConfig = {
    commission: { label: t("Provize"), color: SERIES_COLORS.commission },
  }
  const data = series.map((p) => ({ label: formatMonth(p.period), commission: p.commission }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Provize po měsících")}</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <BarChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              width={64}
              tickFormatter={(v) => formatCompact(Number(v))}
            />
            <ChartTooltip
              content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))} />}
            />
            <Bar dataKey="commission" fill="var(--color-commission)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
