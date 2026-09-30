import {
  BarChart3,
  ClipboardList,
  Gauge,
  History,
  Layers,
  Lock,
  Percent,
  Stethoscope,
  TriangleAlert,
  UserCog,
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
      { href: "/settings/buckets", label: "Pravidla provizí", icon: Percent },
      { href: "/settings/mapping", label: "Kategorie z CRM", icon: Layers },
      { href: "/settings/sources", label: "Zdroje", icon: ClipboardList },
      { href: "/settings/staff", label: "Zaměstnanci", icon: Users },
      { href: "/settings/specializations", label: "Specializace", icon: Stethoscope },
      { href: "/settings/kpi", label: "KPI profily", icon: Gauge },
      { href: "/settings/users", label: "Uživatelé", icon: UserCog },
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
  "/settings/buckets": "Pravidla provizí",
  "/settings/mapping": "Kategorie z CRM",
  "/settings/sources": "Zdroje",
  "/settings/staff": "Zaměstnanci",
  "/settings/specializations": "Specializace",
  "/settings/kpi": "KPI profily",
  "/settings/users": "Uživatelé",
  "/audit": "Historie změn",
}
