import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StaffTable } from "@/components/settings/staff-table"
import { getStaff } from "@/lib/queries/settings"

export const metadata = { title: "Zaměstnanci" }

export const dynamic = "force-dynamic"

export default async function StaffPage() {
  const staff = await getStaff()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zaměstnanci</CardTitle>
        <CardDescription>
          Označení «lékař» určuje, kdo může dostávat provizi za doporučení.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StaffTable staff={staff} />
      </CardContent>
    </Card>
  )
}
