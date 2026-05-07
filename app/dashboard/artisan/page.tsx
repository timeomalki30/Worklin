'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, FileText, Wrench, Star, ArrowRight, Clock, CheckCircle, AlertCircle } from 'lucide-react'
import { statusBadge } from '@/components/ui/badge'

export default function DashboardPage() {
  const router = useRouter()
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [kpis, setKpis] = useState({ ca_mois: 0, devis_attente: 0, chantiers_actifs: 0, note: 0 })
  const [recentDevis, setRecentDevis] = useState<any[]>([])
  const [demandes, setDemandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [conformite, setConformite] = useState({ ok: false, missing: [] as string[] })

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', user.id).single(),
        supabase.from('artisans').select('*').eq('profile_id', user.id).single(),
      ])
      setProfile(p)
      if (!a) return

      setArtisanId(a.id)

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

      const [{ data: factures }, { data: devis }, { data: chantiers }, { data: demandesData }] = await Promise.all([
        supabase.from('factures').select('total_ttc, statut').eq('artisan_id', a.id).gte('date_emission', startOfMonth).in('statut', ['envoyee', 'payee']),
        supabase.from('devis').select('*, clients(nom, prenom)').eq('artisan_id', a.id).order('created_at', { ascending: false }).limit(5),
        supabase.from('chantiers').select('id').eq('artisan_id', a.id).eq('statut', 'en_cours'),
        supabase.from('demandes').select('*').eq('artisan_id', a.id).eq('statut', 'nouveau').order('created_at', { ascending: false }).limit(5),
      ])

      const ca = (factures || []).reduce((s: number, f: any) => s + (f.total_ttc || 0), 0)
      const devisAttente = (devis || []).filter((d: any) => d.statut === 'envoye').length

      setKpis({
        ca_mois: ca,
        devis_attente: devisAttente,
        chantiers_actifs: chantiers?.length || 0,
        note: a.note_moyenne || 0,
      })
      setRecentDevis(devis || [])
      setDemandes(demandesData || [])

      // Conformité
      const missing = []
      if (!a.siret) missing.push('SIRET')
      if (!a.tva) missing.push('N° TVA')
      if (!p?.phone) missing.push('Téléphone')
      setConformite({ ok: missing.length === 0, missing })

      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="spinner w-8 h-8 border-navy-800" />
    </div>
  )

  const kpiCards = [
    { label: 'CA ce mois', value: formatCurrency(kpis.ca_mois), icon: <TrendingUp size={20} />, color: 'bg-terra-500', change: '+12%' },
    { label: 'Devis en attente', value: kpis.devis_attente, icon: <FileText size={20} />, color: 'bg-navy-700', href: '/dashboard/artisan/devis' },
    { label: 'Chantiers actifs', value: kpis.chantiers_actifs, icon: <Wrench size={20} />, color: 'bg-navy-600', href: '/dashboard/artisan/chantiers' },
    { label: 'Note moyenne', value: kpis.note > 0 ? `${kpis.note.toFixed(1)} ★` : '—', icon: <Star size={20} />, color: 'bg-yellow-500' },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            Bonjour, {profile?.prenom} 👋
          </h1>
          <p className="text-navy-400 mt-1">Voici un aperçu de votre activité</p>
        </div>
        <Link href="/dashboard/artisan/devis" className="btn btn-terra no-underline">
          <FileText size={16} />
          Nouveau devis
        </Link>
      </div>

      {/* Conformité badge */}
      {!conformite.ok && (
        <div className="flex items-center gap-4 bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <AlertCircle size={20} className="text-yellow-600 flex-shrink-0" />
          <div className="flex-1">
            <div className="font-semibold text-yellow-800 text-sm">Complétez votre profil pour activer la conformité 2027</div>
            <div className="text-xs text-yellow-700 mt-0.5">Manquant : {conformite.missing.join(', ')}</div>
          </div>
          <Link href="/dashboard/artisan/parametres" className="btn btn-sm bg-yellow-600 text-white hover:bg-yellow-700 no-underline">Compléter</Link>
        </div>
      )}
      {conformite.ok && (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl p-4">
          <CheckCircle size={18} className="text-green-600 flex-shrink-0" />
          <span className="text-sm font-semibold text-green-800">Profil conforme réforme facturation électronique 2027 ✓</span>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((k, i) => (
          <div key={i} className={`kpi-card ${k.href ? 'cursor-pointer hover:shadow-md' : ''}`} onClick={() => k.href && router.push(k.href)}>
            <div className={`w-10 h-10 ${k.color} rounded-xl grid place-items-center text-white mb-3`}>
              {k.icon}
            </div>
            <div className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{k.value}</div>
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-navy-400 uppercase tracking-wider">{k.label}</div>
              {k.change && <span className="text-xs text-green-600 font-bold">{k.change}</span>}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent devis */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300">
            <h2 className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Derniers devis</h2>
            <Link href="/dashboard/artisan/devis" className="text-sm text-terra-600 font-semibold hover:text-terra-700 no-underline flex items-center gap-1">
              Voir tout <ArrowRight size={14} />
            </Link>
          </div>
          {recentDevis.length === 0 ? (
            <div className="p-8 text-center text-navy-400 text-sm">
              <FileText size={32} className="mx-auto mb-3 opacity-30" />
              <p>Aucun devis pour l&apos;instant</p>
              <Link href="/dashboard/artisan/devis" className="btn btn-terra btn-sm mt-4 no-underline inline-flex">Créer mon premier devis</Link>
            </div>
          ) : (
            <table className="w-table">
              <thead>
                <tr>
                  <th>Numéro</th><th>Client</th><th>Montant</th><th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {recentDevis.map(d => (
                  <tr key={d.id}>
                    <td className="font-bold text-navy-700">{d.numero}</td>
                    <td className="text-navy-600">{d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.trim() : '—'}</td>
                    <td className="font-semibold">{formatCurrency(d.total_ttc)}</td>
                    <td>{statusBadge(d.statut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Nouvelles demandes */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300">
            <h2 className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Nouvelles demandes</h2>
            {demandes.length > 0 && <span className="badge badge-terra">{demandes.length}</span>}
          </div>
          {demandes.length === 0 ? (
            <div className="p-6 text-center text-navy-400 text-sm">
              <Clock size={28} className="mx-auto mb-3 opacity-30" />
              <p>Aucune nouvelle demande</p>
              <Link href="/dashboard/artisan/vitrine" className="text-terra-600 font-semibold text-xs mt-2 block no-underline">Activez votre vitrine →</Link>
            </div>
          ) : (
            <div className="divide-y divide-cream-300">
              {demandes.map(d => (
                <div key={d.id} className="p-4">
                  <div className="font-semibold text-sm text-navy-800">{d.nom}</div>
                  <p className="text-xs text-navy-500 mt-1 line-clamp-2">{d.description}</p>
                  <div className="flex gap-2 mt-3">
                    <Link href={`/dashboard/artisan/devis?demande=${d.id}`} className="btn btn-sm btn-terra no-underline">Créer devis</Link>
                    <span className="text-xs text-navy-400 self-center">{new Date(d.created_at).toLocaleDateString('fr-FR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="font-bold text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Actions rapides</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Nouveau devis', href: '/dashboard/artisan/devis', icon: <FileText size={20} /> },
            { label: 'Nouvelle facture', href: '/dashboard/artisan/factures', icon: <Receipt size={20} /> },
            { label: 'Ajouter un client', href: '/dashboard/artisan/clients', icon: <Users size={20} /> },
            { label: 'Devis IA', href: '/dashboard/artisan/ia', icon: <Sparkles size={20} />, terra: true },
          ].map(({ label, href, icon, terra }) => (
            <Link key={href} href={href} className={`card p-5 flex flex-col items-start gap-3 hover:shadow-md no-underline group ${terra ? 'border-terra-200 bg-terra-50/50' : ''}`}>
              <div className={`w-10 h-10 rounded-xl grid place-items-center ${terra ? 'bg-terra-500 text-white' : 'bg-cream-200 text-navy-700'} group-hover:scale-110 transition-transform`}>
                {icon}
              </div>
              <span className={`font-semibold text-sm ${terra ? 'text-terra-700' : 'text-navy-700'}`}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// Missing imports used above
function Receipt({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
}
function Users({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>
}
