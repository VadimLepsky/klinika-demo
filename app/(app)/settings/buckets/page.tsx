import { Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreateBucketDialog } from "@/components/settings/create-bucket-dialog"
import { BucketsTable } from "@/components/settings/buckets-table"
import { getBucketsForManagement, getRateHistory } from "@/lib/queries/settings"
import { getI18n } from "@/lib/i18n/server"

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t("Pravidla provizí") }
}

export const dynamic = "force-dynamic"

export default async function BucketsPage() {
  const { t } = await getI18n()
  const buckets = await getBucketsForManagement()
  const historyList = await Promise.all(buckets.map((b) => getRateHistory(b.bucket)))
  const histories = Object.fromEntries(buckets.map((b, i) => [b.bucket, historyList[i]]))

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>{t("Pravidla pro výpočet provizí")}</CardTitle>
        </div>
        <CreateBucketDialog
          trigger={
            <Button size="sm">
              <Plus data-icon="inline-start" />
              {t("Vytvořit")}
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
