import {
  BarChart3,
  ClipboardList,
  History,
  Layers,
  Lock,
  Package,
  Percent,
  TriangleAlert,
  Users,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type NavItem = {
  href: string
  label: string
  icon: LucideIcon
}

export type NavSection = {
  label?: string
  items: NavItem[]
}

export const navSections: NavSection[] = [
  {
    items: [
      { href: "/", label: "Přehled", icon: BarChart3 },
      { href: "/attention", label: "Vyžaduje pozornost", icon: TriangleAlert },
      { href: "/periods", label: "Období", icon: Lock },
    ],
  },
  {
    label: "Nastavení",
    items: [
      { href: "/settings/buckets", label: "Skupiny provizí", icon: Package },
      { href: "/settings/rates", label: "Sazby", icon: Percent },
      { href: "/settings/mapping", label: "Kategorie a služby", icon: Layers },
      { href: "/settings/sources", label: "Zdroje", icon: ClipboardList },
      { href: "/settings/staff", label: "Zaměstnanci", icon: Users },
    ],
  },
  {
    label: "Systém",
    items: [{ href: "/audit", label: "Historie změn", icon: History }],
  },
]

export const pageTitles: Record<string, string> = {
  "/": "Přehled",
  "/attention": "Vyžaduje pozornost",
  "/periods": "Období a uzávěrka",
  "/settings/buckets": "Skupiny provizí",
  "/settings/rates": "Sazby",
  "/settings/mapping": "Kategorie a služby",
  "/settings/sources": "Zdroje",
  "/settings/staff": "Zaměstnanci",
  "/audit": "Historie změn",
}
