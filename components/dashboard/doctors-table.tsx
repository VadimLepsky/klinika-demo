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
import { formatCoefficient, formatCurrency, formatNumber } from "@/lib/format"
import { withPeriod } from "@/lib/period-link"
import { cn } from "@/lib/utils"
import type { DoctorRow } from "@/lib/queries/dashboard"

export function DoctorsTable({ doctors, period }: { doctors: DoctorRow[]; period: string }) {
  const router = useRouter()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Lékaři za měsíc</CardTitle>
        <CardDescription>Kliknutím na řádek otevřete kartu lékaře.</CardDescription>
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <Table className="table-fixed w-full min-w-[860px]">
          <TableHeader>
            <TableRow className="bg-secondary/60 hover:bg-secondary/60">
              <TableHead className="pl-6">Lékař</TableHead>
              <TableHead className="w-[110px] text-right">Doporučení</TableHead>
              <TableHead className="w-[160px] text-right">Objem, Kč</TableHead>
              <TableHead className="w-[130px] text-right">Provize, Kč</TableHead>
              <TableHead className="w-[140px] text-right">Ošetřeno pacientů</TableHead>
              <TableHead className="w-[130px] pr-6 text-right">Koeficient</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {doctors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Za období nejsou data
                </TableCell>
              </TableRow>
            ) : (
              doctors.map((d) => {
                const coef = d.patients_served ? (d.referrals / d.patients_served) * 100 : 0
                return (
                  <TableRow
                    key={d.master_id}
                    className="cursor-pointer"
                    onClick={() => router.push(withPeriod(`/doctors/${d.master_id}`, period))}
                  >
                    <TableCell className="max-w-0 truncate pl-6 font-medium text-foreground">
                      <Link
                        href={withPeriod(`/doctors/${d.master_id}`, period)}
                        className="hover:text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                        title={d.full_name}
                      >
                        {d.full_name}
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatNumber(d.referrals)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatCurrency(d.base)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums">
                      {formatCurrency(d.commission)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">
                      {formatNumber(d.patients_served)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap pr-6 text-right">
                      <Badge
                        variant="secondary"
                        className={cn(
                          "tabular-nums",
                          coef > 100 && "bg-status-pending text-status-pending-foreground",
                        )}
                      >
                        {formatCoefficient(d.referrals, d.patients_served)}
                      </Badge>
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
