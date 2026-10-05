import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { formatCurrency } from "@/lib/format"
import {
  KPI_METRIC_LABELS,
  formatKFactor,
  formatKpiPoints,
  kFactorColorClassName,
  kpiPointsColorClassName,
} from "@/lib/kpi"
import type { DoctorKpiMonthly } from "@/lib/queries/kpi"

function formatMetricValue(value: number | null, unit: "%" | "Kč"): string {
  if (value == null) return "—"
  return unit === "%" ? `${Math.round(value)}%` : formatCurrency(value)
}

export function DoctorKpiCard({ kpi }: { kpi: DoctorKpiMonthly | null }) {
  if (!kpi) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>KPI za měsíc</CardTitle>
        {kpi.profile_name ? <CardDescription>Profil: {kpi.profile_name}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {kpi.profile_id === null ? (
          <p className="text-sm text-muted-foreground">Bez KPI — koeficient 1,00.</p>
        ) : !kpi.sample_ok ? (
          <p className="text-sm text-muted-foreground">
            Malý vzorek: počet žádanek {kpi.planned_count} (min. {kpi.profile_min_sample ?? "—"}) —
            koeficient {kpi.k_kpi.toFixed(2)}.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table className="w-full min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Metrika</TableHead>
                    <TableHead className="text-right">Hodnota</TableHead>
                    <TableHead className="text-right">Body</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-foreground">{KPI_METRIC_LABELS.showup}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMetricValue(kpi.showup_pct, "%")}</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${kpiPointsColorClassName(kpi.showup_points)}`}>
                      {formatKpiPoints(kpi.showup_points)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-foreground">{KPI_METRIC_LABELS.avg_check}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMetricValue(kpi.avg_check, "Kč")}</TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${kpiPointsColorClassName(kpi.avg_check_points)}`}
                    >
                      {formatKpiPoints(kpi.avg_check_points)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-foreground">{KPI_METRIC_LABELS.activity}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMetricValue(kpi.activity_pct, "%")}</TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${kpiPointsColorClassName(kpi.activity_points)}`}
                    >
                      {formatKpiPoints(kpi.activity_points)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>

            <div className="flex flex-wrap items-baseline gap-2">
              <span className="text-sm text-muted-foreground">Výsledek:</span>
              <span className={`text-xl font-semibold tabular-nums ${kFactorColorClassName(kpi.k_kpi)}`}>
                K = {formatKFactor(kpi.k_kpi)}
              </span>
              {Math.abs(kpi.k_raw - kpi.k_kpi) > 1e-9 ? (
                <span className="text-xs text-muted-foreground">(omezeno z {formatKFactor(kpi.k_raw)})</span>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">
              {formatCurrency(kpi.commission_source)} × {formatKFactor(kpi.k_kpi)}
              {kpi.commission_performer !== 0 ? ` + ${formatCurrency(kpi.commission_performer)} (stěry)` : ""} ={" "}
              <span className="font-medium text-foreground">{formatCurrency(kpi.final_commission)}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
