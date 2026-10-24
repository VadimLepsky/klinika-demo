"use client"

import { useState, useTransition } from "react"
import { EyeOff } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ignoreUnmatchedLine } from "@/app/(app)/attention/actions"
import { useI18n } from "@/lib/i18n/client"

export function IgnoreLineButton({ itemId, itemName }: { itemId: string; itemName: string }) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState("")
  const [pending, startTransition] = useTransition()

  const confirm = () => {
    startTransition(async () => {
      const res = await ignoreUnmatchedLine(itemId, reason)
      if (res.ok) {
        toast.success(t("«{name}» byla skryta ze seznamu.", { name: t(itemName) }))
        setOpen(false)
      } else toast.error(res.error)
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="sm">
            <EyeOff data-icon="inline-start" />
            {t("Ignorovat")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Ignorovat položku")}</DialogTitle>
          <DialogDescription>
            {t("«{name}» zmizí z tohoto seznamu a nebude blokovat uzávěrku období. Akci lze vrátit přes «Zobrazit ignorované».", { name: t(itemName) })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-2">
          <Label htmlFor="ignore-reason">{t("Důvod (nepovinné)")}</Label>
          <Input
            id="ignore-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={t("např. testovací položka, už se neprodává")}
            disabled={pending}
          />
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">{t("Zrušit")}</Button>} />
          <Button onClick={confirm} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {t("Ignorovat")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
