"use client"

import { useMemo, useState, useTransition } from "react"
import { Link2, Ban } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { mapSourceToDoctor, markSourceNonCommission } from "@/app/(app)/attention/actions"
import type { StaffOption, UnmappedSource } from "@/lib/queries/attention"

export function SourceItem({ source, doctors }: { source: UnmappedSource; doctors: StaffOption[] }) {
  const [selected, setSelected] = useState<string>(source.suggestion?.master_id ?? "")
  const [pending, startTransition] = useTransition()

  const items = useMemo(
    () => Object.fromEntries(doctors.map((d) => [d.master_id, d.full_name])),
    [doctors],
  )

  const link = () => {
    if (!selected) {
      toast.error("Zvolte lékaře pro přiřazení.")
      return
    }
    startTransition(async () => {
      const res = await mapSourceToDoctor(source.source_id, selected)
      if (res.ok) toast.success(`Zdroj «${source.label}» byl přiřazen k lékaři.`)
      else toast.error(res.error)
    })
  }

  const nonCommission = () => {
    startTransition(async () => {
      const res = await markSourceNonCommission(source.source_id)
      if (res.ok) toast.success(`Zdroj «${source.label}» byl označen jako bez provize.`)
      else toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground text-pretty">{source.label}</span>
        {source.suggestion ? (
          <span className="text-xs text-muted-foreground">
            Podobá se: <span className="text-foreground">{source.suggestion.full_name}</span>
          </span>
        ) : (
          <span className="text-xs text-muted-foreground">Mezi lékaři nebyla nalezena shoda</span>
        )}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select value={selected} onValueChange={setSelected} disabled={pending} items={items}>
          <SelectTrigger className="w-full sm:w-[260px]">
            <SelectValue placeholder="Zvolte lékaře" />
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

        <div className="flex gap-2">
          <Button size="sm" onClick={link} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <Link2 data-icon="inline-start" />}
            Přiřadit
          </Button>
          <Button size="sm" variant="outline" onClick={nonCommission} disabled={pending}>
            <Ban data-icon="inline-start" />
            Bez provize
          </Button>
        </div>
      </div>
    </div>
  )
}
