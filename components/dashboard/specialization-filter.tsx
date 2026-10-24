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
import type { Specialization } from "@/lib/queries/specializations"

const ALL = "all"

export function SpecializationFilter({
  options,
  current,
}: {
  options: Specialization[]
  current: string | null
}) {
  const { t } = useI18n()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const items: Record<string, string> = {
    [ALL]: t("Všechny specializace"),
    ...Object.fromEntries(options.map((o) => [o.id, t(o.name)])),
  }

  const onChange = (value: string | null) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!value || value === ALL) params.delete("spec")
    else params.set("spec", value)
    const qs = params.toString()
    router.push(qs ? `${pathname}?${qs}` : pathname)
  }

  return (
    <Select value={current ?? ALL} onValueChange={(v) => onChange(v as string | null)} items={items}>
      <SelectTrigger className="w-[220px]" aria-label={t("Specializace")}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={ALL}>{t("Všechny specializace")}</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {t(o.name)}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
