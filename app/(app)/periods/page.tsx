import { Lock, Snowflake } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FreezeButton } from "@/components/periods/freeze-button"
import { BlockerSummary } from "@/components/periods/blocker-summary"
import { getPeriodsWithBlockers } from "@/lib/queries/periods"
import { formatCurrency, formatDateTime, formatMonth } from "@/lib/format"

export const metadata = { title: "Období — demo.clinic" }

export const dynamic = "force-dynamic"

export default async function PeriodsPage() {
  const periods = await getPeriodsWithBlockers()
  const frozen = periods.filter((p) => p.status === "frozen").length

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">Období</h1>
        <p className="text-sm text-muted-foreground">
          Uzavřený měsíc je uzamčen natrvalo — přepočet už není možný.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Celkem měsíců</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{periods.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Uzavřeno</CardDescription>
            <CardTitle className="flex items-center gap-2 text-2xl tabular-nums">
              <Lock className="size-4 text-muted-foreground" />
              {frozen}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rozpracováno</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{periods.length - frozen}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Snowflake className="size-4 text-muted-foreground" />
            Měsíce
          </CardTitle>
          <CardDescription>
            Uzavřít lze jen měsíc, ve kterém nezůstaly nevyřešené položky.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-0">
          <Table className="table-fixed w-full min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px] pl-6">Měsíc</TableHead>
                <TableHead className="w-[130px]">Stav</TableHead>
                <TableHead className="w-[140px] text-right">Provize, Kč</TableHead>
                <TableHead className="w-[100px] text-right">Lékařů</TableHead>
                <TableHead className="w-[160px]">Připravenost</TableHead>
                <TableHead className="w-[160px]">Uzavřeno</TableHead>
                <TableHead className="w-[140px] pr-6 text-right">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periods.length > 0 ? (
                periods.map((p) => (
                  <TableRow key={p.period}>
                    <TableCell className="whitespace-nowrap pl-6 font-medium text-foreground">
                      {formatMonth(p.period)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {p.status === "frozen" ? (
                        <Badge variant="secondary" className="gap-1">
                          <Lock className="size-3" />
                          Uzavřeno
                        </Badge>
                      ) : (
                        <Badge variant="outline">Rozpracováno</Badge>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(
                        p.status === "frozen" ? p.total_commission : p.computed_commission,
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {p.doctors}
                    </TableCell>
                    <TableCell className="max-w-0 truncate">
                      {p.status === "frozen" ? (
                        <span className="text-sm text-muted-foreground">—</span>
                      ) : (
                        <BlockerSummary blockers={p.blockers} />
                      )}
                    </TableCell>
                    <TableCell className="max-w-0 text-sm text-muted-foreground">
                      {p.frozen_at ? (
                        <span className="flex flex-col">
                          <span className="truncate">{formatDateTime(p.frozen_at)}</span>
                          {p.frozen_by ? (
                            <span className="truncate text-xs" title={p.frozen_by}>
                              {p.frozen_by}
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-6 text-right">
                      <FreezeButton
                        period={p.period}
                        status={p.status}
                        canFreeze={p.canFreeze}
                        blockers={p.blockers}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                    Žádná období.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
