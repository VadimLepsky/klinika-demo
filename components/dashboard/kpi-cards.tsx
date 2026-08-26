import { Coins, Send, Stethoscope, Wallet } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatNumber } from "@/lib/format"
import type { DashboardKpis } from "@/lib/queries/dashboard"

export function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const items = [
    { label: "Provize celkem", value: formatCurrency(kpis.totalCommission), icon: Coins },
    { label: "Doporučení", value: formatNumber(kpis.totalReferrals), icon: Send },
    { label: "Doporučený objem", value: formatCurrency(kpis.totalBase), icon: Wallet },
    { label: "Lékařů s provizí", value: formatNumber(kpis.doctorsWithCommission), icon: Stethoscope },
  ]

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{item.label}</CardTitle>
            <span className="flex size-8 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <item.icon className="size-4" />
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight tabular-nums text-foreground">
              {item.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
