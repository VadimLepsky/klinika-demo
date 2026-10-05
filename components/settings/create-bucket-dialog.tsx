"use client"

import { useEffect, useState, useTransition } from "react"
import { Plus } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldGroup, FieldLabel, FieldDescription } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { createBucket } from "@/app/(app)/settings/actions"
import { nextMonthValue, monthInputToDate, slugify } from "@/lib/format"

const BENEFICIARY_ITEMS = { source: "Odesílající", performer: "Provádějící" }

export function CreateBucketDialog({
  trigger,
  open: openProp,
  onOpenChange: onOpenChangeProp,
  onCreated,
}: {
  /** Renders a built-in DialogTrigger with this node. Omit when opening is controlled externally. */
  trigger?: React.ReactElement
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onCreated?: (bucket: { bucket: string; label: string }) => void
}) {
  const isControlled = openProp !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? openProp : internalOpen
  const setOpen = (v: boolean) => {
    onOpenChangeProp?.(v)
    if (!isControlled) setInternalOpen(v)
  }

  const [label, setLabel] = useState("")
  const [key, setKey] = useState("")
  const [keyTouched, setKeyTouched] = useState(false)
  const [beneficiary, setBeneficiary] = useState<string>("source")
  const [ratePct, setRatePct] = useState("")
  const [month, setMonth] = useState(nextMonthValue())
  const [pending, startTransition] = useTransition()

  useEffect(() => {
    if (!open) {
      setLabel("")
      setKey("")
      setKeyTouched(false)
      setBeneficiary("source")
      setRatePct("")
      setMonth(nextMonthValue())
    }
  }, [open])

  const onLabelChange = (value: string) => {
    setLabel(value)
    if (!keyTouched) setKey(slugify(value))
  }

  const save = () => {
    const pct = Number.parseFloat(ratePct.replace(",", "."))
    if (!Number.isFinite(pct)) {
      toast.error("Zadejte platnou sazbu.")
      return
    }
    startTransition(async () => {
      const res = await createBucket(label, key, beneficiary as "source" | "performer", pct, monthInputToDate(month))
      if (res.ok && res.bucket) {
        toast.success(`Pravidlo «${res.bucket.label}» bylo vytvořeno.`)
        onCreated?.(res.bucket)
        setOpen(false)
      } else if (!res.ok) {
        toast.error(res.error)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? <DialogTrigger render={trigger} /> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nové pravidlo</DialogTitle>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="bucket-label">Název</FieldLabel>
            <Input
              id="bucket-label"
              value={label}
              onChange={(e) => onLabelChange(e.target.value)}
              placeholder="např. Laboratoř Synlab"
              disabled={pending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="bucket-key">Klíč</FieldLabel>
            <Input
              id="bucket-key"
              value={key}
              onChange={(e) => {
                setKeyTouched(true)
                setKey(e.target.value.toLowerCase())
              }}
              placeholder="např. synlab"
              disabled={pending}
              className="font-mono"
            />
            <FieldDescription>
              Pouze malá písmena bez diakritiky, číslice a podtržítka. Po vytvoření neměnný.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel htmlFor="bucket-beneficiary">Příjemce</FieldLabel>
            <Select value={beneficiary} onValueChange={setBeneficiary} disabled={pending} items={BENEFICIARY_ITEMS}>
              <SelectTrigger id="bucket-beneficiary" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectItem value="source">Odesílající</SelectItem>
                  <SelectItem value="performer">Provádějící</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor="bucket-rate">Počáteční sazba, %</FieldLabel>
            <Input
              id="bucket-rate"
              inputMode="decimal"
              value={ratePct}
              onChange={(e) => setRatePct(e.target.value)}
              placeholder="např. 7"
              disabled={pending}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="bucket-valid-from">Platí od</FieldLabel>
            <Input
              id="bucket-valid-from"
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              disabled={pending}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <DialogClose render={<Button variant="ghost">Zrušit</Button>} />
          <Button onClick={save} disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <Plus data-icon="inline-start" />}
            Vytvořit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
