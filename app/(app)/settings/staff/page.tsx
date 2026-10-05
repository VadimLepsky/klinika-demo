import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { StaffTable } from "@/components/settings/staff-table"
import {
  getActiveDoctorBucketRates,
  getBucketsWithRates,
  getLatestNonFrozenPeriod,
  getStaff,
} from "@/lib/queries/settings"
import { nextMonthValue } from "@/lib/format"
import { getActiveSpecializations, getStaffSpecializations } from "@/lib/queries/specializations"
import {
  getActiveKpiProfiles,
  getAllDoctorKpiHistory,
  getDoctorKpiBadges,
  getKpiAssignableMonths,
} from "@/lib/queries/kpi"
import type { DoctorRateRule } from "@/components/settings/doctor-rates-dialog"

export const metadata = { title: "Zaměstnanci" }

export const dynamic = "force-dynamic"

export default async function StaffPage() {
  const [
    staff,
    buckets,
    overridesByMaster,
    latestNonFrozen,
    specsByMaster,
    specOptions,
    kpiProfiles,
    kpiBadgeByMaster,
    kpiHistoryByMaster,
    kpiMonthOptions,
  ] = await Promise.all([
    getStaff(),
    getBucketsWithRates(),
    getActiveDoctorBucketRates(),
    getLatestNonFrozenPeriod(),
    getStaffSpecializations(),
    getActiveSpecializations(),
    getActiveKpiProfiles(),
    getDoctorKpiBadges(),
    getAllDoctorKpiHistory(),
    getKpiAssignableMonths(),
  ])

  const rateRules: DoctorRateRule[] = buckets.map((b) => ({
    bucket: b.bucket,
    label: b.label,
    generalRate: b.current_rate,
  }))

  const validFromMonth = latestNonFrozen ? latestNonFrozen.slice(0, 7) : nextMonthValue()

  return (
    <Card>
      <CardHeader>
        <CardTitle>Zaměstnanci</CardTitle>
        <CardDescription>
          Označení «lékař» určuje, kdo může dostávat provizi za žádanky.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <StaffTable
          staff={staff}
          rateRules={rateRules}
          overridesByMaster={overridesByMaster}
          defaultMonth={validFromMonth}
          minMonth={validFromMonth}
          specsByMaster={specsByMaster}
          specOptions={specOptions}
          kpiProfiles={kpiProfiles}
          kpiBadgeByMaster={Object.fromEntries(kpiBadgeByMaster)}
          kpiHistoryByMaster={Object.fromEntries(kpiHistoryByMaster)}
          kpiMonthOptions={kpiMonthOptions}
        />
      </CardContent>
    </Card>
  )
}
