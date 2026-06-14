import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { AppHeader } from '@/components/AppHeader'
import { BottomNav } from '@/components/BottomNav'
import { SpoilerProvider } from '@/contexts/SpoilerContext'
import { LiteProvider } from '@/contexts/LiteContext'
import { PaywallProvider } from '@/contexts/PaywallContext'
import { IdentityProvider } from '@/contexts/IdentityContext'
import { PaywallModal } from '@/components/PaywallModal'
import { IdentityModal } from '@/components/IdentityModal'
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
    <html lang="es">
      <body className={`${inter.className} bg-slate-100 min-h-screen`}>
        <LiteProvider>
          <PaywallProvider>
            <IdentityProvider>
              <SpoilerProvider>
                <div className="max-w-md mx-auto bg-slate-100 min-h-screen flex flex-col">
                  <AppHeader />
                  <main className="flex-1 overflow-y-auto pb-20">
                    {children}
                  </main>
                  <BottomNav />
                </div>
              </SpoilerProvider>
              <PaywallModal />
              <IdentityModal />
            </IdentityProvider>
          </PaywallProvider>
        </LiteProvider>
        <Analytics />
      </body>
    </html>
  )
}
