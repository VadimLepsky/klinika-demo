"use client"

import { useMemo } from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { formatMonth } from "@/lib/format"
import { SERIES_COLORS } from "@/lib/category-colors"
import type { MonthlySeriesPoint } from "@/lib/queries/dashboard"

const chartConfig: ChartConfig = {
  clinic: { label: "Klinika celkem", color: SERIES_COLORS.referrals },
}

export function ReferralsChart({ series }: { series: MonthlySeriesPoint[] }) {
  const chartData = useMemo(() => {
    return series.map((point) => ({
      period: point.period,
      label: formatMonth(point.period),
      clinic: point.referrals,
    }))
  }, [series])

  return (
    <Card>
      <CardHeader className="flex flex-col gap-1">
        <CardTitle>Vývoj doporučení</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
          <LineChart data={chartData} margin={{ left: 4, right: 12, top: 8 }}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
            <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} allowDecimals={false} />
            <ChartTooltip content={<ChartTooltipContent />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Line
              dataKey="clinic"
              type="monotone"
              stroke="var(--color-clinic)"
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
