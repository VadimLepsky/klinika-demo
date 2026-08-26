"use client"

import { useTransition } from "react"
import { UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { flagStaff } from "@/app/(app)/attention/actions"
import type { UnflaggedStaff } from "@/lib/queries/attention"

export function StaffItem({ staff }: { staff: UnflaggedStaff }) {
  const [pending, startTransition] = useTransition()

  const flag = (isDoctor: boolean) => {
    startTransition(async () => {
      const res = await flagStaff(staff.master_id, isDoctor)
      if (res.ok) {
        toast.success(
          isDoctor
            ? `«${staff.full_name}» byl(a) označen(a) jako lékař.`
            : `«${staff.full_name}» byl(a) označen(a) jako nelékař.`,
        )
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground text-pretty">{staff.full_name}</span>
        {staff.note ? <span className="text-xs text-muted-foreground">{staff.note}</span> : null}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => flag(true)} disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : <UserCheck data-icon="inline-start" />}
          Lékař
        </Button>
        <Button size="sm" variant="outline" onClick={() => flag(false)} disabled={pending}>
          <UserX data-icon="inline-start" />
          Není lékař
        </Button>
      </div>
    </div>
  )
}
