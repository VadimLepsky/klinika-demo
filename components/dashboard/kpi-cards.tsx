import type { ReactNode } from "react"
import { ArrowDownRight, ArrowUpRight, Coins, Repeat, Send, Stethoscope, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DoctorsWithoutCommission } from "@/components/dashboard/doctors-without-commission"
import { getI18n } from "@/lib/i18n/server"
import type { DashboardKpis, DoctorWithoutCommission } from "@/lib/queries/dashboard"

/** Change vs previous month, in %. Hidden when there is no previous month or it was 0. */
async function Delta({ current, previous }: { current: number; previous: number | null }) {
  if (previous == null || previous === 0) return null
  const { t } = await getI18n()
  const pct = ((current - previous) / previous) * 100
  const rounded = Math.round(pct)
  if (rounded === 0) {
    return <span className="text-xs font-medium tabular-nums text-muted-foreground">0%</span>
  }
  const up = rounded > 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium tabular-nums ${
        up ? "text-status-accrued-foreground" : "text-status-unmatched-foreground"
      }`}
      title={t("Ve srovnání s předchozím měsícem")}
    >
      {up ? "+" : "−"}
      {Math.abs(rounded)}%
      <Icon className="size-3.5" />
    </span>
  )
}

type Item = {
  label: string
  value: string
  icon: typeof Coins
  secondary?: ReactNode
  delta?: ReactNode
}

export async function KpiCards({
  kpis,
  prev,
  withoutCommission,
  period,
  spec,
}: {
  kpis: DashboardKpis
  prev: DashboardKpis | null
  withoutCommission: DoctorWithoutCommission[]
  period: string
  spec: string | null
}) {
  const { t, formatCoefficient, formatCurrencyRounded, formatNumber } = await getI18n()
  const items: Item[] = [
    {
      label: t("Provize celkem"),
      value: formatCurrencyRounded(kpis.totalCommission),
      icon: Coins,
      delta: <Delta current={kpis.totalCommission} previous={prev?.totalCommission ?? null} />,
    },
    {
      label: t("Odeslaní pacienti"),
      value: formatNumber(kpis.totalReferredPatients),
      icon: Send,
      secondary: t("koeficient {value}", { value: formatCoefficient(kpis.totalReferredPatients, kpis.totalPatientsServed) }),
      delta: <Delta current={kpis.totalReferredPatients} previous={prev?.totalReferredPatients ?? null} />,
    },
    {
      label: t("Objem žádanek (Kč)"),
      value: formatCurrencyRounded(kpis.totalBase),
      icon: Wallet,
      delta: <Delta current={kpis.totalBase} previous={prev?.totalBase ?? null} />,
    },
    {
      label: t("Lékařů s provizí"),
      value: formatNumber(kpis.doctorsWithCommission),
      icon: Stethoscope,
      secondary: <DoctorsWithoutCommission doctors={withoutCommission} period={period} spec={spec} />,
    },
    {
      label: t("Přeobjednání"),
      value: formatNumber(kpis.totalSelfRecords),
      icon: Repeat,
      secondary: t("koeficient {value}", { value: formatCoefficient(kpis.totalSelfRecords, kpis.totalVisitsPerformed) }),
    },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <item.icon className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-baseline gap-x-2">
              <div className="whitespace-nowrap text-2xl font-semibold tracking-tight tabular-nums text-foreground">
                {item.value}
              </div>
              {item.delta}
            </div>
            {item.secondary ? (
              <div className="mt-1 text-xs text-muted-foreground tabular-nums">{item.secondary}</div>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
