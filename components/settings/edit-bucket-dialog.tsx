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

export function EditBucketDialog({
  bucket,
  label,
  beneficiary,
}: {
  bucket: string
  label: string
  beneficiary: string
}) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState(label)
  const [pending, startTransition] = useTransition()

  const save = () => {
    startTransition(async () => {
      const res = await updateBucketLabel(bucket, value)
      if (res.ok) {
        toast.success("Název pravidla byl aktualizován.")
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
            Přejmenovat
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upravit pravidlo</DialogTitle>
          <DialogDescription>Klíč a příjemce jsou po vytvoření neměnné.</DialogDescription>
        </DialogHeader>
        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="edit-bucket-label">Název</FieldLabel>
            <Input
              id="edit-bucket-label"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              disabled={pending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-bucket-key">Klíč</FieldLabel>
            <Input id="edit-bucket-key" value={bucket} disabled className="font-mono" />
          </Field>
          <Field>
            <FieldLabel htmlFor="edit-bucket-beneficiary">Příjemce</FieldLabel>
            <Input
              id="edit-bucket-beneficiary"
              value={beneficiary === "source" ? "Doporučující" : "Vykonavatel"}
              disabled
            />
          </Field>
        </FieldGroup>
        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Zrušit</Button>} />
          <Button onClick={save} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            Uložit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
