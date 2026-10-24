import { ShieldAlert } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { UsersTable } from "@/components/settings/users-table"
import { getUsers } from "@/lib/queries/users"
import { getSessionUser } from "@/lib/session"
import { getI18n } from "@/lib/i18n/server"

export async function generateMetadata() {
  const { t } = await getI18n()
  return { title: t("Uživatelé") }
}
export const dynamic = "force-dynamic"

export default async function UsersPage() {
  const { t } = await getI18n()
  const me = await getSessionUser()

  if (!me || me.role !== "admin") {
    return (
      <Card>
        <CardContent className="py-6">
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ShieldAlert />
              </EmptyMedia>
              <EmptyTitle>{t("Nedostatečná oprávnění")}</EmptyTitle>
              <EmptyDescription>
                {t("Správa uživatelů je dostupná jen administrátorům. Pokud potřebujete přístup, obraťte se na administrátora.")}
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  }

  const users = await getUsers()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("Uživatelé")}</CardTitle>
        <CardDescription>
          {t("Zvěte kolegy a upravujte jejich role. Přístup se uděluje jen na pozvání.")}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <UsersTable users={users} currentUserId={me.id} />
      </CardContent>
    </Card>
  )
}
