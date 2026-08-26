import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CalendarX } from "lucide-react"
import { AttentionBanner } from "@/components/dashboard/attention-banner"
import { CommissionBarChart } from "@/components/dashboard/commission-bar-chart"
import { DoctorsTable } from "@/components/dashboard/doctors-table"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { MonthSelector } from "@/components/dashboard/month-selector"
import { ReferralsChart } from "@/components/dashboard/referrals-chart"
import {
  getAttentionCount,
  getDoctorsForMonth,
  getKpis,
  getMonthlySeries,
  getPeriods,
} from "@/lib/queries/dashboard"

export const dynamic = "force-dynamic"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: periodParam } = await searchParams
  const periods = await getPeriods()

  if (periods.length === 0) {
    return (
      <Empty className="min-h-[60vh]">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarX />
          </EmptyMedia>
          <EmptyTitle>Žádná období</EmptyTitle>
          <EmptyDescription>
            V databázi zatím není žádný spočítaný měsíc. Data se objeví po běhu výpočetního workeru.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const selected = periods.find((p) => p.period === periodParam)?.period ?? periods[0].period

  const [kpis, doctors, monthlySeries, attentionCount] = await Promise.all([
    getKpis(selected),
    getDoctorsForMonth(selected),
    getMonthlySeries(),
    getAttentionCount(selected),
  ])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">Přehled provizí</h1>
          <p className="text-sm text-muted-foreground">Vývoj ukazatelů za vybraný měsíc</p>
        </div>
        <MonthSelector periods={periods} current={selected} />
      </div>

      <AttentionBanner count={attentionCount} period={selected} />

      <KpiCards kpis={kpis} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ReferralsChart series={monthlySeries} />
        </div>
        <div className="xl:col-span-2">
          <CommissionBarChart series={monthlySeries} />
        </div>
      </div>

      <DoctorsTable doctors={doctors} period={selected} />
    </div>
  )
}
