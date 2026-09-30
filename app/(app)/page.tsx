import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { CalendarX } from "lucide-react"
import { AttentionBanner } from "@/components/dashboard/attention-banner"
import { CommissionBarChart } from "@/components/dashboard/commission-bar-chart"
import { DoctorsTable } from "@/components/dashboard/doctors-table"
import { KpiCards } from "@/components/dashboard/kpi-cards"
import { MonthSelector } from "@/components/dashboard/month-selector"
import { ReferralsChart } from "@/components/dashboard/referrals-chart"
import { SpecializationFilter } from "@/components/dashboard/specialization-filter"
import {
  getActiveSpecializations,
  getDoctorIdsForSpecialization,
  getPrimarySpecializationBandsForDoctors,
} from "@/lib/queries/specializations"
import {
  getAttentionCount,
  getDoctorsForMonth,
  getDoctorsWithoutCommission,
  getKpis,
  getMonthlySeries,
  getPeriods,
} from "@/lib/queries/dashboard"
import { getSessionUser } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string; spec?: string }>
}) {
  const { period: periodParam, spec: specParam } = await searchParams
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

  const specOptions = await getActiveSpecializations()
  const selectedSpec = specOptions.find((s) => s.id === specParam)?.id ?? null
  const masterIds = selectedSpec ? await getDoctorIdsForSpecialization(selectedSpec) : null

  const prevPeriod = periods[periods.findIndex((p) => p.period === selected) + 1]?.period ?? null

  const [kpis, prevKpis, withoutCommission, doctors, monthlySeries, attentionCount, sessionUser] = await Promise.all([
    getKpis(selected, masterIds),
    prevPeriod ? getKpis(prevPeriod, masterIds) : Promise.resolve(null),
    getDoctorsWithoutCommission(selected, masterIds),
    getDoctorsForMonth(selected, masterIds),
    getMonthlySeries(masterIds),
    getAttentionCount(selected),
    getSessionUser(),
  ])
  const bandsByDoctor = await getPrimarySpecializationBandsForDoctors(doctors.map((d) => d.master_id))

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold text-foreground">Přehled provizí</h1>
          <p className="text-sm text-muted-foreground">Vývoj ukazatelů za vybraný měsíc</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SpecializationFilter options={specOptions} current={selectedSpec} />
          <MonthSelector periods={periods} current={selected} />
        </div>
      </div>

      <AttentionBanner count={attentionCount} period={selected} />

      <KpiCards
        kpis={kpis}
        prev={prevKpis}
        withoutCommission={withoutCommission}
        period={selected}
        spec={selectedSpec}
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <ReferralsChart series={monthlySeries} />
        </div>
        <div className="xl:col-span-2">
          <CommissionBarChart series={monthlySeries} />
        </div>
      </div>

      <DoctorsTable
        doctors={doctors}
        period={selected}
        spec={selectedSpec}
        actorEmail={sessionUser?.email ?? ""}
        bandsByDoctor={bandsByDoctor}
      />
    </div>
  )
}
