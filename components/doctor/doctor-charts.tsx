"use client"

import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
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
import type { DoctorMonthPoint } from "@/lib/queries/doctor"

const referralsConfig: ChartConfig = {
  referrals: { label: "Doporučení", color: "var(--chart-1)" },
}
const commissionConfig: ChartConfig = {
  commission: { label: "Provize", color: "var(--chart-2)" },
}

export function DoctorCharts({ series }: { series: DoctorMonthPoint[] }) {
  const data = series.map((p) => ({
    label: formatMonth(p.period),
    referrals: p.referrals,
    commission: p.commission,
  }))

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Doporučení po měsících</CardTitle>
          <CardDescription>Počet doporučení tohoto lékaře</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={referralsConfig} className="aspect-auto h-[240px] w-full">
            <LineChart data={data} margin={{ left: 4, right: 12, top: 8 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} minTickGap={24} />
              <YAxis tickLine={false} axisLine={false} tickMargin={8} width={40} allowDecimals={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                dataKey="referrals"
                type="monotone"
                stroke="var(--color-referrals)"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Provize po měsících</CardTitle>
          <CardDescription>Připsaná provize tohoto lékaře</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={commissionConfig} className="aspect-auto h-[240px] w-full">
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
    </div>
  )
}
