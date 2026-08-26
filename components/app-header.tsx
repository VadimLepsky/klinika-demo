"use client"

import { usePathname } from "next/navigation"
import { Separator } from "@/components/ui/separator"
import { ThemeToggle } from "@/components/theme-toggle"
import { pageTitles } from "@/lib/nav"

function resolveTitle(pathname: string): string {
  if (pageTitles[pathname]) return pageTitles[pathname]
  if (pathname.startsWith("/doctors/")) return "Karta lékaře"
  const match = Object.keys(pageTitles).find((key) => key !== "/" && pathname.startsWith(key))
  return match ? pageTitles[match] : "demo.clinic"
}

export function AppHeader() {
  const pathname = usePathname()
  const title = resolveTitle(pathname)

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  )
}
