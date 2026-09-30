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
import { formatMonth, formatNumber } from "@/lib/format"
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
  if (doctors.length === 0) {
    return <span>bez provize: 0</span>
  }

  return (
    <Dialog>
      <DialogTrigger
        render={
          <button
            type="button"
            className="cursor-pointer underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            bez provize: {formatNumber(doctors.length)}
          </button>
        }
      />
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Lékaři bez provize</DialogTitle>
          <DialogDescription>{formatMonth(period)} — lékaři bez jakékoli připsané provize.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lékař</TableHead>
                <TableHead className="w-[110px] text-right">Pacientů</TableHead>
                <TableHead className="w-[140px] text-right">Doporučeno pacientů</TableHead>
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
