"use client"

import { Languages } from "lucide-react"
import { useRouter } from "next/navigation"
import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { LOCALE_COOKIE, type Locale } from "@/lib/i18n/config"
import { useI18n } from "@/lib/i18n/client"

export function LanguageSwitcher() {
  const { locale, t } = useI18n()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const next: Locale = locale === "cs" ? "en" : "cs"

  function switchLocale() {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
    startTransition(() => router.refresh())
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      disabled={pending}
      aria-label={t("Přepnout jazyk")}
      onClick={switchLocale}
      className="gap-1.5 font-medium"
    >
      <Languages />
      {next.toUpperCase()}
    </Button>
  )
}
