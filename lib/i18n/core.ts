import { getFormatters, type Formatters } from "@/lib/format"
import type { Locale } from "./config"
import { createT, pluralForm, type TFunction, type TVars } from "./translate"

export type I18n = Formatters & {
  locale: Locale
  t: TFunction
  /** Plural-aware t(): `tn(n, "{n} lékař", "{n} lékaři", "{n} lékařů")`. `{n}` is filled in. */
  tn: (n: number, one: string, few: string, many: string, vars?: TVars) => string
}

const cache = new Map<Locale, I18n>()

export function getI18nFor(locale: Locale): I18n {
  let i18n = cache.get(locale)
  if (!i18n) {
    const t = createT(locale)
    const f = getFormatters(locale)
    i18n = {
      ...f,
      locale,
      t,
      tn: (n, one, few, many, vars) =>
        t(pluralForm(locale, n, one, few, many), { n: f.formatNumber(n), ...vars }),
    }
    cache.set(locale, i18n)
  }
  return i18n
}
