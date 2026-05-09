import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Worklin — L\'artisan qu\'il vous faut, disponible quand vous voulez',
  description: 'Réservez en ligne un plombier, électricien, menuisier, ébéniste ou tapissier. Lancement à Paris.',
  icons: {
    icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%230B2440'/%3E%3Crect x='0' y='19' width='32' height='13' rx='0' fill='%23DD5A2A'/%3E%3Ctext x='16' y='22' font-family='sans-serif' font-size='18' font-weight='800' fill='white' text-anchor='middle'%3EA%3C/text%3E%3C/svg%3E",
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
