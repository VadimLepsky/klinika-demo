import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateBucketDialog } from "@/components/settings/create-bucket-dialog"
import { BucketsTable } from "@/components/settings/buckets-table"
import { getBucketsForManagement, getRateHistory } from "@/lib/queries/settings"

export const metadata = { title: "Pravidla provizí" }

export const dynamic = "force-dynamic"

export default async function BucketsPage() {
  const buckets = await getBucketsForManagement()
  const historyList = await Promise.all(buckets.map((b) => getRateHistory(b.bucket)))
  const histories = Object.fromEntries(buckets.map((b, i) => [b.bucket, historyList[i]]))

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Pravidla pro výpočet provizí</CardTitle>
        </div>
        <CreateBucketDialog
          trigger={
            <Button size="sm">
              <Plus data-icon="inline-start" />
              Vytvořit
            </Button>
          }
        />
      </CardHeader>
      <CardContent>
        <BucketsTable buckets={buckets} histories={histories} />
      </CardContent>
    </Card>
  )
}
