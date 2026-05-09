'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'
import NotificationBell from '@/components/NotificationBell'
import OnboardingModal from '@/components/OnboardingModal'

const NAV_ITEMS = [
  { href: '/dashboard/artisan', label: 'Tableau de bord', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> },
  { href: '/dashboard/artisan/agenda', label: 'Agenda', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
  { href: '/dashboard/artisan/devis', label: 'Devis', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg> },
  { href: '/dashboard/artisan/factures', label: 'Factures', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg> },
  { href: '/dashboard/artisan/clients', label: 'Clients', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg> },
  { href: '/dashboard/artisan/chantiers', label: 'Chantiers', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M2 20h20M4 20V10L12 4l8 6v10"/><path d="M10 14h4v6h-4z"/></svg> },
  { href: '/dashboard/artisan/finances', label: 'Finances', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> },
  { href: '/dashboard/artisan/vitrine', label: 'Vitrine', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg> },
  { href: '/dashboard/artisan/ia', label: 'IA', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2a4 4 0 0 1 4 4c0 1.5-.8 2.8-2 3.5V11h2a2 2 0 0 1 2 2v1h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1v-1a2 2 0 0 1 2-2h2V9.5C8.8 8.8 8 7.5 8 6a4 4 0 0 1 4-4z"/><circle cx="9" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/></svg> },
  { href: '/dashboard/artisan/parametres', label: 'Paramètres', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> },
]

// Bottom tab items (mobile — 5 max)
const MOBILE_TABS = [
  NAV_ITEMS[0], // Dashboard
  NAV_ITEMS[2], // Devis
  NAV_ITEMS[4], // Clients
  NAV_ITEMS[6], // Finances
  NAV_ITEMS[9], // Paramètres
]

export default function ArtisanDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [artisanNom, setArtisanNom] = useState('')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [onboardingData, setOnboardingData] = useState({
    prenom: '', nom: '', phone: '',
    metier: '', siret: '', ville: '',
    slug: '', description: '',
  })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)

      const { data: a } = await supabase.from('artisans').select('*').eq('profile_id', user.id).single()
      if (a) {
        setArtisanId(a.id)
        setArtisanNom(a?.metier || 'Artisan')
        setOnboardingData({
          prenom: p?.prenom || '',
          nom: p?.nom || '',
          phone: p?.phone || '',
          metier: a.metier || '',
          siret: a.siret || '',
          ville: a.ville || '',
          slug: a.slug || '',
          description: a.description || '',
        })
        // Show onboarding if not done (check onboarding_done field or if metier is empty)
        const needsOnboarding = p?.onboarding_done === false || (!p?.onboarding_done && !a.metier)
        if (needsOnboarding) {
          setShowOnboarding(true)
        }
      }
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
    <>
      {/* Onboarding */}
      {showOnboarding && profile && artisanId && (
        <OnboardingModal
          profileId={profile.id}
          artisanId={artisanId}
          initialData={onboardingData}
          onComplete={() => setShowOnboarding(false)}
        />
      )}

      {/* Mobile bottom safe area padding */}
      <style>{`
        @media (max-width: 768px) {
          .dashboard-layout { display: block !important; }
          .sidebar-desktop { display: none !important; }
          .main-content { padding: 16px 16px 80px !important; }
          .mobile-tabs { display: flex !important; }
          .kpi-4 { grid-template-columns: repeat(2, 1fr) !important; }
          .hide-mobile { display: none !important; }
          table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
        }
        @media (min-width: 769px) {
          .dashboard-layout { display: grid; grid-template-columns: 260px 1fr; }
          .sidebar-desktop { display: flex !important; }
          .mobile-tabs { display: none !important; }
        }
      `}</style>

      <div className="dashboard-layout" style={{ minHeight: '100vh' }}>
        {/* Sidebar — desktop */}
        <aside className="sidebar-desktop" style={{ background: 'var(--c-text)', color: 'rgba(255,255,255,0.85)', padding: '24px 16px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto', flexDirection: 'column' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0 12px 24px', color: 'white', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'var(--fs-lg)', letterSpacing: '-0.025em', textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--c-accent)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 18 }}>W</div>
            <div>
              Worklin
              <small style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '0.16em', marginTop: 2 }}>Pro</small>
            </div>
          </Link>

          {/* Notification bell row */}
          <div style={{ padding: '0 12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700, fontFamily: 'var(--font-head)' }}>Navigation</span>
            {artisanId && <NotificationBell artisanId={artisanId} />}
          </div>

          <ul style={{ listStyle: 'none', padding: '4px 0', flex: 1 }}>
            {NAV_ITEMS.map(item => (
              <li key={item.href}>
                <Link href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px',
                  borderRadius: 'var(--r-md)', color: isActive(item.href) ? 'white' : 'rgba(255,255,255,0.65)',
                  fontSize: 'var(--fs-sm)', fontWeight: isActive(item.href) ? 600 : 500, marginBottom: 2,
                  background: isActive(item.href) ? 'rgba(255,255,255,0.1)' : 'transparent',
                  transition: 'all var(--transition-fast)', textDecoration: 'none',
                }}>
                  <span style={{ width: 18, height: 18, flexShrink: 0 }}>{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Footer */}
          <div onClick={handleLogout} style={{ padding: 14, background: 'rgba(255,255,255,0.06)', borderRadius: 'var(--r-md)', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
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
        <main className="main-content" style={{ padding: '28px 36px', background: 'var(--c-bg)', minHeight: '100vh' }}>
          {/* Mobile header */}
          <div className="mobile-tabs" style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100, background: 'var(--c-text)', padding: '12px 16px', alignItems: 'center', justifyContent: 'space-between' }}>
            <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'white', textDecoration: 'none', fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 16 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--c-accent)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 800, fontSize: 14 }}>W</div>
              Worklin
            </Link>
            {artisanId && <NotificationBell artisanId={artisanId} />}
          </div>
          <div className="mobile-tabs" style={{ display: 'none', height: 52 }} />

          {children}
        </main>
      </div>

      {/* Mobile bottom tab bar */}
      <nav className="mobile-tabs" style={{
        display: 'none', position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
        background: 'var(--c-text)', borderTop: '1px solid rgba(255,255,255,0.1)',
        padding: '8px 0 calc(8px + env(safe-area-inset-bottom))',
      }}>
        {MOBILE_TABS.map(item => {
          const active = isActive(item.href)
          return (
            <Link key={item.href} href={item.href} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
              color: active ? 'var(--c-accent)' : 'rgba(255,255,255,0.5)',
              textDecoration: 'none', padding: '4px 0', fontSize: 9, fontWeight: active ? 700 : 500,
              fontFamily: 'var(--font-head)', textTransform: 'uppercase', letterSpacing: '0.05em',
              minHeight: 44,
            }}>
              <span style={{ width: 20, height: 20 }}>{item.icon}</span>
              <span style={{ fontSize: 9 }}>{item.label.split(' ')[0]}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
