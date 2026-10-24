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
import { deleteUser } from "@/lib/user-actions"
import { useI18n } from "@/lib/i18n/client"

export function DeleteUserButton({
  userId,
  fullName,
  disabledReason,
  onDeleted,
}: {
  userId: string
  fullName: string
  /** When set, the button is disabled and this text is shown in a tooltip. */
  disabledReason?: string
  onDeleted?: () => void
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()

  const confirm = () => {
    startTransition(async () => {
      try {
        await deleteUser(userId)
        toast.success(t("Uživatel «{name}» byl smazán.", { name: fullName }))
        setOpen(false)
        onDeleted?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("Chyba při mazání"))
      }
    })
  }

  if (disabledReason) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span tabIndex={0} className="inline-block cursor-not-allowed">
              <Button variant="ghost" size="icon" disabled aria-label={t("Smazat uživatele")}>
                <Trash2 />
              </Button>
            </span>
          }
        />
        <TooltipContent>{disabledReason}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        aria-label={t("Smazat uživatele")}
        onClick={() => setOpen(true)}
        className="text-muted-foreground hover:text-destructive"
      >
        <Trash2 />
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("Smazat uživatele {name}?", { name: fullName })}</AlertDialogTitle>
            <AlertDialogDescription>{t("Přístup bude zrušen. Historie změn zůstane zachována.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>{t("Zrušit")}</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={confirm} disabled={pending}>
              {pending ? <Spinner data-icon="inline-start" /> : null}
              {t("Smazat")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
