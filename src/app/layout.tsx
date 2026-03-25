import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '@/components/Navbar'

export const metadata: Metadata = {
  title: 'AdScore AI — Analyseur de scripts publicitaires',
  description: 'Détectez les risques de refus avant de lancer vos campagnes Google Ads et Meta Ads',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className="dark">
      <body className="bg-mesh min-h-screen">
        <Navbar />
        <main>{children}</main>
      </body>
    </html>
  )
}
