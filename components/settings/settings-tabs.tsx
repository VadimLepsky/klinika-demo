"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const TABS = [
  { href: "/settings/buckets", label: "Pravidla provizí" },
  { href: "/settings/mapping", label: "Kategorie z CRM" },
  { href: "/settings/sources", label: "Zdroje" },
  { href: "/settings/staff", label: "Zaměstnanci" },
  { href: "/settings/specializations", label: "Specializace" },
  { href: "/settings/kpi", label: "KPI profily" },
]

export function SettingsTabs() {
  const pathname = usePathname()
  return (
    <nav className="flex flex-wrap gap-1 border-b border-border" aria-label="Sekce nastavení">
      {TABS.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors",
              active
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
