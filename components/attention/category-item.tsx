"use client"

import { useState, useTransition } from "react"
import { Check, Ban } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { BucketSelect } from "@/components/settings/bucket-select"
import { mapCategory } from "@/app/(app)/attention/actions"
import { useI18n } from "@/lib/i18n/client"
import type { BucketOption, NewCategory } from "@/lib/queries/attention"

const NON_COMMISSION = "__none__"

export function CategoryItem({
  category,
  buckets,
}: {
  category: NewCategory
  buckets: BucketOption[]
}) {
  const { t } = useI18n()
  const [selected, setSelected] = useState<string>("")
  const [pending, startTransition] = useTransition()

  // valid_from = first day of the affected month (YYYY-MM -> YYYY-MM-01).
  const validFrom = `${category.affected_month}-01`

  const apply = () => {
    if (!selected) {
      toast.error(t("Zvolte pravidlo nebo «Bez provize»."))
      return
    }
    const bucket = selected === NON_COMMISSION ? null : selected
    startTransition(async () => {
      const res = await mapCategory(category.category_id, bucket, validFrom)
      if (res.ok) toast.success(t("Kategorie «{name}» byla přiřazena.", { name: t(category.example_name) }))
      else toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-foreground text-pretty">{t(category.example_name)}</span>
        <Badge variant="secondary">{t("{n} pol.", { n: category.line_count })}</Badge>
      </div>
      <span className="text-xs text-muted-foreground">
        {t("Platí od {date}", { date: category.affected_month })}
      </span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <BucketSelect
          buckets={buckets}
          value={selected}
          onValueChange={setSelected}
          disabled={pending}
          placeholder={t("Zvolte pravidlo")}
          className="sm:w-[260px]"
          extraOptions={[{ value: NON_COMMISSION, label: t("Bez provize") }]}
        />
        <Button size="sm" onClick={apply} disabled={pending}>
          {pending ? (
            <Spinner data-icon="inline-start" />
          ) : selected === NON_COMMISSION ? (
            <Ban data-icon="inline-start" />
          ) : (
            <Check data-icon="inline-start" />
          )}
          {t("Použít")}
        </Button>
      </div>
    </div>
  )
}
