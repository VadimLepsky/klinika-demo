import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateKpiProfileButton } from "@/components/settings/create-kpi-profile-button"
import { KpiProfilesTable } from "@/components/settings/kpi-profiles-table"
import { getKpiBandsByProfile, getKpiProfilesWithCounts } from "@/lib/queries/kpi"

export const metadata = { title: "KPI profily" }
export const dynamic = "force-dynamic"

export default async function KpiProfilesPage() {
  const [profiles, bandsByProfile] = await Promise.all([getKpiProfilesWithCounts(), getKpiBandsByProfile()])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>KPI profily</CardTitle>
          <CardDescription>
            Upravují provizi za doporučení koeficientem K na základě ukazatelů lékaře za měsíc.
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
