"use client"

import { useState, useTransition } from "react"
import { PackagePlus } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BucketSelect } from "@/components/settings/bucket-select"
import { addUnmatchedService } from "@/app/(app)/attention/actions"
import type { BucketOption, ExistingCategory } from "@/lib/queries/attention"

export function AddServiceDialog({
  itemId,
  itemName,
  categories,
  buckets,
}: {
  itemId: string
  itemName: string
  categories: ExistingCategory[]
  buckets: BucketOption[]
}) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<"category" | "bucket">("category")
  const [categoryId, setCategoryId] = useState("")
  const [bucket, setBucket] = useState("")
  const [pending, startTransition] = useTransition()

  const categoryItems = categories.reduce<Record<string, string>>((acc, c) => {
    acc[c.category_id] = c.category_name
    return acc
  }, {})

  const save = () => {
    if (mode === "category") {
      if (!categoryId) {
        toast.error("Zvolte kategorii.")
        return
      }
      startTransition(async () => {
        const res = await addUnmatchedService(itemId, itemName, { mode: "category", categoryId })
        if (res.ok) {
          toast.success("Služba byla přidána do číselníku.")
          setOpen(false)
        } else toast.error(res.error)
      })
    } else {
      if (!bucket) {
        toast.error("Zvolte pravidlo.")
        return
      }
      startTransition(async () => {
        const res = await addUnmatchedService(itemId, itemName, { mode: "bucket", bucket })
        if (res.ok) {
          toast.success("Služba byla přidána do číselníku.")
          setOpen(false)
        } else toast.error(res.error)
      })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm">
            <PackagePlus data-icon="inline-start" />
            Přidat službu
          </Button>
        }
      />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Přidat službu do číselníku</DialogTitle>
          <DialogDescription>
            Položka se zaregistruje v číselníku služeb a z této karty zmizí.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="service-name">Název služby</Label>
            <Input id="service-name" value={itemName} readOnly disabled className="text-muted-foreground" />
          </div>

          <Tabs value={mode} onValueChange={(v) => setMode(v as "category" | "bucket")}>
            <TabsList className="w-full">
              <TabsTrigger value="category" className="flex-1">
                Kategorie
              </TabsTrigger>
              <TabsTrigger value="bucket" className="flex-1">
                Pravidlo přímo
              </TabsTrigger>
            </TabsList>
            <TabsContent value="category" className="pt-3">
              <div className="flex flex-col gap-2">
                <Label>Kategorie (zdědí její pravidlo)</Label>
                <Select value={categoryId} onValueChange={setCategoryId} disabled={pending} items={categoryItems}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Zvolte kategorii" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {categories.map((c) => (
                        <SelectItem key={c.category_id} value={c.category_id}>
                          {c.category_name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
            <TabsContent value="bucket" className="pt-3">
              <div className="flex flex-col gap-2">
                <Label>Pravidlo (výjimka jen pro tuto službu)</Label>
                <BucketSelect
                  buckets={buckets}
                  value={bucket}
                  onValueChange={setBucket}
                  disabled={pending}
                  placeholder="Zvolte pravidlo"
                />
              </div>
            </TabsContent>
          </Tabs>
        </div>

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
