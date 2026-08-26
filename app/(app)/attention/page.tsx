import { Users, UserCog, Tags, Check } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { SourceItem } from "@/components/attention/source-item"
import { StaffItem } from "@/components/attention/staff-item"
import { CategoryItem } from "@/components/attention/category-item"
import { UnmatchedLinesCard } from "@/components/attention/unmatched-lines-card"
import { MonthSelector } from "@/components/dashboard/month-selector"
import { getPeriods } from "@/lib/queries/dashboard"
import {
  getUnmappedSources,
  getUnflaggedStaff,
  getNewCategories,
  getUnmatchedLines,
  getIgnoredUnmatchedLines,
  getExistingCategories,
  getDoctorOptions,
  getBucketOptions,
} from "@/lib/queries/attention"

export const metadata = {
  title: "Vyžaduje pozornost",
}

export const dynamic = "force-dynamic"

function SectionCard({
  id,
  icon: Icon,
  title,
  description,
  count,
  children,
}: {
  id?: string
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  count: number
  children: React.ReactNode
}) {
  return (
    <Card id={id} className="scroll-mt-6">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Icon className="size-5 text-muted-foreground" />
            <CardTitle>{title}</CardTitle>
          </div>
          <Badge variant={count > 0 ? "default" : "secondary"}>{count}</Badge>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">{children}</CardContent>
    </Card>
  )
}

function ResolvedEmpty({ label }: { label: string }) {
  return (
    <Empty className="border border-dashed border-border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Check className="size-5" />
        </EmptyMedia>
        <EmptyTitle>Vše vyřešeno</EmptyTitle>
        <EmptyDescription>{label}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export default async function AttentionPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period: periodParam } = await searchParams
  const periods = await getPeriods()

  // ?period= if present and valid → otherwise no filter ("Všechna období"), since this
  // page mixes period-scoped and global content and defaults to showing everything.
  const selected = periods.some((p) => p.period === periodParam) ? (periodParam as string) : null

  const [sources, staff, categories, unmatched, ignored, existingCategories, doctors, buckets] = await Promise.all([
    getUnmappedSources(),
    getUnflaggedStaff(),
    getNewCategories(selected ?? undefined),
    getUnmatchedLines(selected ?? undefined),
    getIgnoredUnmatchedLines(),
    getExistingCategories(),
    getDoctorOptions(),
    getBucketOptions(),
  ])

  const total = sources.length + staff.length + categories.length + unmatched.length

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground text-balance">
            Vyžaduje pozornost
          </h1>
          <p className="text-sm text-muted-foreground">
            {total > 0
              ? `${total} položek čeká na vaše rozhodnutí před výpočtem provizí.`
              : "Žádné otevřené položky — vše je vyřešeno."}
          </p>
        </div>
        <MonthSelector periods={periods} current={selected} allowAll />
      </div>

      <SectionCard
        id="sources"
        icon={Users}
        title="Nepřiřazené zdroje"
        description="Zdroje doporučení bez vazby na lékaře (všechna období)."
        count={sources.length}
      >
        {sources.length > 0 ? (
          sources.map((s) => <SourceItem key={s.source_id} source={s} doctors={doctors} />)
        ) : (
          <ResolvedEmpty label="Všechny zdroje jsou přiřazené nebo označené bez provize." />
        )}
      </SectionCard>

      <SectionCard
        id="staff"
        icon={UserCog}
        title="Zaměstnanci bez označení"
        description="Personál, u kterého není určeno, zda jde o lékaře (všechna období)."
        count={staff.length}
      >
        {staff.length > 0 ? (
          staff.map((s) => <StaffItem key={s.master_id} staff={s} />)
        ) : (
          <ResolvedEmpty label="Všichni zaměstnanci jsou označeni." />
        )}
      </SectionCard>

      <SectionCard
        id="categories"
        icon={Tags}
        title="Nové kategorie bez sazby"
        description="Kategorie služeb, které se objevily bez pravidla pro přiřazení do skupiny."
        count={categories.length}
      >
        {categories.length > 0 ? (
          categories.map((c) => <CategoryItem key={c.category_id} category={c} buckets={buckets} />)
        ) : (
          <ResolvedEmpty label="Všechny kategorie jsou přiřazené ke skupinám." />
        )}
      </SectionCard>

      <UnmatchedLinesCard
        lines={unmatched}
        ignored={ignored}
        buckets={buckets}
        categories={existingCategories}
      />
    </div>
  )
}
