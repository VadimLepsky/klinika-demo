"use client"

import { createContext, useContext, type ReactNode } from "react"
import { defaultLocale, type Locale } from "./config"
import { getI18nFor, type I18n } from "./core"

const LocaleContext = createContext<Locale>(defaultLocale)

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
}

/** Translator + formatters for Client Components. */
export function useI18n(): I18n {
  return getI18nFor(useContext(LocaleContext))
}
