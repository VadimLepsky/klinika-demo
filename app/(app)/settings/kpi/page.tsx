import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateKpiProfileButton } from "@/components/settings/create-kpi-profile-button"
import { KpiProfilesTable } from "@/components/settings/kpi-profiles-table"
import { getKpiBandsByProfile, getKpiProfilesWithCounts } from "@/lib/queries/kpi"
import { getI18n } from "@/lib/i18n/server"

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t("KPI profily") }
}
export const dynamic = "force-dynamic"

export default async function KpiProfilesPage() {
  const { t } = await getI18n()
  const [profiles, bandsByProfile] = await Promise.all([getKpiProfilesWithCounts(), getKpiBandsByProfile()])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>{t("KPI profily")}</CardTitle>
          <CardDescription>
            {t("Upravují provizi za žádanky koeficientem K na základě ukazatelů lékaře za měsíc.")}
          </CardDescription>
        </div>
        <CreateKpiProfileButton />
      </CardHeader>
      <CardContent>
        <KpiProfilesTable profiles={profiles} bandsByProfile={bandsByProfile} />
      </CardContent>
    </Card>
  )
}
