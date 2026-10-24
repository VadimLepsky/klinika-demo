"use client"

import { useState, useTransition } from "react"
import { Pencil } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
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
import { updateBucketLabel } from "@/app/(app)/settings/actions"
import { useI18n } from "@/lib/i18n/client"

export function EditBucketDialog({
  bucket,
  label,
  beneficiary,
}: {
  bucket: string
  label: string
  beneficiary: string
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(label)
  const [pending, startTransition] = useTransition()

  const save = () => {
    startTransition(async () => {
      const res = await updateBucketLabel(bucket, value)
      if (res.ok) {
        toast.success(t("Název pravidla byl aktualizován."))
        setOpen(false)
      } else {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v)
        if (v) setValue(label)
      }}
    >
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <Pencil data-icon="inline-start" />
            {t("Přejmenovat")}
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("Upravit pravidlo")}</DialogTitle>
          <DialogDescription>{t("Klíč a příjemce jsou po vytvoření neměnné.")}</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="edit-bucket-label">{t("Název")}</FieldLabel>
            <Input
              id="edit-bucket-label"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-bucket-key">{t("Klíč")}</FieldLabel>
            <Input id="edit-bucket-key" value={bucket} disabled className="font-mono" />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-bucket-beneficiary">{t("Příjemce")}</FieldLabel>
            <Input
              id="edit-bucket-beneficiary"
              value={beneficiary === "source" ? t("Odesílající") : t("Provádějící")}
              disabled
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">{t("Zrušit")}</Button>} />
          <Button onClick={save} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {t("Uložit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
