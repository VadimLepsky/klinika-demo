"use client"

import { useState, useTransition } from "react"
import { Check, Ban } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { BucketSelect } from "@/components/settings/bucket-select"
import { mapCategory } from "@/app/(app)/attention/actions"
import type { BucketOption, NewCategory } from "@/lib/queries/attention"

const NON_COMMISSION = "__none__"

export function CategoryItem({
  category,
  buckets,
}: {
  category: NewCategory
  buckets: BucketOption[]
}) {
  const [selected, setSelected] = useState<string>("")
  const [pending, startTransition] = useTransition()

  // valid_from = first day of the affected month (YYYY-MM -> YYYY-MM-01).
  const validFrom = `${category.affected_month}-01`

  const apply = () => {
    if (!selected) {
      toast.error("Zvolte skupinu nebo «Bez provize».")
      return
    }
    const bucket = selected === NON_COMMISSION ? null : selected
    startTransition(async () => {
      const res = await mapCategory(category.category_id, bucket, validFrom)
      if (res.ok) toast.success(`Kategorie «${category.example_name}» byla přiřazena.`)
      else toast.error(res.error)
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-foreground text-pretty">{category.example_name}</span>
        <Badge variant="secondary">{category.line_count} pol.</Badge>
      </div>
      <span className="text-xs text-muted-foreground">
        Platí od {category.affected_month}
      </span>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <BucketSelect
          buckets={buckets}
          value={selected}
          onValueChange={setSelected}
          disabled={pending}
          placeholder="Zvolte skupinu"
          className="sm:w-[260px]"
          extraOptions={[{ value: NON_COMMISSION, label: "Bez provize" }]}
        />
        <Button size="sm" onClick={apply} disabled={pending}>
          {pending ? (
            <Spinner data-icon="inline-start" />
          ) : selected === NON_COMMISSION ? (
            <Ban data-icon="inline-start" />
          ) : (
            <Check data-icon="inline-start" />
          )}
          Použít
        </Button>
      </div>
    </div>
  )
}
