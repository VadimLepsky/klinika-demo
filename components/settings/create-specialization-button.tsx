"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SpecializationNameDialog } from "@/components/settings/specializations-table"
import { createSpecialization } from "@/app/(app)/settings/specializations/actions"
import { useI18n } from "@/lib/i18n/client"

export function CreateSpecializationButton() {
  const { t } = useI18n()
  return (
    <SpecializationNameDialog
      title={t("Nová specializace")}
      successMessage={t("Specializace byla vytvořena.")}
      onSubmit={createSpecialization}
      trigger={
        <Button size="sm">
          <Plus data-icon="inline-start" />
          {t("Vytvořit")}
        </Button>
      }
    />
  )
}
