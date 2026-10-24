"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiProfileEditDialog } from "@/components/settings/kpi-profile-edit-dialog"
import { useI18n } from "@/lib/i18n/client"

export function CreateKpiProfileButton() {
  const { t } = useI18n()
  return (
    <KpiProfileEditDialog
      trigger={
        <Button size="sm">
          <Plus data-icon="inline-start" />
          {t("Vytvořit profil")}
        </Button>
      }
    />
  )
}
