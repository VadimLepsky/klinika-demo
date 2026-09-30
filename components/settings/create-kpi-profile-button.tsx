"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { KpiProfileEditDialog } from "@/components/settings/kpi-profile-edit-dialog"

export function CreateKpiProfileButton() {
  return (
    <KpiProfileEditDialog
      trigger={
        <Button size="sm">
          <Plus data-icon="inline-start" />
          Vytvořit profil
        </Button>
      }
    />
  )
}
