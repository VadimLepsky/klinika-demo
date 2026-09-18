"use client"

import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { DeleteBucketButton } from "@/components/settings/delete-bucket-button"
import { RateEditDialog } from "@/components/settings/rate-edit-dialog"
import type { BucketManagementRow, RateHistoryRow } from "@/lib/queries/settings"
import { formatRate, formatDate } from "@/lib/format"

function RateHistoryTooltip({ history, children }: { history: RateHistoryRow[]; children: React.ReactNode }) {
  if (history.length === 0) return <>{children}</>

  return (
    <Tooltip>
      <TooltipTrigger className="cursor-default">{children}</TooltipTrigger>
      <TooltipContent side="right" className="flex flex-col items-start gap-1 py-2">
        {history.map((h) => (
          <span key={h.id} className="flex items-center gap-1.5 whitespace-nowrap">
            {formatRate(h.rate)} · {formatDate(h.valid_from)}
            {h.valid_to ? ` — ${formatDate(h.valid_to)}` : null}
            {h.valid_to === null ? (
              <Badge variant="secondary" className="px-1 py-0 text-[10px] leading-4">
                platná
              </Badge>
            ) : null}
          </span>
        ))}
      </TooltipContent>
    </Tooltip>
  )
}

export function BucketsTable({
  buckets,
  histories,
}: {
  buckets: BucketManagementRow[]
  histories: Record<string, RateHistoryRow[]>
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="table-fixed w-full min-w-[820px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[220px] pl-4">Pravidlo</TableHead>
            <TableHead className="w-[110px]">Příjemce</TableHead>
            <TableHead className="w-[100px] text-right">Platná sazba</TableHead>
            <TableHead className="w-[100px]">Platí od</TableHead>
            <TableHead className="w-[80px] text-right">Kategorií</TableHead>
            <TableHead className="text-right pr-4">Akce</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {buckets.length > 0 ? (
            buckets.map((b) => {
              const history = histories[b.bucket] ?? []
              return (
                <TableRow key={b.bucket}>
                  <TableCell className="max-w-0 pl-4">
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="truncate font-medium text-foreground" title={b.label}>
                        {b.label}
                      </span>
                      <span className="truncate font-mono text-xs text-muted-foreground">{b.bucket}</span>
                    </span>
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
                    {b.valid_from ? (
                      <RateHistoryTooltip history={history}>
                        <span className="underline decoration-dotted decoration-from-font underline-offset-2">
                          {formatDate(b.valid_from)}
                        </span>
                      </RateHistoryTooltip>
                    ) : (
                      "—"
                    )}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                    {b.mapping_count}
                  </TableCell>
                  <TableCell className="whitespace-nowrap pr-4">
                    <div className="flex items-center justify-end gap-2">
                      <RateEditDialog bucket={b.bucket} label={b.label} currentRate={b.current_rate} />
                      <DeleteBucketButton bucket={b.bucket} label={b.label} canDelete={b.canDelete} />
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                Žádná pravidla.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
