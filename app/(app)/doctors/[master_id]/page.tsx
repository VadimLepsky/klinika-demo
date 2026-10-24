import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BucketBreakdown } from "@/components/doctor/bucket-breakdown"
import { DoctorCharts } from "@/components/doctor/doctor-charts"
import { DoctorKpiCard } from "@/components/doctor/doctor-kpi-card"
import { LinesSection } from "@/components/doctor/lines-section"
import { getDoctorKpiMonthly } from "@/lib/queries/kpi"
import { MonthSelector } from "@/components/dashboard/month-selector"
import { PayoutCheckbox } from "@/components/dashboard/payout-checkbox"
import { getI18n } from "@/lib/i18n/server"
import { withPeriod } from "@/lib/period-link"
import { SpecializationBadges } from "@/components/specializations/specialization-badges"
import { getStaffSpecializations, isSpecializationId } from "@/lib/queries/specializations"
import { getPeriods } from "@/lib/queries/dashboard"
import { getSessionUser } from "@/lib/session"
import {
  getDoctorBucketBreakdown,
  getDoctorHeader,
  getDoctorLines,
  getDoctorMonthlySeries,
  getDoctorPayoutStatus,
} from "@/lib/queries/doctor"

export const dynamic = "force-dynamic"

export default async function DoctorPage({
  params,
  searchParams,
}: {
  params: Promise<{ master_id: string }>
  searchParams: Promise<{ period?: string; spec?: string }>
}) {
  const { master_id } = await params
  const { t, formatMonth } = await getI18n()
  const { period: periodParam, spec: specParam } = await searchParams
  const spec = isSpecializationId(specParam) ? specParam : null

  const [header, periods, series, sessionUser, specsByMaster] = await Promise.all([
    getDoctorHeader(master_id),
    getPeriods(),
    getDoctorMonthlySeries(master_id),
    getSessionUser(),
    getStaffSpecializations(master_id),
  ])

  if (!header) notFound()

  const selected = periods.find((p) => p.period === periodParam)?.period ?? periods[0]?.period ?? ""

  const [breakdown, lines, payoutStatus, kpi] = await Promise.all([
    selected ? getDoctorBucketBreakdown(master_id, selected) : Promise.resolve([]),
    selected ? getDoctorLines(master_id, selected) : Promise.resolve([]),
    selected
      ? getDoctorPayoutStatus(master_id, selected)
      : Promise.resolve({ paid: false, paid_by: null, paid_at: null }),
    selected ? getDoctorKpiMonthly(master_id, selected) : Promise.resolve(null),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-3 text-muted-foreground"
          render={
            <Link href={withPeriod("/", selected || null, spec)}>
              <ArrowLeft data-icon="inline-start" />
              {t("Zpět na přehled")}
            </Link>
          }
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-balance text-foreground">{header.full_name}</h2>
              {header.dismissed ? <Badge variant="secondary">{t("ukončen")}</Badge> : null}
              {header.is_doctor === false ? <Badge variant="outline">{t("není lékař")}</Badge> : null}
              {header.is_doctor === null ? <Badge variant="outline">{t("neurčeno")}</Badge> : null}
            </div>
            <SpecializationBadges specs={specsByMaster[master_id]} />
          </div>
          <div className="flex items-center gap-4">
            {selected ? (
              <Label className="gap-2">
                <PayoutCheckbox
                  key={`${payoutStatus.paid}-${payoutStatus.paid_by ?? ""}`}
                  masterId={master_id}
                  period={selected}
                  paid={payoutStatus.paid}
                  paidBy={payoutStatus.paid_by}
                  paidAt={payoutStatus.paid_at}
                  actorEmail={sessionUser?.email ?? ""}
                  doctorName={header.full_name}
                  showAriaLabel={false}
                />
                {t("Vyplaceno")}
              </Label>
            ) : null}
            <MonthSelector periods={periods} current={selected} />
          </div>
        </div>
      </div>

      <DoctorCharts series={series} selectedPeriod={selected} />

      <DoctorKpiCard kpi={kpi} />

      <BucketBreakdown rows={breakdown} month={formatMonth(selected)} />

      <LinesSection lines={lines} />
    </div>
  )
}
