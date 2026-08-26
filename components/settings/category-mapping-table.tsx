"use client"

import { useMemo, useState, useTransition } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { BucketSelect } from "@/components/settings/bucket-select"
import { mapCategory } from "@/app/(app)/attention/actions"
import { nextMonthValue, monthInputToDate } from "@/lib/format"
import type { CategoryMappingRow } from "@/lib/queries/settings"
import type { BucketOption } from "@/lib/queries/attention"

const NON_COMMISSION = "__none__"

function CategoryRowItem({
  row,
  buckets,
}: {
  row: CategoryMappingRow
  buckets: BucketOption[]
}) {
  const [selected, setSelected] = useState(row.bucket ?? NON_COMMISSION)
  const [pending, startTransition] = useTransition()

  const currentValue = row.bucket ?? NON_COMMISSION
  const dirty = selected !== currentValue

  const save = () => {
    const bucket = selected === NON_COMMISSION ? null : selected
    startTransition(async () => {
      const res = await mapCategory(row.category_id, bucket, monthInputToDate(nextMonthValue()))
      if (res.ok) toast.success(`Kategorie «${row.category_name}» byla aktualizována.`)
      else toast.error(res.error)
    })
  }

  return (
    <TableRow>
      <TableCell className="max-w-0 truncate pl-4 font-medium text-foreground" title={row.category_name}>
        {row.category_name}
      </TableCell>
      <TableCell>
        <BucketSelect
          buckets={buckets}
          value={selected}
          onValueChange={setSelected}
          disabled={pending}
          extraOptions={[{ value: NON_COMMISSION, label: "Bez provize" }]}
        />
      </TableCell>
      <TableCell className="whitespace-nowrap text-right pr-4">
        <Button size="sm" onClick={save} disabled={pending || !dirty}>
          {pending ? <Spinner data-icon="inline-start" /> : null}
          Uložit
        </Button>
      </TableCell>
    </TableRow>
  )
}

export function CategoryMappingTable({
  rows,
  buckets,
}: {
  rows: CategoryMappingRow[]
  buckets: BucketOption[]
}) {
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return rows
    return rows.filter((r) => r.category_name.toLowerCase().includes(needle))
  }, [q, rows])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <InputGroup className="w-full max-w-sm">
          <InputGroupInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat kategorii…"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Badge variant="secondary">{filtered.length}</Badge>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="table-fixed w-full min-w-[680px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Kategorie</TableHead>
              <TableHead className="w-[240px]">Skupina</TableHead>
              <TableHead className="w-[110px] text-right pr-4">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((r) => (
                <CategoryRowItem key={r.category_id} row={r} buckets={buckets} />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="py-8 text-center text-muted-foreground">
                  Dotazu neodpovídá žádná kategorie.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
