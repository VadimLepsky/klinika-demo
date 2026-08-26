"use client"

import { useMemo, useState, useTransition } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { updateStaff } from "@/app/(app)/settings/actions"
import type { StaffRow } from "@/lib/queries/settings"

const DOCTOR_YES = "yes"
const DOCTOR_NO = "no"
const DOCTOR_UNSET = "unset"

const DOCTOR_ITEMS: Record<string, string> = {
  [DOCTOR_YES]: "Lékař",
  [DOCTOR_NO]: "Není lékař",
  [DOCTOR_UNSET]: "Neurčeno",
}

function flagToValue(v: boolean | null): string {
  if (v === true) return DOCTOR_YES
  if (v === false) return DOCTOR_NO
  return DOCTOR_UNSET
}
function valueToFlag(v: string): boolean | null {
  if (v === DOCTOR_YES) return true
  if (v === DOCTOR_NO) return false
  return null
}

function StaffRowItem({ row }: { row: StaffRow }) {
  const [flag, setFlag] = useState(flagToValue(row.is_doctor))
  const [note, setNote] = useState(row.note ?? "")
  const [pending, startTransition] = useTransition()

  const dirty = flag !== flagToValue(row.is_doctor) || (note || "") !== (row.note ?? "")

  const save = () => {
    startTransition(async () => {
      const res = await updateStaff(row.master_id, valueToFlag(flag), note || null)
      if (res.ok) toast.success(`«${row.full_name}» uloženo.`)
      else toast.error(res.error)
    })
  }

  return (
    <TableRow>
      <TableCell
        className="max-w-0 truncate pl-4 font-medium text-foreground"
        title={row.full_name}
      >
        {row.full_name}
      </TableCell>
      <TableCell>
        <Select value={flag} onValueChange={setFlag} disabled={pending} items={DOCTOR_ITEMS}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={DOCTOR_YES}>Lékař</SelectItem>
              <SelectItem value={DOCTOR_NO}>Není lékař</SelectItem>
              <SelectItem value={DOCTOR_UNSET}>Neurčeno</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Poznámka"
          disabled={pending}
          title={note || undefined}
          className="w-full"
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

export function StaffTable({ staff }: { staff: StaffRow[] }) {
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return staff
    return staff.filter((s) => s.full_name.toLowerCase().includes(needle))
  }, [q, staff])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <InputGroup className="w-full max-w-sm">
          <InputGroupInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Hledat zaměstnance…"
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Badge variant="secondary">{filtered.length}</Badge>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="table-fixed w-full min-w-[760px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Zaměstnanec</TableHead>
              <TableHead className="w-[150px]">Označení</TableHead>
              <TableHead className="w-[220px]">Poznámka</TableHead>
              <TableHead className="w-[110px] text-right pr-4">Akce</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((s) => <StaffRowItem key={s.master_id} row={s} />)
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                  Dotazu neodpovídá žádný zaměstnanec.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
