"use client"

import { useEffect, useMemo, useState } from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CreateBucketDialog } from "@/components/settings/create-bucket-dialog"
import type { BucketOption } from "@/lib/queries/attention"

const CREATE_SENTINEL = "__create__"

/**
 * Bucket <select> with a built-in "+ Vytvořit novou" option that opens the
 * bucket creation dialog inline and preselects the newly created bucket.
 */
export function BucketSelect({
  buckets: initialBuckets,
  value,
  onValueChange,
  disabled,
  placeholder,
  className,
  extraOptions = [],
}: {
  buckets: BucketOption[]
  value: string
  onValueChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
  className?: string
  extraOptions?: { value: string; label: string }[]
}) {
  const [buckets, setBuckets] = useState(initialBuckets)
  const [createOpen, setCreateOpen] = useState(false)

  useEffect(() => {
    setBuckets(initialBuckets)
  }, [initialBuckets])

  const items = useMemo(() => {
    const map: Record<string, string> = {}
    for (const b of buckets) map[b.bucket] = b.label
    for (const o of extraOptions) map[o.value] = o.label
    map[CREATE_SENTINEL] = "+ Vytvořit novou"
    return map
  }, [buckets, extraOptions])

  const handleChange = (v: string) => {
    if (v === CREATE_SENTINEL) {
      setCreateOpen(true)
      return
    }
    onValueChange(v)
  }

  return (
    <>
      <Select value={value} onValueChange={handleChange} disabled={disabled} items={items}>
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {buckets.map((b) => (
              <SelectItem key={b.bucket} value={b.bucket}>
                {b.label}
              </SelectItem>
            ))}
            {extraOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectGroup>
          <SelectSeparator />
          <SelectGroup>
            <SelectItem value={CREATE_SENTINEL} className="text-primary">
              <Plus className="size-3.5" />
              Vytvořit novou
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <CreateBucketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(bucket) => {
          setBuckets((prev) => [...prev, bucket])
          onValueChange(bucket.bucket)
        }}
      />
    </>
  )
}
