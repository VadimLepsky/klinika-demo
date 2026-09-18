"use client"

import { useState, useTransition } from "react"
import { Check, Copy, ShieldCheck } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { Field, FieldDescription, FieldGroup, FieldLabel } from "@/components/ui/field"
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { inviteUser } from "@/lib/user-actions"

const ROLE_ITEMS = { admin: "Administrátor", viewer: "Prohlížení" }

export function InviteUserDialog({
  trigger,
  onInvited,
}: {
  trigger: React.ReactElement
  onInvited?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [role, setRole] = useState("viewer")
  const [tempPassword, setTempPassword] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [pending, startTransition] = useTransition()

  const reset = () => {
    setFullName("")
    setEmail("")
    setRole("viewer")
    setTempPassword(null)
    setCopied(false)
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) reset()
  }

  const save = () => {
    if (!fullName.trim() || !email.trim()) {
      toast.error("Vyplňte jméno a e-mail.")
      return
    }
    const fd = new FormData()
    fd.set("full_name", fullName.trim())
    fd.set("email", email.trim())
    fd.set("role", role)
    startTransition(async () => {
      try {
        const res = await inviteUser(fd)
        setTempPassword(res.tempPassword)
        onInvited?.()
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Uživatele se nepodařilo vytvořit.")
      }
    })
  }

  const copy = async () => {
    if (!tempPassword) return
    try {
      await navigator.clipboard.writeText(tempPassword)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error("Nepodařilo se zkopírovat.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={trigger} />
      <DialogContent>
        {tempPassword ? (
          <>
            <DialogHeader>
              <DialogTitle>Uživatel byl vytvořen</DialogTitle>
              <DialogDescription>
                Předejte dočasné heslo kolegovi osobně. Po zavření okna se už nezobrazí.
              </DialogDescription>
            </DialogHeader>

            <Field>
              <FieldLabel htmlFor="temp-password">Dočasné heslo</FieldLabel>
              <div className="flex items-center gap-2">
                <Input
                  id="temp-password"
                  readOnly
                  value={tempPassword}
                  className="font-mono"
                  onFocus={(e) => e.currentTarget.select()}
                />
                <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Zkopírovat heslo">
                  {copied ? <Check /> : <Copy />}
                </Button>
              </div>
              <FieldDescription>Uložte si ho hned — dál se už nezobrazí.</FieldDescription>
            </Field>

            <DialogFooter>
              <DialogClose render={<Button>Hotovo</Button>} />
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Pozvat uživatele</DialogTitle>
              <DialogDescription>
                Vytvoří se účet s dočasným heslem, které uvidíte jen jednou.
              </DialogDescription>
            </DialogHeader>

            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="invite-name">Celé jméno</FieldLabel>
                <Input
                  id="invite-name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="např. Helena Kovářová"
                  disabled={pending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-email">E-mail</FieldLabel>
                <Input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="např. helena@demo.clinic"
                  disabled={pending}
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="invite-role">Role</FieldLabel>
                <Select
                  value={role}
                  onValueChange={(next) => next && setRole(next)}
                  disabled={pending}
                  items={ROLE_ITEMS}
                >
                  <SelectTrigger id="invite-role" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="admin">Administrátor</SelectItem>
                      <SelectItem value="viewer">Prohlížení</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
                <FieldDescription>
                  «Administrátor» může měnit data, «Prohlížení» jen číst.
                </FieldDescription>
              </Field>
            </FieldGroup>

            <DialogFooter>
              <DialogClose render={<Button variant="ghost">Zrušit</Button>} />
              <Button onClick={save} disabled={pending}>
                {pending ? <Spinner data-icon="inline-start" /> : <ShieldCheck data-icon="inline-start" />}
                Vytvořit
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
