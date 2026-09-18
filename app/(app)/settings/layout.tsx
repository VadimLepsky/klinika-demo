import { SettingsTabs } from "@/components/settings/settings-tabs"

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          Nastavení
        </h1>
      </div>
      <SettingsTabs />
      {children}
    </div>
  )
}
