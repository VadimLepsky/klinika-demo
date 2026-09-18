import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { BucketBreakdown } from "@/components/doctor/bucket-breakdown"
import { DoctorCharts } from "@/components/doctor/doctor-charts"
import { LinesSection } from "@/components/doctor/lines-section"
import { MonthSelector } from "@/components/dashboard/month-selector"
import { PayoutCheckbox } from "@/components/dashboard/payout-checkbox"
import { formatMonth } from "@/lib/format"
import { withPeriod } from "@/lib/period-link"
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
  searchParams: Promise<{ period?: string }>
}) {
  const { master_id } = await params
  const { period: periodParam } = await searchParams

  const [header, periods, series, sessionUser] = await Promise.all([
    getDoctorHeader(master_id),
    getPeriods(),
    getDoctorMonthlySeries(master_id),
    getSessionUser(),
  ])

  if (!header) notFound()

  const selected = periods.find((p) => p.period === periodParam)?.period ?? periods[0]?.period ?? ""

  const [breakdown, lines, payoutStatus] = await Promise.all([
    selected ? getDoctorBucketBreakdown(master_id, selected) : Promise.resolve([]),
    selected ? getDoctorLines(master_id, selected) : Promise.resolve([]),
    selected
      ? getDoctorPayoutStatus(master_id, selected)
      : Promise.resolve({ paid: false, paid_by: null, paid_at: null }),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="-ml-2 mb-3 text-muted-foreground"
          render={
            <Link href={selected ? withPeriod("/", selected) : "/"}>
              <ArrowLeft data-icon="inline-start" />
              Zpět na přehled
            </Link>
          }
        />
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-balance text-foreground">{header.full_name}</h2>
              {header.dismissed ? <Badge variant="secondary">ukončen</Badge> : null}
              {header.is_doctor === false ? <Badge variant="outline">není lékař</Badge> : null}
              {header.is_doctor === null ? <Badge variant="outline">neurčeno</Badge> : null}
            </div>
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
                Vyplaceno
              </Label>
            ) : null}
            <MonthSelector periods={periods} current={selected} />
          </div>
        </div>
      </div>

      <DoctorCharts series={series} selectedPeriod={selected} />

      <BucketBreakdown rows={breakdown} month={formatMonth(selected)} />

      <LinesSection lines={lines} />
    </div>
  )
}
