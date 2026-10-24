"use client"

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
import { useI18n } from "@/lib/i18n/client"
import type { DoctorLine } from "@/lib/queries/doctor"

export function LinesSection({ lines }: { lines: DoctorLine[] }) {
  const { t, formatCurrency, formatNumber, formatRate } = useI18n()
  return (
    <Card>
      <CardContent className="pt-0">
        <Accordion>
          <AccordionItem value="lines" className="border-none">
            <AccordionTrigger className="py-4">
              <span className="flex items-center gap-2 text-sm font-semibold">
                {t("Jednotlivé položky")}
                <span className="text-muted-foreground font-normal">
                  ({formatNumber(lines.length)})
                </span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              {lines.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {t("Za vybraný měsíc nejsou žádné položky.")}
                </p>
              ) : (
                <div className="max-h-[520px] overflow-auto rounded-md border border-border">
                  <Table className="table-fixed w-full min-w-[640px]">
                    <TableHeader className="sticky top-0 bg-card">
                      <TableRow>
                        <TableHead className="w-[90px] text-right">{t("Č. návštěvy")}</TableHead>
                        <TableHead>{t("Služba")}</TableHead>
                        <TableHead className="w-[110px] text-right">{t("Základ, Kč")}</TableHead>
                        <TableHead className="w-[90px] text-right">{t("Sazba")}</TableHead>
                        <TableHead className="w-[110px] text-right">{t("Provize, Kč")}</TableHead>
                        <TableHead className="w-[140px]">{t("Stav")}</TableHead>
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
                            title={t(line.item_name)}
                          >
                            {t(line.item_name)}
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
