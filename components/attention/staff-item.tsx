"use client"

import { useTransition } from "react"
import { UserCheck, UserX } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { flagStaff } from "@/app/(app)/attention/actions"
import { useI18n } from "@/lib/i18n/client"
import type { UnflaggedStaff } from "@/lib/queries/attention"

export function StaffItem({ staff }: { staff: UnflaggedStaff }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()

  const flag = (isDoctor: boolean) => {
    startTransition(async () => {
      const res = await flagStaff(staff.master_id, isDoctor)
      if (res.ok) {
        toast.success(
          isDoctor
            ? t("«{name}» byl(a) označen(a) jako lékař.", { name: staff.full_name })
            : t("«{name}» byl(a) označen(a) jako nelékař.", { name: staff.full_name }),
        )
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <span className="font-medium text-foreground text-pretty">{t(staff.full_name)}</span>
        {staff.note ? <span className="text-xs text-muted-foreground">{t(staff.note)}</span> : null}
      </div>
      <div className="flex gap-2">
        <Button size="sm" onClick={() => flag(true)} disabled={pending}>
          {pending ? <Spinner data-icon="inline-start" /> : <UserCheck data-icon="inline-start" />}
          {t("Lékař")}
        </Button>
        <Button size="sm" variant="outline" onClick={() => flag(false)} disabled={pending}>
          <UserX data-icon="inline-start" />
          {t("Není lékař")}
        </Button>
      </div>
    </div>
  )
}
