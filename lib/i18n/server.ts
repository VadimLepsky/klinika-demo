import "server-only"
import { cookies } from "next/headers"
import { cache } from "react"
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config"
import { getI18nFor, type I18n } from "./core"
import type { TVars } from "./translate"

export const getLocale = cache(async (): Promise<Locale> => {
  const value = (await cookies()).get(LOCALE_COOKIE)?.value
  return isLocale(value) ? value : defaultLocale
})

/** Translator + formatters for the current request (Server Components and Server Actions). */
export async function getI18n(): Promise<I18n> {
  return getI18nFor(await getLocale())
}

/**
 * Error text for an action result. Actions throw their Czech source message
 * (`throw new Error("Období je uzavřené")`); it is translated here, at the
 * boundary, so throw sites don't each need the translator.
 */
export async function actionError(e: unknown): Promise<string> {
  const { t } = await getI18n()
  return e instanceof Error ? t(e.message) : t("Chyba")
}

/** One-off translation in async server code: `error: await tr("Období nebylo nalezeno.")`. */
export async function tr(message: string, vars?: TVars): Promise<string> {
  return (await getI18n()).t(message, vars)
}
