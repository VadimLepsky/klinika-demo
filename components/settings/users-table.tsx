"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { UserPlus } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { InviteUserDialog } from "@/components/settings/invite-user-dialog"
import { DeleteUserButton } from "@/components/settings/delete-user-button"
import { changeUserRole } from "@/app/(app)/settings/users/actions"
import { formatDateTime } from "@/lib/format"
import type { AppUser } from "@/lib/queries/users"
import type { Role } from "@/lib/session"

const ROLE_ITEMS = { admin: "Administrátor", viewer: "Prohlížení" }

function RoleCell({ user, isSelf }: { user: AppUser; isSelf: boolean }) {
  const [role, setRole] = useState<Role>(user.role)
  const [pending, startTransition] = useTransition()

  const onChange = (next: Role | null) => {
    if (!next) return
    const prev = role
    setRole(next)
    startTransition(async () => {
      const res = await changeUserRole(user.id, next)
      if (res.ok) {
        toast.success(`Role «${user.full_name}» byla aktualizována.`)
      } else {
        setRole(prev)
        toast.error(res.error)
      }
    })
  }

  const select = (
    <Select value={role} onValueChange={onChange} disabled={isSelf || pending} items={ROLE_ITEMS}>
      <SelectTrigger className="w-[180px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value="admin">Administrátor</SelectItem>
          <SelectItem value="viewer">Prohlížení</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  )

  if (isSelf) {
    return (
      <Tooltip>
        <TooltipTrigger render={<span className="inline-block cursor-not-allowed" />}>{select}</TooltipTrigger>
        <TooltipContent>Nelze změnit vlastní roli</TooltipContent>
      </Tooltip>
    )
  }
  return select
}

export function UsersTable({ users, currentUserId }: { users: AppUser[]; currentUserId: string }) {
  const router = useRouter()
  const adminCount = users.filter((u) => u.role === "admin").length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="secondary">{users.length}</Badge>
        <InviteUserDialog
          onInvited={() => router.refresh()}
          trigger={
            <Button size="sm">
              <UserPlus data-icon="inline-start" />
              Pozvat uživatele
            </Button>
          }
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="table-fixed w-full min-w-[820px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Uživatel</TableHead>
              <TableHead className="w-[230px]">E-mail</TableHead>
              <TableHead className="w-[200px]">Role</TableHead>
              <TableHead className="w-[150px]">Přidán</TableHead>
              <TableHead className="w-[160px]">Pozval</TableHead>
              <TableHead className="w-[56px] pr-4 text-right">
                <span className="sr-only">Akce</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length > 0 ? (
              users.map((u) => {
                const isSelf = u.id === currentUserId
                const isLastAdmin = u.role === "admin" && adminCount <= 1
                const inviter = u.inviter_name ?? u.inviter_email
                const deleteDisabledReason = isSelf
                  ? "Nelze smazat vlastní účet"
                  : isLastAdmin
                    ? "Nelze smazat posledního administrátora"
                    : undefined
                return (
                  <TableRow key={u.id}>
                    <TableCell className="max-w-0 truncate pl-4 font-medium text-foreground" title={u.full_name}>
                      <span className="flex items-center gap-2">
                        <span className="truncate">{u.full_name}</span>
                        {isSelf ? (
                          <Badge variant="outline" className="shrink-0">
                            Vy
                          </Badge>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-0 truncate text-muted-foreground" title={u.email}>
                      {u.email}
                    </TableCell>
                    <TableCell>
                      <RoleCell user={u} isSelf={isSelf} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(u.created_at)}
                    </TableCell>
                    <TableCell className="max-w-0 truncate text-muted-foreground" title={inviter ?? undefined}>
                      {inviter ?? "—"}
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <DeleteUserButton
                        userId={u.id}
                        fullName={u.full_name}
                        disabledReason={deleteDisabledReason}
                        onDeleted={() => router.refresh()}
                      />
                    </TableCell>
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  Žádní uživatelé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
