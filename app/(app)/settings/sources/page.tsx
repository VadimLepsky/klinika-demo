import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SourcesTable } from "@/components/settings/sources-table"
import { getSources } from "@/lib/queries/settings"
import { getDoctorOptions } from "@/lib/queries/attention"

export const metadata = { title: "Zdroje" }

export const dynamic = "force-dynamic"

export default async function SourcesPage() {
  const [sources, doctors] = await Promise.all([getSources(), getDoctorOptions()])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zdroje doporučení</CardTitle>
        <CardDescription>
          Vazba zdrojů na lékaře. Zdroje bez provize se do výpočtu nezapočítávají.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SourcesTable sources={sources} doctors={doctors} />
      </CardContent>
    </Card>
  )
}
