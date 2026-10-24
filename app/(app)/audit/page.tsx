import { ArrowRight, History } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { EntityFilter } from "@/components/audit/entity-filter"
import { ValueDiff } from "@/components/audit/value-diff"
import { getAuditEntities, getAuditLog } from "@/lib/queries/audit"
import { entityLabel } from "@/lib/labels"
import { getI18n } from "@/lib/i18n/server"

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t("Historie změn — demo.clinic") }
}

export const dynamic = "force-dynamic"

const ACTION_LABEL: Record<string, string> = {
  "rate.update": "Změna sazby",
  "source.map": "Zdroj přiřazen",
  "source.non_commission": "Zdroj bez provize",
  "source.update": "Zdroj aktualizován",
  "staff.flag": "Označení zaměstnance",
  "staff.update": "Zaměstnanec aktualizován",
  "category.map": "Kategorie přiřazena",
  "period.freeze": "Měsíc uzavřen",
  "service_exclusion.create": "Přidána výjimka",
  "service_exclusion.end": "Ukončena výjimka",
  "bucket.create": "Vytvořeno pravidlo",
  "bucket.update": "Změněno pravidlo",
  "bucket.delete": "Smazáno pravidlo",
  "unmatched.add_service": "Přidána služba",
  "unmatched.ignore": "Položka ignorována",
  "unmatched.unignore": "Položka vrácena",
  "user.invite": "Pozván uživatel",
  "user.delete": "Smazán uživatel",
  "user.role_change": "Změna role",
  "payout.mark": "Vyplaceno",
  "payout.unmark": "Zrušena výplata",
  "specialization.create": "Vytvořena specializace",
  "specialization.update": "Změněna specializace",
  "specialization.activate": "Specializace aktivována",
  "specialization.deactivate": "Specializace deaktivována",
  "specialization.delete": "Smazána specializace",
  "staff.specializations": "Specializace lékaře",
  "kpi_profile.create": "Vytvořen KPI profil",
  "kpi_profile.update": "Změněn KPI profil",
  "kpi_profile.activate": "KPI profil aktivován",
  "kpi_profile.deactivate": "KPI profil deaktivován",
  "kpi_profile.delete": "Smazán KPI profil",
  "doctor.kpi_profile": "KPI přiřazeno lékaři",
  "doctor.kpi_profile.delete": "Odebráno KPI přiřazení",
  "doctor_rate.update": "Osobní sazba lékaře",
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string }>
}) {
  const { entity } = await searchParams
  const { t, formatDateTime } = await getI18n()
  const [entities, entries] = await Promise.all([
    getAuditEntities(),
    getAuditLog(entity, 200),
  ])

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{t("Historie změn")}</h1>
        </div>
        <EntityFilter entities={entities} current={entity ?? ""} />
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4 text-muted-foreground" />
            {t("Poslední změny")}
          </CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto px-0 pb-0">
          <Table className="table-fixed w-full min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px] pl-6">{t("Kdy")}</TableHead>
                <TableHead className="w-[180px]">{t("Kdo")}</TableHead>
                <TableHead className="w-[170px]">{t("Akce")}</TableHead>
                <TableHead className="w-[160px]">{t("Objekt")}</TableHead>
                <TableHead>{t("Původně")}</TableHead>
                <TableHead className="pr-6">{t("Nově")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entries.length > 0 ? (
                entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="pl-6 whitespace-nowrap text-sm text-muted-foreground tabular-nums">
                      {formatDateTime(e.at)}
                    </TableCell>
                    <TableCell
                      className="max-w-0 truncate text-sm text-foreground"
                      title={e.user_email ?? t("systém")}
                    >
                      {e.user_email ?? t("systém")}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant="outline" className="font-normal">
                        {ACTION_LABEL[e.action] ? t(ACTION_LABEL[e.action]) : e.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-0 text-sm">
                      <span className="flex flex-col">
                        <span className="truncate text-foreground" title={entityLabel(e.entity, t)}>
                          {entityLabel(e.entity, t)}
                        </span>
                        {e.entity_id ? (
                          <span className="truncate text-xs text-muted-foreground tabular-nums">
                            #{e.entity_id}
                          </span>
                        ) : null}
                      </span>
                    </TableCell>
                    <TableCell className="align-top">
                      <ValueDiff value={e.old_value} />
                    </TableCell>
                    <TableCell className="pr-6 align-top">
                      <span className="flex items-start gap-1.5">
                        <ArrowRight className="mt-0.5 size-3 shrink-0 text-muted-foreground" />
                        <ValueDiff value={e.new_value} />
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    {t("Filtru neodpovídají žádné záznamy.")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
