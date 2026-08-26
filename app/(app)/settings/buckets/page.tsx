import Link from "next/link"
import { Plus, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CreateBucketDialog } from "@/components/settings/create-bucket-dialog"
import { EditBucketDialog } from "@/components/settings/edit-bucket-dialog"
import { DeleteBucketButton } from "@/components/settings/delete-bucket-button"
import { getBucketsForManagement } from "@/lib/queries/settings"
import { formatRate } from "@/lib/format"

export const metadata = { title: "Skupiny provizí" }

export const dynamic = "force-dynamic"

export default async function BucketsPage() {
  const buckets = await getBucketsForManagement()

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <CardTitle>Skupiny provizí</CardTitle>
          <p className="text-sm text-muted-foreground">
            Sazby a historie verzí — v sekci{" "}
            <Link href="/settings/rates" className="inline-flex items-center gap-1 text-foreground underline underline-offset-3">
              Sazby
              <ArrowRight className="size-3" />
            </Link>
            .
          </p>
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
        <div className="overflow-x-auto rounded-lg border border-border">
          <Table className="table-fixed w-full min-w-[760px]">
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Skupina</TableHead>
                <TableHead className="w-[130px]">Příjemce</TableHead>
                <TableHead className="w-[120px] text-right">Platná sazba</TableHead>
                <TableHead className="w-[110px] text-right">Kategorií</TableHead>
                <TableHead className="w-[220px] text-right pr-4">Akce</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buckets.length > 0 ? (
                buckets.map((b) => (
                  <TableRow key={b.bucket}>
                    <TableCell className="max-w-0 pl-4">
                      <span className="flex flex-col gap-0.5">
                        <span className="truncate font-medium text-foreground" title={b.label}>
                          {b.label}
                        </span>
                        <span className="truncate font-mono text-xs text-muted-foreground">{b.bucket}</span>
                      </span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {b.beneficiary === "source" ? "Doporučující" : "Vykonavatel"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      {b.current_rate != null ? (
                        <Badge variant="secondary">{formatRate(b.current_rate)}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums text-muted-foreground">
                      {b.mapping_count}
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-4">
                      <div className="flex justify-end gap-2">
                        <EditBucketDialog bucket={b.bucket} label={b.label} beneficiary={b.beneficiary} />
                        <DeleteBucketButton bucket={b.bucket} label={b.label} canDelete={b.canDelete} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Žádné skupiny.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
