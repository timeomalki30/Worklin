'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

const NAV_ITEMS = [
  { href: '/dashboard/artisan', label: 'Tableau de bord', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { href: '/dashboard/artisan/agenda', label: 'Agenda', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>, badge: 'RDV' },
  { href: '/dashboard/artisan/devis', label: 'Devis', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
  { href: '/dashboard/artisan/factures', label: 'Factures', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
  { href: '/dashboard/artisan/clients', label: 'Clients', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: '/dashboard/artisan/parametres', label: 'Paramètres', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

export default function ArtisanDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [artisanNom, setArtisanNom] = useState('')
  const [rdvCount, setRdvCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)

      const { data: a } = await supabase.from('artisans').select('metier').eq('profile_id', user.id).single()
      setArtisanNom(a?.metier || 'Artisan')

      const { count } = await supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('artisan_id', user.id).eq('statut', 'en_attente')
      setRdvCount(count || 0)
    }
    load()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const isActive = (href: string) => href === '/dashboard/artisan' ? pathname === href : pathname.startsWith(href)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '100vh' }}>
      {/* Sidebar */}
      <aside style={{ background: 'var(--c-text)', color: 'rgba(255,255,255,0.85)', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 24px', color: 'white', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'var(--fs-lg)', letterSpacing: '-0.025em' }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-accent)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 18, position: 'relative', overflow: 'hidden' }}>
            A
            <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'rgba(0,0,0,0.2)' }}></span>
          </div>
          <div>
            Worklin
            <small style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 2 }}>Pro</small>
          </div>
        </Link>

        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.16em', padding: '8px 12px', fontWeight: 700, fontFamily: 'var(--font-head)' }}>Navigation</div>

        <ul style={{ listStyle: 'none', padding: '8px 0', flex: 1 }}>
          {NAV_ITEMS.map(item => (
            <li key={item.href}>
              <Link href={item.href} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 'var(--r-md)', color: isActive(item.href) ? 'white' : 'rgba(255,255,255,0.65)', fontSize: 'var(--fs-sm)', fontWeight: isActive(item.href) ? 600 : 500, marginBottom: 2, background: isActive(item.href) ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'all var(--transition-fast)', textDecoration: 'none' }}>
                <span style={{ width: 18, height: 18, flexShrink: 0 }}>{item.icon}</span>
                {item.label}
                {item.badge === 'RDV' && rdvCount > 0 && (
                  <span style={{ marginLeft: 'auto', background: 'var(--c-accent)', color: 'white', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-head)' }}>{rdvCount}</span>
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div onClick={handleLogout} style={{ padding: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background var(--transition-fast)' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'var(--c-accent)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'white', fontSize: 16 }}>
            {profile?.prenom?.[0]?.toUpperCase() || 'A'}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: 'white', fontSize: 'var(--fs-sm)', fontWeight: 700, fontFamily: 'var(--font-head)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {profile?.prenom} {profile?.nom}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, textTransform: 'capitalize' }}>{artisanNom}</div>
          </div>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </div>
      </aside>

      {/* Main */}
      <main style={{ padding: '28px 36px', background: 'var(--c-bg)', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  )
}
