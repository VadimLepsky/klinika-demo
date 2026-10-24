"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { useI18n } from "@/lib/i18n/client"

export function ThemeToggle() {
  const { t } = useI18n()
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // The resolved theme is unknown during SSR, so every theme-dependent output
  // (icon AND aria-label) must wait for mount or hydration will mismatch.
  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={isDark ? t("Zapnout světlý režim") : t("Zapnout tmavý režim")}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun /> : <Moon />}
    </Button>
  )
}
