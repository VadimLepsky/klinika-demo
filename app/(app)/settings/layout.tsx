import { SettingsTabs } from "@/components/settings/settings-tabs"
import { getI18n } from "@/lib/i18n/server"

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { t } = await getI18n()
  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
          {t("Nastavení")}
        </h1>
      </div>
      <SettingsTabs />
      {children}
    </div>
  )
}
