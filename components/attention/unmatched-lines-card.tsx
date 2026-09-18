"use client"

import { useState, useTransition } from "react"
import { Check, HelpCircle, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AddServiceDialog } from "@/components/attention/add-service-dialog"
import { IgnoreLineButton } from "@/components/attention/ignore-line-button"
import { unignoreUnmatchedLine } from "@/app/(app)/attention/actions"
import { formatCurrency, formatDateTime, formatMonth } from "@/lib/format"
import type { BucketOption, ExistingCategory, IgnoredUnmatchedLine } from "@/lib/queries/attention"
import type { UnresolvedUnmatchedLine } from "@/lib/queries/unresolved"

function UnignoreButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const [pending, startTransition] = useTransition()
  const restore = () => {
    startTransition(async () => {
      const res = await unignoreUnmatchedLine(itemId)
      if (res.ok) toast.success(`«${itemName}» byla vrácena do seznamu.`)
      else toast.error(res.error)
    })
  }
  return (
    <Button variant="ghost" size="sm" onClick={restore} disabled={pending}>
      {pending ? <Spinner data-icon="inline-start" /> : <Undo2 data-icon="inline-start" />}
      Vrátit
    </Button>
  )
}

export function UnmatchedLinesCard({
  lines,
  ignored,
  buckets,
  categories,
}: {
  lines: UnresolvedUnmatchedLine[]
  ignored: IgnoredUnmatchedLine[]
  buckets: BucketOption[]
  categories: ExistingCategory[]
}) {
  const [showIgnored, setShowIgnored] = useState(false)

  return (
    <Card id="unmatched" className="scroll-mt-6">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <HelpCircle className="size-5 text-muted-foreground" />
            <CardTitle>Nerozpoznané položky</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={lines.length > 0 ? "default" : "secondary"}>{lines.length}</Badge>
            {ignored.length > 0 ? (
              <Button variant="ghost" size="sm" onClick={() => setShowIgnored((v) => !v)}>
                {showIgnored ? "Skrýt ignorované" : `Zobrazit ignorované (${ignored.length})`}
              </Button>
            ) : null}
          </div>
        </div>
        <CardDescription>
          Položky účtenek, které nejsou v číselníku služeb. Seskupeno podle období a služby.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {lines.length > 0 ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <Table className="table-fixed w-full min-w-[720px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[120px] pl-4">Období</TableHead>
                  <TableHead>Položka</TableHead>
                  <TableHead className="w-[90px] text-right">Položek</TableHead>
                  <TableHead className="w-[130px] text-right">Částka</TableHead>
                  <TableHead className="w-[280px] text-right pr-4">Akce</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lines.map((l) => (
                  <TableRow key={`${l.period}-${l.item_id}`}>
                    <TableCell className="whitespace-nowrap pl-4 text-muted-foreground">
                      {formatMonth(l.period)}
                    </TableCell>
                    <TableCell className="max-w-0 truncate text-foreground" title={l.item_name}>
                      {l.item_name}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">{l.line_count}</Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right text-muted-foreground">
                      {formatCurrency(l.total_amount)}
                    </TableCell>
                    <TableCell className="pr-4">
                      <div className="flex items-center justify-end gap-1">
                        <IgnoreLineButton itemId={l.item_id} itemName={l.item_name} />
                        <AddServiceDialog
                          itemId={l.item_id}
                          itemName={l.item_name}
                          categories={categories}
                          buckets={buckets}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <Empty className="border border-dashed border-border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Check className="size-5" />
              </EmptyMedia>
              <EmptyTitle>Vše vyřešeno</EmptyTitle>
              <EmptyDescription>Žádné nerozpoznané položky.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}

        {showIgnored && ignored.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-lg border border-dashed border-border p-3">
            <span className="text-xs font-medium text-muted-foreground">Ignorované položky</span>
            <div className="flex flex-col gap-2">
              {ignored.map((i) => (
                <div
                  key={i.item_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted/50 px-3 py-2"
                >
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm text-foreground">{i.item_name}</span>
                    <span className="text-xs text-muted-foreground">
                      {i.reason ? `${i.reason} · ` : ""}
                      {i.user_email ?? "—"} · {formatDateTime(i.at)}
                    </span>
                  </div>
                  <UnignoreButton itemId={i.item_id} itemName={i.item_name} />
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
