import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RateEditDialog } from "@/components/settings/rate-edit-dialog"
import { getBucketsWithRates, getRateHistory } from "@/lib/queries/settings"
import { formatRate, formatDate } from "@/lib/format"

export const metadata = { title: "Sazby" }

export const dynamic = "force-dynamic"

export default async function RatesPage() {
  const buckets = await getBucketsWithRates()
  const histories = await Promise.all(buckets.map((b) => getRateHistory(b.bucket)))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sazby podle skupin</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table className="table-fixed w-full min-w-[680px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Skupina</TableHead>
                <TableHead className="w-[150px]">Příjemce</TableHead>
                <TableHead className="w-[130px] text-right">Platná sazba</TableHead>
                <TableHead className="w-[120px]">Platí od</TableHead>
                <TableHead className="w-[110px] text-right pr-4">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buckets.map((b) => (
                <TableRow key={b.bucket}>
                  <TableCell
                    className="max-w-0 truncate pl-4 font-medium text-foreground"
                    title={b.label}
                  >
                    {b.label}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {b.beneficiary === "source" ? "Doporučující" : "Vykonavatel"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right">
                    {b.current_rate != null ? (
                      <Badge variant="secondary">{formatRate(b.current_rate)}</Badge>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {b.valid_from ? formatDate(b.valid_from) : "—"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right pr-4">
                    <RateEditDialog bucket={b.bucket} label={b.label} currentRate={b.current_rate} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="mt-6">
          <h3 className="mb-2 text-sm font-medium text-foreground">Historie sazeb</h3>
          <Accordion>
            {buckets.map((b, i) => (
              <AccordionItem key={b.bucket} value={b.bucket}>
                <AccordionTrigger>
                  <span className="flex items-center gap-2">
                    {b.label}
                    <span className="text-xs text-muted-foreground">
                      ({histories[i].length} verzí)
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  {histories[i].length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table className="table-fixed w-full min-w-[480px]">
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">Sazba</TableHead>
                            <TableHead className="w-[120px]">Platí od</TableHead>
                            <TableHead className="w-[120px]">Platí do</TableHead>
                            <TableHead>Stav</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {histories[i].map((h) => (
                            <TableRow key={h.id}>
                              <TableCell className="whitespace-nowrap font-medium text-foreground">
                                {formatRate(h.rate)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground">
                                {formatDate(h.valid_from)}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-muted-foreground">
                                {h.valid_to ? formatDate(h.valid_to) : "—"}
                              </TableCell>
                              <TableCell className="whitespace-nowrap">
                                {h.valid_to === null ? (
                                  <Badge>platná</Badge>
                                ) : (
                                  <Badge variant="outline">archiv</Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Historie chybí.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  )
}
