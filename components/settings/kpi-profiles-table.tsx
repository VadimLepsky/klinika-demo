"use client"

import { useTransition } from "react"
import { Pencil, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteKpiProfile, setKpiProfileActive } from "@/app/(app)/settings/kpi/actions"
import { KpiProfileEditDialog } from "@/components/settings/kpi-profile-edit-dialog"
import { useI18n } from "@/lib/i18n/client"
import type { KpiBandsByMetric } from "@/lib/kpi"
import type { KpiProfileWithCount } from "@/lib/queries/kpi"

const IN_USE_TOOLTIP = "Profil byl někdy přiřazen lékaři — deaktivujte ho místo smazání."

function DeleteButton({ profile }: { profile: KpiProfileWithCount }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()

  if (profile.ever_assigned) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={
            <span tabIndex={0} className="inline-flex">
              <Button variant="outline" size="sm" disabled className="pointer-events-none">
                <Trash2 data-icon="inline-start" />
                {t("Smazat")}
              </Button>
            </span>
          }
        />
        <TooltipContent>{t(IN_USE_TOOLTIP)}</TooltipContent>
      </Tooltip>
    )
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger
        render={
          <Button variant="outline" size="sm" disabled={pending}>
            {pending ? <Spinner data-icon="inline-start" /> : <Trash2 data-icon="inline-start" />}
            {t("Smazat")}
          </Button>
        }
      />
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("Smazat profil «{name}»?", { name: t(profile.name) })}</AlertDialogTitle>
          <AlertDialogDescription>{t("Tuto akci nelze vrátit zpět.")}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("Zrušit")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={() =>
              startTransition(async () => {
                const res = await deleteKpiProfile(profile.id)
                if (res.ok) toast.success(t("Profil «{name}» byl smazán.", { name: t(profile.name) }))
                else toast.error(res.error)
              })
            }
          >
            {t("Smazat")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

function ToggleActiveButton({ profile }: { profile: KpiProfileWithCount }) {
  const { t } = useI18n()
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await setKpiProfileActive(profile.id, !profile.active)
          if (res.ok) toast.success(profile.active ? t("Profil byl deaktivován.") : t("Profil byl aktivován."))
          else toast.error(res.error)
        })
      }
    >
      {pending ? <Spinner data-icon="inline-start" /> : null}
      {profile.active ? t("Deaktivovat") : t("Aktivovat")}
    </Button>
  )
}

export function KpiProfilesTable({
  profiles,
  bandsByProfile,
}: {
  profiles: KpiProfileWithCount[]
  bandsByProfile: Map<string, KpiBandsByMetric>
}) {
  const { t, formatRate } = useI18n()
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="w-full min-w-[900px]">
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">{t("Název")}</TableHead>
            <TableHead className="w-[110px] text-right">{t("Bonus")}</TableHead>
            <TableHead className="w-[110px] text-right">{t("Postih")}</TableHead>
            <TableHead className="w-[100px] text-right">{t("Lékařů")}</TableHead>
            <TableHead className="w-[140px]">{t("Stav")}</TableHead>
            <TableHead className="w-[300px] pr-4 text-right">{t("Akce")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {profiles.length > 0 ? (
            profiles.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="pl-4 font-medium text-foreground">{t(p.name)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRate(p.max_bonus)}</TableCell>
                <TableCell className="text-right tabular-nums">{formatRate(p.max_penalty)}</TableCell>
                <TableCell className="text-right tabular-nums">{p.doctor_count}</TableCell>
                <TableCell>
                  {p.active ? (
                    <Badge variant="secondary">{t("Aktivní")}</Badge>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">
                      {t("Neaktivní")}
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="pr-4">
                  <div className="flex items-center justify-end gap-2">
                    <KpiProfileEditDialog
                      profile={p}
                      initialBands={bandsByProfile.get(p.id)}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Pencil data-icon="inline-start" />
                          {t("Upravit")}
                        </Button>
                      }
                    />
                    <ToggleActiveButton profile={p} />
                    <DeleteButton profile={p} />
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                {t("Zatím žádný KPI profil.")}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
