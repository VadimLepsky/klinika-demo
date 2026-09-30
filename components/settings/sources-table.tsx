"use client"

import { useMemo, useState, useTransition } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateSource } from "@/app/(app)/settings/actions"
import type { SourceRow } from "@/lib/queries/settings"
import type { StaffOption } from "@/lib/queries/attention"

const STATUS_LABEL: Record<string, string> = {
  doctor: "Lékař",
  non_commission: "Bez provize",
  unmapped: "Nepřiřazeno",
}

function SourceRowItem({ row, doctors }: { row: SourceRow; doctors: StaffOption[] }) {
  const [status, setStatus] = useState(row.status)
  const [master, setMaster] = useState(row.master_id ?? "")
  const [note] = useState(row.note ?? "")
  const [pending, startTransition] = useTransition()

  const dirty =
    status !== row.status || (master || null) !== row.master_id || (note || "") !== (row.note ?? "")

  const doctorItems = useMemo(
    () => Object.fromEntries(doctors.map((d) => [d.master_id, d.full_name])),
    [doctors],
  )

  const save = () => {
    startTransition(async () => {
      const res = await updateSource(row.source_id, status, master || null, note || null)
      if (res.ok) toast.success(`Zdroj «${row.label}» uložen.`)
      else toast.error(res.error)
    })
  }

  return (
    <TableRow>
      <TableCell className="max-w-0 truncate pl-4 font-medium text-foreground" title={row.label}>
        {row.label}
      </TableCell>
      <TableCell>
        <Select value={status} onValueChange={setStatus} disabled={pending} items={STATUS_LABEL}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="doctor">Lékař</SelectItem>
              <SelectItem value="non_commission">Bez provize</SelectItem>
              <SelectItem value="unmapped">Nepřiřazeno</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Select
          value={master}
          onValueChange={setMaster}
          disabled={pending || status !== "doctor"}
          items={doctorItems}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {doctors.map((d) => (
                <SelectItem key={d.master_id} value={d.master_id}>
                  {d.full_name}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
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

export function SourcesTable({ sources, doctors }: { sources: SourceRow[]; doctors: StaffOption[] }) {
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return sources
    return sources.filter(
      (s) =>
        s.label.toLowerCase().includes(needle) ||
        (s.doctor_name ?? "").toLowerCase().includes(needle),
    )
  }, [q, sources])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <InputGroup className="w-full max-w-sm">
          <InputGroupInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat zdroj nebo lékaře…"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Badge variant="secondary">{filtered.length}</Badge>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="table-fixed w-full min-w-[900px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Zdroj</TableHead>
              <TableHead className="w-[150px]">Stav</TableHead>
              <TableHead className="w-[220px]">Lékař</TableHead>
              <TableHead className="w-[110px] text-right pr-4">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((s) => <SourceRowItem key={s.source_id} row={s} doctors={doctors} />)
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Dotazu neodpovídá žádný zdroj.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}

export { STATUS_LABEL }
