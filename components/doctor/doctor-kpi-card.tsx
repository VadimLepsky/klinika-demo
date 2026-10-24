"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useI18n } from "@/lib/i18n/client"
import {
  KPI_METRIC_LABELS,
  formatKFactor,
  formatKpiPoints,
  kFactorColorClassName,
  kpiPointsColorClassName,
} from "@/lib/kpi"
import type { DoctorKpiMonthly } from "@/lib/queries/kpi"

export function DoctorKpiCard({ kpi }: { kpi: DoctorKpiMonthly | null }) {
  const { t, formatCurrency } = useI18n()
  if (!kpi) return null

  const formatMetricValue = (value: number | null, unit: "%" | "Kč"): string => {
    if (value == null) return "—"
    return unit === "%" ? `${Math.round(value)}%` : formatCurrency(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("KPI za měsíc")}</CardTitle>
        {kpi.profile_name ? <CardDescription>{t("Profil: {name}", { name: t(kpi.profile_name) })}</CardDescription> : null}
      </CardHeader>
      <CardContent>
        {kpi.profile_id === null ? (
          <p className="text-sm text-muted-foreground">
            {t("Bez KPI — koeficient {k}.", { k: formatKFactor(1) })}
          </p>
        ) : !kpi.sample_ok ? (
          <p className="text-sm text-muted-foreground">
            {t("Malý vzorek: počet žádanek {count} (min. {min}) — koeficient {k}.", {
              count: kpi.planned_count,
              min: kpi.profile_min_sample ?? "—",
              k: formatKFactor(kpi.k_kpi),
            })}
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="overflow-x-auto rounded-lg border border-border">
              <Table className="w-full min-w-[400px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("Metrika")}</TableHead>
                    <TableHead className="text-right">{t("Hodnota")}</TableHead>
                    <TableHead className="text-right">{t("Body")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-foreground">{t(KPI_METRIC_LABELS.showup)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMetricValue(kpi.showup_pct, "%")}</TableCell>
                    <TableCell className={`text-right font-medium tabular-nums ${kpiPointsColorClassName(kpi.showup_points)}`}>
                      {formatKpiPoints(kpi.showup_points)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-foreground">{t(KPI_METRIC_LABELS.avg_check)}</TableCell>
                    <TableCell className="text-right tabular-nums">{formatMetricValue(kpi.avg_check, "Kč")}</TableCell>
                    <TableCell
                      className={`text-right font-medium tabular-nums ${kpiPointsColorClassName(kpi.avg_check_points)}`}
                    >
                      {formatKpiPoints(kpi.avg_check_points)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-foreground">{t(KPI_METRIC_LABELS.activity)}</TableCell>
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
              <span className="text-sm text-muted-foreground">{t("Výsledek:")}</span>
              <span className={`text-xl font-semibold tabular-nums ${kFactorColorClassName(kpi.k_kpi)}`}>
                K = {formatKFactor(kpi.k_kpi)}
              </span>
              {Math.abs(kpi.k_raw - kpi.k_kpi) > 1e-9 ? (
                <span className="text-xs text-muted-foreground">
                  {t("(omezeno z {k})", { k: formatKFactor(kpi.k_raw) })}
                </span>
              ) : null}
            </div>

            <p className="text-sm text-muted-foreground">
              {formatCurrency(kpi.commission_source)} × {formatKFactor(kpi.k_kpi)}
              {kpi.commission_performer !== 0
                ? ` + ${t("{amount} (stěry)", { amount: formatCurrency(kpi.commission_performer) })}`
                : ""}{" "}
              ={" "}
              <span className="font-medium text-foreground">{formatCurrency(kpi.final_commission)}</span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
