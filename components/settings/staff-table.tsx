"use client"

import { useMemo, useState, useTransition } from "react"
import { Search } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { InputGroup, InputGroupAddon, InputGroupInput } from "@/components/ui/input-group"
import { Spinner } from "@/components/ui/spinner"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { updateStaff } from "@/app/(app)/settings/actions"
import { DoctorRatesDialog, type DoctorRateRule } from "@/components/settings/doctor-rates-dialog"
import { DoctorKpiDialog } from "@/components/settings/doctor-kpi-dialog"
import type { DoctorRateOverride, StaffRow } from "@/lib/queries/settings"
import { DoctorSpecializationsDialog } from "@/components/settings/doctor-specializations-dialog"
import type { DoctorSpecializations, Specialization } from "@/lib/queries/specializations"
import type { DoctorKpiBadge, DoctorKpiHistoryRow, KpiProfile, MonthOption } from "@/lib/queries/kpi"
import { useI18n } from "@/lib/i18n/client"

const DOCTOR_YES = "yes"
const DOCTOR_NO = "no"
const DOCTOR_UNSET = "unset"

const DOCTOR_ITEMS: Record<string, string> = {
  [DOCTOR_YES]: "Lékař",
  [DOCTOR_NO]: "Není lékař",
  [DOCTOR_UNSET]: "Neurčeno",
}

function flagToValue(v: boolean | null): string {
  if (v === true) return DOCTOR_YES
  if (v === false) return DOCTOR_NO
  return DOCTOR_UNSET
}
function valueToFlag(v: string): boolean | null {
  if (v === DOCTOR_YES) return true
  if (v === DOCTOR_NO) return false
  return null
}

function StaffRowItem({
  row,
  rateRules,
  overrides,
  hasPersonalRates,
  defaultMonth,
  minMonth,
  specs,
  specOptions,
  kpiProfiles,
  kpiBadge,
  kpiHistory,
  kpiMonthOptions,
}: {
  row: StaffRow
  rateRules: DoctorRateRule[]
  overrides: Record<string, DoctorRateOverride>
  hasPersonalRates: boolean
  defaultMonth: string
  minMonth: string
  specs: DoctorSpecializations | undefined
  specOptions: Specialization[]
  kpiProfiles: KpiProfile[]
  kpiBadge: DoctorKpiBadge | undefined
  kpiHistory: DoctorKpiHistoryRow[]
  kpiMonthOptions: MonthOption[]
}) {
  const { t } = useI18n()
  const doctorItems = useMemo(
    () => Object.fromEntries(Object.entries(DOCTOR_ITEMS).map(([k, v]) => [k, t(v)])),
    [t],
  )
  const [flag, setFlag] = useState(flagToValue(row.is_doctor))
  const [note] = useState(row.note ?? "")
  const [pending, startTransition] = useTransition()

  const dirty = flag !== flagToValue(row.is_doctor) || (note || "") !== (row.note ?? "")

  const save = () => {
    startTransition(async () => {
      const res = await updateStaff(row.master_id, valueToFlag(flag), note || null)
      if (res.ok) toast.success(t("„{name}“ uloženo.", { name: row.full_name }))
      else toast.error(res.error)
    })
  }

  return (
    <TableRow>
      <TableCell className="max-w-0 pl-4 font-medium text-foreground">
        <div className="flex items-center gap-2">
          <span className="min-w-0 truncate" title={t(row.full_name)}>
            {t(row.full_name)}
          </span>
          {hasPersonalRates ? (
            <Badge variant="secondary" className="shrink-0 whitespace-nowrap">
              {t("osobní sazby")}
            </Badge>
          ) : null}
        </div>
      </TableCell>
      <TableCell>
        <Select value={flag} onValueChange={setFlag} disabled={pending} items={doctorItems}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value={DOCTOR_YES}>{t("Lékař")}</SelectItem>
              <SelectItem value={DOCTOR_NO}>{t("Není lékař")}</SelectItem>
              <SelectItem value={DOCTOR_UNSET}>{t("Neurčeno")}</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell className="max-w-0">
        {row.is_doctor === true ? (
          <DoctorSpecializationsDialog
            masterId={row.master_id}
            doctorName={row.full_name}
            specs={specs}
            options={specOptions}
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="max-w-0">
        {row.is_doctor === true ? (
          <DoctorKpiDialog
            masterId={row.master_id}
            doctorName={row.full_name}
            profiles={kpiProfiles}
            current={kpiBadge}
            history={kpiHistory}
            defaultMonth={defaultMonth}
            monthOptions={kpiMonthOptions}
          />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )}
      </TableCell>
      <TableCell className="whitespace-nowrap pr-4">
        <div className="flex items-center justify-end gap-2">
          {row.is_doctor === true ? (
            <DoctorRatesDialog
              masterId={row.master_id}
              doctorName={row.full_name}
              rules={rateRules}
              overrides={overrides}
              defaultMonth={defaultMonth}
              minMonth={minMonth}
            />
          ) : null}
          <Button size="sm" onClick={save} disabled={pending || !dirty}>
            {pending ? <Spinner data-icon="inline-start" /> : null}
            {t("Uložit")}
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export function StaffTable({
  staff,
  rateRules,
  overridesByMaster,
  defaultMonth,
  minMonth,
  specsByMaster,
  specOptions,
  kpiProfiles,
  kpiBadgeByMaster,
  kpiHistoryByMaster,
  kpiMonthOptions,
}: {
  staff: StaffRow[]
  rateRules: DoctorRateRule[]
  overridesByMaster: Record<string, Record<string, DoctorRateOverride>>
  defaultMonth: string
  minMonth: string
  specsByMaster: Record<string, DoctorSpecializations>
  specOptions: Specialization[]
  kpiProfiles: KpiProfile[]
  kpiBadgeByMaster: Record<string, DoctorKpiBadge>
  kpiHistoryByMaster: Record<string, DoctorKpiHistoryRow[]>
  kpiMonthOptions: MonthOption[]
}) {
  const { t } = useI18n()
  const [q, setQ] = useState("")
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    if (!needle) return staff
    return staff.filter((s) => s.full_name.toLowerCase().includes(needle))
  }, [q, staff])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-2">
        <InputGroup className="w-full max-w-sm">
          <InputGroupInput
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("Hledat zaměstnance…")}
          />
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
        </InputGroup>
        <Badge variant="secondary">{filtered.length}</Badge>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border">
        <Table className="table-fixed w-full min-w-[1080px]">
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">{t("Zaměstnanec")}</TableHead>
              <TableHead className="w-[150px]">{t("Označení")}</TableHead>
              <TableHead className="w-[220px]">{t("Specializace")}</TableHead>
              <TableHead className="w-[180px]">KPI</TableHead>
              <TableHead className="w-[210px] text-right pr-4">{t("Akce")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length > 0 ? (
              filtered.map((s) => (
                <StaffRowItem
                  key={s.master_id}
                  row={s}
                  rateRules={rateRules}
                  overrides={overridesByMaster[s.master_id] ?? {}}
                  hasPersonalRates={!!overridesByMaster[s.master_id]}
                  defaultMonth={defaultMonth}
                  minMonth={minMonth}
                  specs={specsByMaster[s.master_id]}
                  specOptions={specOptions}
                  kpiProfiles={kpiProfiles}
                  kpiBadge={kpiBadgeByMaster[s.master_id]}
                  kpiHistory={kpiHistoryByMaster[s.master_id] ?? []}
                  kpiMonthOptions={kpiMonthOptions}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("Dotazu neodpovídá žádný zaměstnanec.")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
