import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CategoryMappingTable } from "@/components/settings/category-mapping-table"
import { ExclusionsManager } from "@/components/settings/exclusions-manager"
import {
  getCategoryMappings,
  getServiceExclusions,
  getServiceMappings,
} from "@/lib/queries/settings"
import { getBucketOptions } from "@/lib/queries/attention"

import { getI18n } from "@/lib/i18n/server"

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t("Kategorie z CRM") }
}

export const dynamic = "force-dynamic"

export default async function MappingPage() {
  const { t, formatDate } = await getI18n()
  const [categories, exclusions, serviceMappings, buckets] = await Promise.all([
    getCategoryMappings(),
    getServiceExclusions(),
    getServiceMappings(),
    getBucketOptions(),
  ])

  return (
    <Card>
      <CardContent className="pt-6">
        <Tabs defaultValue="categories">
          <TabsList>
            <TabsTrigger value="categories">{t("Kategorie")}</TabsTrigger>
            <TabsTrigger value="exclusions">{t("Výjimky služeb")}</TabsTrigger>
            <TabsTrigger value="services">{t("Výjimky podle služby")}</TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="pt-4">
            <CategoryMappingTable rows={categories} buckets={buckets} />
          </TabsContent>

          <TabsContent value="exclusions" className="pt-4">
            <ExclusionsManager rows={exclusions} />
          </TabsContent>

          <TabsContent value="services" className="pt-4">
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">
                {t("Výjimky pro jednotlivé služby — přebíjejí pravidlo jejich kategorie.")}
              </p>
              <div className="overflow-x-auto rounded-lg border border-border">
                <Table className="table-fixed w-full min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">{t("Služba")}</TableHead>
                      <TableHead className="w-[180px]">{t("Pravidlo")}</TableHead>
                      <TableHead className="w-[120px]">{t("Platí od")}</TableHead>
                      <TableHead className="w-[120px]">{t("Platí do")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {serviceMappings.length > 0 ? (
                      serviceMappings.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell
                            className="max-w-0 truncate pl-4 font-medium text-foreground"
                            title={t(s.service_name)}
                          >
                            {t(s.service_name)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {s.bucket_label ? (
                              <Badge variant="secondary">{t(s.bucket_label)}</Badge>
                            ) : (
                              <Badge variant="outline">{t("bez provize")}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {formatDate(s.valid_from)}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-muted-foreground">
                            {s.valid_to ? formatDate(s.valid_to) : "—"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                          {t("Žádné výjimky podle služby.")}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
