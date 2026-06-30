import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav } from '@/components/BottomNav'
import { MaintenanceScreen } from '@/components/MaintenanceScreen'
import { SpoilerProvider } from '@/contexts/SpoilerContext'
import { IdentityProvider } from '@/contexts/IdentityContext'
import { IdentityModal } from '@/components/IdentityModal'
import { MAINTENANCE_MODE } from '@/lib/maintenance'
import { NO_FLASH_SCRIPT } from '@/lib/use-theme'
import { Analytics } from '@vercel/analytics/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Porra Rier WC 2026',
  description: 'Porra del Mundial 2026 — Grupo Rier',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#f1f5f9" />
        <script dangerouslySetInnerHTML={{ __html: NO_FLASH_SCRIPT }} />
      </head>
      <body className={`${inter.className} bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50  min-h-screen`}>
        {MAINTENANCE_MODE ? (
          <MaintenanceScreen />
        ) : (
          <IdentityProvider>
            <SpoilerProvider>
              <div className="max-w-md mx-auto bg-slate-100 dark:bg-slate-950 min-h-screen flex flex-col">
                <AppHeader />
                <main className="flex-1 overflow-y-auto pb-20">
                  {children}
                </main>
                <BottomNav />
              </div>
            </SpoilerProvider>
            <IdentityModal />
          </IdentityProvider>
        )}
        <Analytics />
      </body>
    </html>
  )
}
