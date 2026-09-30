"use client"

import Image from "next/image"
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { navSections } from "@/lib/nav"
import { withPeriod } from "@/lib/period-link"

// Routes that read the shared ?period= param — carry it along from the sidebar too.
const PERIOD_AWARE_ROUTES = ["/", "/attention", "/periods"]

export function AppSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const period = searchParams.get("period")
  const spec = searchParams.get("spec")

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href))

  const linkHref = (href: string) =>
    PERIOD_AWARE_ROUTES.includes(href) ? withPeriod(href, period, href === "/" ? spec : null) : href

  return (
    <Sidebar collapsible="none" className="h-svh sticky top-0 border-r border-sidebar-border">
      <SidebarHeader className="h-16 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-2 py-1.5">
          <div className="flex size-9 items-center justify-center rounded-md">
            <Image
              src="/logo-placeholder.png"
              alt="demo.clinic"
              width={36}
              height={36}
              className="rounded-md"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">demo.clinic</span>
            <span className="text-xs text-muted-foreground leading-tight">Provize lékařů</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="pt-5">
        {navSections.map((section, i) => (
          <SidebarGroup key={section.label ?? `section-${i}`}>
            {section.label ? <SidebarGroupLabel>{section.label}</SidebarGroupLabel> : null}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={isActive(item.href)}
                      tooltip={item.label}
                      render={
                        <Link href={linkHref(item.href)}>
                          <item.icon />
                          <span>{item.label}</span>
                        </Link>
                      }
                    />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}
