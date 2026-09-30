"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { PayoutCheckbox } from "@/components/dashboard/payout-checkbox"
import { formatCoefficient, formatCurrency, formatNumber } from "@/lib/format"
import { getCoefficientBadgeClassName, getCoefficientTooltip, type CoefficientBand } from "@/lib/coefficient"
import { formatKFactor, kFactorColorClassName } from "@/lib/kpi"
import { withPeriod } from "@/lib/period-link"
import { cn } from "@/lib/utils"
import type { DoctorRow } from "@/lib/queries/dashboard"

export function DoctorsTable({
  doctors,
  period,
  spec = null,
  actorEmail,
  bandsByDoctor,
}: {
  doctors: DoctorRow[]
  period: string
  spec?: string | null
  actorEmail: string
  bandsByDoctor: Map<string, CoefficientBand[]>
}) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lékaři za měsíc</CardTitle>
        <CardDescription>Kliknutím na řádek otevřete kartu lékaře.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <Table className="table-fixed w-full min-w-[1100px]">
          <TableHeader>
            <TableRow className="bg-secondary/60 hover:bg-secondary/60">
              <TableHead className="pl-6">Lékař</TableHead>
              <TableHead className="w-[150px] text-right">Doporučeno pacientů</TableHead>
              <TableHead className="w-[160px] text-right">Objem doporučených, Kč</TableHead>
              <TableHead className="w-[130px] text-right">Provize, Kč</TableHead>
              <TableHead className="w-[80px] text-right">K</TableHead>
              <TableHead className="w-[140px] text-right">K výplatě, Kč</TableHead>
              <TableHead className="w-[140px] text-right">Ošetřeno pacientů</TableHead>
              <TableHead className="w-[90px] text-right">Vyplaceno</TableHead>
              <TableHead className="w-[130px] pr-6 text-right">Koeficient</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="py-10 text-center text-muted-foreground">
                  Za období nejsou data
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((d) => {
                const coef = d.patients_served ? (d.referred_patients / d.patients_served) * 100 : 0
                const bands = bandsByDoctor.get(d.master_id)
                return (
                  <TableRow
                    key={d.master_id}
                    className="cursor-pointer"
                    onClick={() => router.push(withPeriod(`/doctors/${d.master_id}`, period, spec))}
                  >
                    <TableCell className="max-w-0 truncate pl-6 font-medium text-foreground">
                      <Link
                        href={withPeriod(`/doctors/${d.master_id}`, period, spec)}
                        className="hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                        title={d.full_name}
                      >
                        {d.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatNumber(d.referred_patients)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(d.base)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                      {formatCurrency(d.commission)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "whitespace-nowrap text-right tabular-nums",
                        d.k_kpi != null && kFactorColorClassName(d.k_kpi),
                      )}
                    >
                      {d.k_kpi != null ? formatKFactor(d.k_kpi) : "—"}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                      {formatCurrency(d.final_commission ?? d.commission)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatNumber(d.patients_served)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end">
                        <PayoutCheckbox
                          key={`${d.paid}-${d.paid_by ?? ""}`}
                          masterId={d.master_id}
                          period={period}
                          paid={d.paid}
                          paidBy={d.paid_by}
                          paidAt={d.paid_at}
                          actorEmail={actorEmail}
                          doctorName={d.full_name}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-6 text-right">
                      <Tooltip>
                        <TooltipTrigger
                          render={
                            <Badge
                              variant="secondary"
                              className={cn("tabular-nums", getCoefficientBadgeClassName(coef, bands))}
                            >
                              {formatCoefficient(d.referred_patients, d.patients_served)}
                            </Badge>
                          }
                        />
                        <TooltipContent>{getCoefficientTooltip(coef, bands)}</TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
