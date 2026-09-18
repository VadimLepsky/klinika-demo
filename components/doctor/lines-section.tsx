import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { StatusChip } from "@/components/status-chip"
import { formatCurrency, formatNumber, formatRate } from "@/lib/format"
import type { DoctorLine } from "@/lib/queries/doctor"

export function LinesSection({ lines }: { lines: DoctorLine[] }) {
  return (
    <Card>
      <CardContent className="pt-0">
        <Accordion>
          <AccordionItem value="lines" className="border-none">
            <AccordionTrigger className="py-4">
              <span className="flex items-center gap-2 text-sm font-semibold">
                Jednotlivé položky
                <span className="text-muted-foreground font-normal">
                  ({formatNumber(lines.length)})
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {lines.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Za vybraný měsíc nejsou žádné položky.
                </p>
              ) : (
                <div className="max-h-[520px] overflow-auto rounded-md border border-border">
                  <Table className="table-fixed w-full min-w-[640px]">
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead className="w-[90px] text-right">Č. návštěvy</TableHead>
                        <TableHead>Služba</TableHead>
                        <TableHead className="w-[110px] text-right">Základ, Kč</TableHead>
                        <TableHead className="w-[90px] text-right">Sazba</TableHead>
                        <TableHead className="w-[110px] text-right">Provize, Kč</TableHead>
                        <TableHead className="w-[140px]">Stav</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lines.map((line) => (
                        <TableRow key={line.id}>
                          <TableCell className="whitespace-nowrap text-right text-muted-foreground tabular-nums">
                            {line.visit_id ?? "—"}
                          </TableCell>
                          <TableCell
                            className="max-w-0 truncate font-medium"
                            title={line.item_name}
                          >
                            {line.item_name}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {formatCurrency(line.base_amount)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {line.rate != null ? formatRate(line.rate) : "—"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-right tabular-nums">
                            {formatCurrency(line.commission)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <StatusChip status={line.status} reason={line.reason} />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
