import { SettingsTabs } from "@/components/settings/settings-tabs"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Nastavení
        </h1>
        <p className="text-sm text-muted-foreground">
          Pravidla přiřazení a sazby. Každá změna se zapisuje do historie změn.
        </p>
      </div>
      <SettingsTabs />
      {children}
    </div>
  )
}
