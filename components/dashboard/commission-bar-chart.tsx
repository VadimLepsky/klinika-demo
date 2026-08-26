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
import { formatCurrency, formatMonth } from "@/lib/format"
import type { MonthlySeriesPoint } from "@/lib/queries/dashboard"

const chartConfig: ChartConfig = {
  commission: { label: "Provize", color: "var(--chart-1)" },
}

export function CommissionBarChart({ series }: { series: MonthlySeriesPoint[] }) {
  const data = series.map((p) => ({ label: formatMonth(p.period), commission: p.commission }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Provize po měsících</CardTitle>
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
              tickFormatter={(v) => new Intl.NumberFormat("cs-CZ", { notation: "compact" }).format(Number(v))}
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
