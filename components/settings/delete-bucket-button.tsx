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

export function DeleteBucketButton({
  bucket,
  label,
  canDelete,
}: {
  bucket: string
  label: string
  canDelete: boolean
}) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const confirm = () => {
    startTransition(async () => {
      const res = await deleteBucket(bucket)
      if (res.ok) {
        toast.success(`Pravidlo «${label}» bylo smazáno.`)
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
                Smazat
              </Button>
            </span>
          }
        />
        <TooltipContent>Pravidlo se používá — má kategorie nebo provize.</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Trash2 data-icon="inline-start" />
        Smazat
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Smazat «{label}»?</AlertDialogTitle>
            <AlertDialogDescription>Tuto akci nelze vrátit zpět.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Zrušit</AlertDialogCancel>
            <AlertDialogAction onClick={confirm} disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              Smazat
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
