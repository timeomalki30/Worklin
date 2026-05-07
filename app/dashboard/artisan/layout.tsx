'use client'
export const dynamic = 'force-dynamic'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, FileText, Receipt, Users, Calendar,
  Sparkles, BarChart3, Globe, Settings, LogOut,
  Bell, ChevronRight, Wrench
} from 'lucide-react'
import type { Profile } from '@/types'

const NAV = [
  { href: '/dashboard/artisan', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/dashboard/artisan/devis', label: 'Devis', icon: FileText },
  { href: '/dashboard/artisan/factures', label: 'Factures', icon: Receipt },
  { href: '/dashboard/artisan/clients', label: 'Clients', icon: Users },
  { href: '/dashboard/artisan/chantiers', label: 'Chantiers', icon: Wrench },
  { href: '/dashboard/artisan/agenda', label: 'Agenda', icon: Calendar },
  { href: '/dashboard/artisan/vitrine', label: 'Vitrine', icon: Globe },
  { href: '/dashboard/artisan/ia', label: 'Assistant IA', icon: Sparkles, badge: 'IA' },
  { href: '/dashboard/artisan/finances', label: 'Finances', icon: BarChart3 },
  { href: '/dashboard/artisan/parametres', label: 'Paramètres', icon: Settings },
]

export default function ArtisanLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [metier, setMetier] = useState('Artisan')
  const [demandesCount, setDemandesCount] = useState(0)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: a } = await supabase.from('artisans').select('metier, id').eq('profile_id', user.id).single()
      if (a) {
        setMetier(a.metier)
        const { count } = await supabase.from('demandes').select('*', { count: 'exact', head: true }).eq('artisan_id', a.id).eq('statut', 'nouveau')
        setDemandesCount(count || 0)
      }
    }
    load()
  }, [router])

  const isActive = (href: string) => href === '/dashboard/artisan' ? pathname === href : pathname.startsWith(href)

  const handleLogout = async () => {
    await createClient().auth.signOut()
    router.push('/')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-cream-200">
      {/* Sidebar */}
      <aside className="w-64 bg-navy-800 flex flex-col flex-shrink-0 overflow-y-auto">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-white/10">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="w-9 h-9 bg-terra-500 rounded-xl grid place-items-center relative overflow-hidden flex-shrink-0">
              <span className="text-white font-black text-base relative z-10" style={{ fontFamily: 'var(--font-manrope)' }}>W</span>
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-black/20" />
            </div>
            <div>
              <div className="text-white font-black text-lg leading-none" style={{ fontFamily: 'var(--font-manrope)' }}>Worklin</div>
              <div className="text-terra-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Pro</div>
            </div>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <div className="px-3 mb-2 text-white/30 text-[10px] font-bold uppercase tracking-widest">Navigation</div>
          {NAV.map(({ href, label, icon: Icon, badge }) => {
            const active = isActive(href)
            return (
              <Link key={href} href={href}
                className={`nav-item ${active ? 'active' : ''}`}>
                <Icon size={17} className="flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {badge === 'IA' && <span className="text-[10px] font-bold bg-terra-500 text-white px-1.5 py-0.5 rounded-md">IA</span>}
                {href === '/dashboard/artisan/vitrine' && demandesCount > 0 && (
                  <span className="text-[10px] font-bold bg-terra-500 text-white w-5 h-5 rounded-full grid place-items-center">{demandesCount}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div className="px-3 pb-4 pt-2 border-t border-white/10">
          <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/10 cursor-pointer group" onClick={handleLogout}>
            <div className="w-9 h-9 rounded-xl bg-terra-500 grid place-items-center text-white font-bold text-sm flex-shrink-0" style={{ fontFamily: 'var(--font-manrope)' }}>
              {profile?.prenom?.[0]?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-white font-semibold text-sm truncate">{profile?.prenom} {profile?.nom}</div>
              <div className="text-white/40 text-xs truncate capitalize">{metier}</div>
            </div>
            <LogOut size={15} className="text-white/30 group-hover:text-white/70 flex-shrink-0" />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
