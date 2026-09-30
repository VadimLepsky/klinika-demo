import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CreateSpecializationButton } from "@/components/settings/create-specialization-button"
import { SpecializationsTable } from "@/components/settings/specializations-table"
import { getBandsBySpecialization, getSpecializationsWithCounts } from "@/lib/queries/specializations"

export const metadata = { title: "Specializace" }
export const dynamic = "force-dynamic"

export default async function SpecializationsPage() {
  const [specializations, bandsBySpecialization] = await Promise.all([
    getSpecializationsWithCounts(),
    getBandsBySpecialization(),
  ])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Specializace</CardTitle>
          <CardDescription>Používají se pouze pro filtrování a přehledy, provize neovlivňují.</CardDescription>
        </div>
        <CreateSpecializationButton />
      </CardHeader>
      <CardContent>
        <SpecializationsTable specializations={specializations} bandsBySpecialization={bandsBySpecialization} />
      </CardContent>
    </Card>
  )
}
