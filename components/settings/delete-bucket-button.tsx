"use client"

import { useState, useTransition } from "react"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { deleteBucket } from "@/app/(app)/settings/actions"
import { useI18n } from "@/lib/i18n/client"

export function DeleteBucketButton({
  bucket,
  label,
  canDelete,
}: {
  bucket: string
  label: string
  canDelete: boolean
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const confirm = () => {
    startTransition(async () => {
      const res = await deleteBucket(bucket)
      if (res.ok) {
        toast.success(t("Pravidlo «{name}» bylo smazáno.", { name: t(label) }))
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  if (!canDelete) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span tabIndex={0} className="inline-block">
              <Button variant="outline" size="sm" disabled>
                <Trash2 data-icon="inline-start" />
                {t("Smazat")}
              </Button>
            </span>
          }
        />
        <TooltipContent>{t("Pravidlo se používá — má kategorie nebo provize.")}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 data-icon="inline-start" />
        {t("Smazat")}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Smazat «{name}»?", { name: t(label) })}</AlertDialogTitle>
            <AlertDialogDescription>{t("Tuto akci nelze vrátit zpět.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("Zrušit")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {t("Smazat")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
