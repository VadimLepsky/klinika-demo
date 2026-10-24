import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SourcesTable } from "@/components/settings/sources-table"
import { getSources } from "@/lib/queries/settings"
import { getDoctorOptions } from "@/lib/queries/attention"
import { getI18n } from "@/lib/i18n/server"

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t("Zdroje") }
}

export const dynamic = "force-dynamic"

export default async function SourcesPage() {
  const { t } = await getI18n()
  const [sources, doctors] = await Promise.all([getSources(), getDoctorOptions()])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Zdroje pacientů")}</CardTitle>
        <CardDescription>
          {t("Vazba zdrojů na lékaře. Zdroje bez provize se do výpočtu nezapočítávají.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SourcesTable sources={sources} doctors={doctors} />
      </CardContent>
    </Card>
  )
}
