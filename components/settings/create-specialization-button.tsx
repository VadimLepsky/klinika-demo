"use client"

import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SpecializationNameDialog } from "@/components/settings/specializations-table"
import { createSpecialization } from "@/app/(app)/settings/specializations/actions"

export function CreateSpecializationButton() {
  return (
    <SpecializationNameDialog
      title="Nová specializace"
      successMessage="Specializace byla vytvořena."
      onSubmit={createSpecialization}
      trigger={
        <Button size="sm">
          <Plus data-icon="inline-start" />
          Vytvořit
        </Button>
      }
    />
  )
}
