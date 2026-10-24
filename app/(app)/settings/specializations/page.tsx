import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateSpecializationButton } from "@/components/settings/create-specialization-button"
import { SpecializationsTable } from "@/components/settings/specializations-table"
import { getBandsBySpecialization, getSpecializationsWithCounts } from "@/lib/queries/specializations"
import { getI18n } from "@/lib/i18n/server"

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t("Specializace") }
}
export const dynamic = "force-dynamic"

export default async function SpecializationsPage() {
  const { t } = await getI18n()
  const [specializations, bandsBySpecialization] = await Promise.all([
    getSpecializationsWithCounts(),
    getBandsBySpecialization(),
  ])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>{t("Specializace")}</CardTitle>
          <CardDescription>{t("Používají se pouze pro filtrování a přehledy, provize neovlivňují.")}</CardDescription>
        </div>
        <CreateSpecializationButton />
      </CardHeader>
      <CardContent>
        <SpecializationsTable specializations={specializations} bandsBySpecialization={bandsBySpecialization} />
      </CardContent>
    </Card>
  )
}
