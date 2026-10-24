"use client"

import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useI18n } from "@/lib/i18n/client"
import { withPeriod } from "@/lib/period-link"
import type { DoctorWithoutCommission } from "@/lib/queries/dashboard"

export function DoctorsWithoutCommission({
  doctors,
  period,
  spec,
}: {
  doctors: DoctorWithoutCommission[]
  period: string
  spec: string | null
}) {
  const { t, formatMonth, formatNumber } = useI18n()
  if (doctors.length === 0) {
    return <span>{t("bez provize: {n}", { n: 0 })}</span>
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            {t("bez provize: {n}", { n: formatNumber(doctors.length) })}
          </button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("Lékaři bez provize")}</DialogTitle>
          <DialogDescription>
            {t("{month} — lékaři bez jakékoli připsané provize.", { month: formatMonth(period) })}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Lékař")}</TableHead>
                <TableHead className="w-[110px] text-right">{t("Pacientů")}</TableHead>
                <TableHead className="w-[140px] text-right">{t("Odeslaní pacienti")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctors.map((d) => (
                <TableRow key={d.master_id}>
                  <TableCell>
                    <Link
                      href={withPeriod(`/doctors/${d.master_id}`, period, spec)}
                      className="hover:underline"
                    >
                      {d.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(d.patients_served)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatNumber(d.referrals)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  )
}
