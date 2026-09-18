"use client"

import { useMemo, useState } from "react"
import {
  Cell,
  Pie,
  PieChart,
  Tooltip,
} from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer } from "@/components/ui/chart"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "@/components/ui/empty"
import { formatCurrency, formatNumber, formatRate } from "@/lib/format"
import { getCategoryColor, OTHER_COLOR } from "@/lib/category-colors"
import type { BucketBreakdownRow } from "@/lib/queries/doctor"

const chartConfig = {
  base: { label: "Základ", color: "var(--chart-1)" },
}

const OTHER_BUCKET = "__other__"

type DonutRow = BucketBreakdownRow & {
  bucket: string
  label: string
  sourceLabels?: string[]
}

function DonutTooltip({ active, payload, totalBase }: { active?: boolean; payload?: Array<{ payload: DonutRow }>; totalBase: number }) {
  if (!active || !payload?.[0]) return null
  const row = payload[0].payload
  const share = totalBase > 0 ? (row.base / totalBase) * 100 : 0
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 text-sm text-popover-foreground shadow-md">
      <div className="font-medium">{row.label}</div>
      <div className="mt-1 tabular-nums">{formatCurrency(row.base)} · {share.toFixed(1)}%</div>
      {row.sourceLabels?.length ? (
        <div className="mt-1 max-w-56 text-xs text-muted-foreground">{row.sourceLabels.join(", ")}</div>
      ) : null}
    </div>
  )
}

export function BucketBreakdown({ rows }: { rows: BucketBreakdownRow[]; month: string }) {
  const [activeBucket, setActiveBucket] = useState<string | null>(null)
  const totalBase = rows.reduce((sum, row) => sum + row.base, 0)
  const totalCommission = rows.reduce((sum, row) => sum + row.commission, 0)
  const totalQty = rows.reduce((sum, row) => sum + row.qty, 0)

  const sortedRows = useMemo(() => [...rows].sort((a, b) => b.qty - a.qty), [rows])

  const donutRows = useMemo<DonutRow[]>(() => {
    if (!totalBase) return []
    const visible = sortedRows.filter((row) => (row.base / totalBase) * 100 >= 3)
    const small = sortedRows.filter((row) => (row.base / totalBase) * 100 < 3)
    if (!small.length) return visible
    const other: DonutRow = {
      bucket: OTHER_BUCKET,
      label: "Ostatní",
      qty: small.reduce((sum, row) => sum + row.qty, 0),
      base: small.reduce((sum, row) => sum + row.base, 0),
      rate: 0,
      commission: small.reduce((sum, row) => sum + row.commission, 0),
      sourceLabels: small.map((row) => row.label),
    }
    return [...visible, other]
  }, [sortedRows, totalBase])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozpad podle kategorií</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <Empty className="py-10">
            <EmptyHeader>
              <EmptyTitle>Za období nejsou data</EmptyTitle>
              <EmptyDescription>Za vybraný měsíc nemá tento lékař žádné provize.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 lg:items-center">
            <div className="relative flex min-h-[280px] items-center justify-center">
              <ChartContainer config={chartConfig} className="h-[280px] w-full">
                <PieChart>
                  <Pie
                      data={donutRows}
                      dataKey="base"
                      nameKey="label"
                      innerRadius="58%"
                      outerRadius="78%"
                      paddingAngle={2}
                      onMouseEnter={(entry) => setActiveBucket(String((entry as { payload: DonutRow }).payload.bucket))}
                      onMouseLeave={() => setActiveBucket(null)}
                    >
                      {donutRows.map((row) => (
                        <Cell
                          key={row.bucket}
                          fill={row.bucket === OTHER_BUCKET ? OTHER_COLOR : getCategoryColor(row.bucket)}
                          opacity={activeBucket && activeBucket !== row.bucket ? 0.42 : 1}
                          stroke={activeBucket === row.bucket ? "var(--foreground)" : "var(--background)"}
                          strokeWidth={activeBucket === row.bucket ? 3 : 1}
                        />
                      ))}
                    </Pie>
                  <Tooltip
                    content={<DonutTooltip totalBase={totalBase} />}
                    offset={24}
                    wrapperStyle={{ zIndex: 20 }}
                  />
                </PieChart>
              </ChartContainer>
              <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
                <span className="text-xl font-semibold tabular-nums text-foreground">{formatCurrency(totalBase)}</span>
                <span className="text-xs text-muted-foreground">základ pro výpočet</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <Table className="table-fixed w-full min-w-[440px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Kategorie</TableHead>
                    <TableHead className="w-[90px] text-right">Služeb</TableHead>
                    <TableHead className="w-[90px] text-right">Sazba</TableHead>
                    <TableHead className="w-[110px] text-right">Provize, Kč</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {donutRows.map((row) => {
                    const isOther = row.bucket === OTHER_BUCKET
                    const color = isOther ? OTHER_COLOR : getCategoryColor(row.bucket)
                    const highlighted = activeBucket === row.bucket
                    return (
                      <TableRow
                        key={row.bucket}
                        className={highlighted ? "bg-muted/70" : undefined}
                        onMouseEnter={() => setActiveBucket(row.bucket)}
                        onMouseLeave={() => setActiveBucket(null)}
                      >
                        <TableCell className="max-w-0 truncate font-medium" title={row.label}>
                          <span className="mr-2 inline-block size-2 rounded-full align-middle" style={{ backgroundColor: color }} />
                          {row.label}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">{formatNumber(row.qty)}</TableCell>
                        <TableCell className="whitespace-nowrap text-right tabular-nums">
                          {isOther ? "—" : formatRate(row.rate)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">{formatCurrency(row.commission)}</TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell className="font-semibold">Celkem</TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">{formatNumber(totalQty)}</TableCell>
                    <TableCell />
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">{formatCurrency(totalCommission)}</TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
