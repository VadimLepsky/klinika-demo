import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/sonner'
import { I18nProvider } from '@/lib/i18n/client'
import { getI18n } from '@/lib/i18n/server'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'latin-ext'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n()
  return {
    ...baseMetadata,
    title: t('demo.clinic — Provize'),
    description: t('Interní analytika a správa provizí lékařů'),
  }
}

const baseMetadata: Metadata = {
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
        type: 'image/png',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
        type: 'image/png',
      },
    ],
  },
}

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#fefefe' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0e1f' },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { locale } = await getI18n()
  return (
    <html lang={locale} suppressHydrationWarning className="bg-background">
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <I18nProvider locale={locale}>
            {children}
            <Toaster />
          </I18nProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
