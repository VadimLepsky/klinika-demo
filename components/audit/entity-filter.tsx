"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { useI18n } from "@/lib/i18n/client"
import { entityLabel } from "@/lib/labels"

const ALL = "__all__"

export function EntityFilter({ entities, current }: { entities: string[]; current: string }) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const onChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === ALL) params.delete("entity")
    else params.set("entity", value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  const items: Record<string, string> = { [ALL]: t("Všechny objekty") }
  for (const e of entities) items[e] = entityLabel(e, t)

  return (
    <Select value={current || ALL} onValueChange={onChange} items={items}>
      <SelectTrigger className="w-[220px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={ALL}>{t("Všechny objekty")}</SelectItem>
          {entities.map((e) => (
            <SelectItem key={e} value={e}>
              {entityLabel(e, t)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
