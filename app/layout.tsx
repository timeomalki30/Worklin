import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: { default: 'Worklin — L\'OS des artisans', template: '%s | Worklin' },
  description: 'Devis IA, factures, CRM, agenda, vitrine publique. L\'outil complet pour les artisans solos en France.',
  icons: { icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230B2440'/><text y='22' x='6' font-size='18' font-family='system-ui' font-weight='800' fill='white'>W</text></svg>" },
  openGraph: {
    title: 'Worklin — L\'OS des artisans',
    description: 'Gérez toute votre activité depuis une seule plateforme.',
    url: 'https://worklin.fr',
    siteName: 'Worklin',
    locale: 'fr_FR',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  )
}
