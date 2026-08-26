import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import type { BucketBreakdownRow } from "@/lib/queries/doctor"

export function BucketBreakdown({ rows, month }: { rows: BucketBreakdownRow[]; month: string }) {
  const totalBase = rows.reduce((s, r) => s + r.base, 0)
  const totalCommission = rows.reduce((s, r) => s + r.commission, 0)
  const totalQty = rows.reduce((s, r) => s + r.qty, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rozpad podle kategorií</CardTitle>
        <CardDescription>{month} — provize podle skupin</CardDescription>
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
          <div className="overflow-x-auto">
            <Table className="table-fixed w-full min-w-[560px]">
              <TableHeader>
                <TableRow>
                  <TableHead>Kategorie</TableHead>
                  <TableHead className="w-[90px] text-right">Služeb</TableHead>
                  <TableHead className="w-[110px] text-right">Základ, Kč</TableHead>
                  <TableHead className="w-[90px] text-right">Sazba</TableHead>
                  <TableHead className="w-[110px] text-right">Provize, Kč</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.bucket}>
                    <TableCell className="max-w-0 truncate font-medium" title={r.label}>
                      {r.label}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatNumber(r.qty)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(r.base)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatRate(r.rate)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-medium tabular-nums">
                      {formatCurrency(r.commission)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell className="font-semibold">Celkem</TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                    {formatNumber(totalQty)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                    {formatCurrency(totalBase)}
                  </TableCell>
                  <TableCell />
                  <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                    {formatCurrency(totalCommission)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
