'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Search, Star, MapPin, Calendar, CheckCircle, Clock, ArrowRight, LogOut } from 'lucide-react'
import type { Profile } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  planifie: 'Planifié', confirme: 'Confirmé', annule: 'Annulé', termine: 'Terminé',
}
const STATUS_COLORS: Record<string, string> = {
  planifie: 'bg-blue-100 text-blue-800',
  confirme: 'bg-green-100 text-green-800',
  annule: 'bg-gray-100 text-gray-600',
  termine: 'bg-gray-100 text-gray-600',
}

export default function ClientDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [rdvs, setRdvs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)
  const [showAvis, setShowAvis] = useState<string | null>(null)
  const [avisForm, setAvisForm] = useState({ note: 5, commentaire: '', client_nom: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)
      const { data: events } = await supabase
        .from('agenda')
        .select('*, artisans(id, metier, entreprise, profiles(nom, prenom))')
        .eq('client_id', user.id)
        .order('date', { ascending: false })
      setRdvs(events || [])
      setLoading(false)
    }
    load()
  }, [router])

  const handleSearch = async () => {
    if (!search.trim()) return
    setSearching(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('artisans')
      .select('*, profiles(nom, prenom, phone)')
      .ilike('metier', `%${search}%`)
      .eq('actif', true)
      .limit(12)
    setSearchResults(data || [])
    setSearching(false)
  }

  const submitAvis = async (artisanId: string) => {
    if (!avisForm.client_nom || !artisanId) return
    setSubmitting(true)
    const supabase = createClient()
    await supabase.from('avis').insert({
      artisan_id: artisanId,
      client_nom: avisForm.client_nom || `${profile?.prenom} ${profile?.nom}`,
      note: avisForm.note,
      commentaire: avisForm.commentaire,
      source: 'dashboard',
    })
    // Update note moyenne
    const { data: avisData } = await supabase.from('avis').select('note').eq('artisan_id', artisanId)
    if (avisData && avisData.length > 0) {
      const avg = avisData.reduce((s: number, a: any) => s + a.note, 0) / avisData.length
      await supabase.from('artisans').update({ note_moyenne: avg, nb_avis: avisData.length }).eq('id', artisanId)
    }
    setShowAvis(null)
    setSubmitting(false)
  }

  const handleLogout = async () => {
    await createClient().auth.signOut()
    router.push('/')
  }

  const upcoming = rdvs.filter(r => r.date >= new Date().toISOString().split('T')[0] && r.statut !== 'annule')
  const past = rdvs.filter(r => r.statut === 'termine')

  if (loading) return <div className="min-h-screen bg-cream-200 flex items-center justify-center"><div className="spinner w-8 h-8 border-navy-800" /></div>

  return (
    <div className="min-h-screen bg-cream-200">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-navy-800 text-white">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 bg-terra-500 rounded-lg grid place-items-center">
              <span className="text-white font-black text-xs">W</span>
            </div>
            <span className="font-black text-white text-lg" style={{ fontFamily: 'var(--font-manrope)' }}>Worklin</span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-white/60 text-sm">{profile?.prenom} {profile?.nom}</span>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-white/60 hover:text-white text-sm transition-colors">
              <LogOut size={15} /> Déconnexion
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10 space-y-10">
        {/* Hero */}
        <div>
          <h1 className="text-3xl font-black text-navy-800 mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>
            Bonjour, {profile?.prenom} 👋
          </h1>
          <p className="text-navy-500">Trouvez un artisan de confiance ou consultez vos rendez-vous.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'RDV à venir', value: upcoming.length, icon: <Calendar size={20} />, color: 'bg-terra-500' },
            { label: 'Interventions', value: past.length, icon: <CheckCircle size={20} />, color: 'bg-green-500' },
            { label: 'Artisans contactés', value: new Set(rdvs.map(r => r.artisan_id)).size, icon: <Star size={20} />, color: 'bg-navy-600' },
          ].map((s, i) => (
            <div key={i} className="card p-5 flex items-center gap-4">
              <div className={`w-10 h-10 ${s.color} rounded-xl grid place-items-center text-white flex-shrink-0`}>{s.icon}</div>
              <div>
                <div className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{s.value}</div>
                <div className="text-xs font-semibold text-navy-400 uppercase tracking-wide">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search artisans */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Trouver un artisan</h2>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-navy-400" />
              <input
                className="form-input pl-10"
                placeholder="Plombier, Électricien, Peintre…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button onClick={handleSearch} disabled={searching} className="btn btn-terra">
              {searching ? <span className="spinner" /> : <Search size={16} />}
              Rechercher
            </button>
          </div>
          {searchResults.length > 0 && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              {searchResults.map(a => {
                const name = a.entreprise || `${a.profiles?.prenom} ${a.profiles?.nom}`
                return (
                  <Link key={a.id} href={`/${a.slug}`} className="flex items-start gap-4 p-4 rounded-xl border border-cream-300 hover:border-terra-300 hover:bg-terra-50/30 no-underline transition-all group">
                    <div className="w-12 h-12 bg-navy-800 rounded-xl grid place-items-center text-white font-black text-base flex-shrink-0" style={{ fontFamily: 'var(--font-manrope)' }}>
                      {name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-navy-800 text-sm truncate">{name}</div>
                      <div className="text-xs text-terra-600 font-semibold capitalize">{a.metier}</div>
                      {a.ville && <div className="flex items-center gap-1 text-xs text-navy-400 mt-1"><MapPin size={11} />{a.ville}</div>}
                      {a.note_moyenne && (
                        <div className="flex items-center gap-1 text-xs text-navy-500 mt-1">
                          <Star size={11} className="text-yellow-400 fill-yellow-400" />
                          <span className="font-semibold">{a.note_moyenne.toFixed(1)}</span>
                          <span>({a.nb_avis} avis)</span>
                        </div>
                      )}
                    </div>
                    <ArrowRight size={16} className="text-navy-300 group-hover:text-terra-500 flex-shrink-0 mt-1 transition-colors" />
                  </Link>
                )
              })}
            </div>
          )}
          {searchResults.length === 0 && search && !searching && (
            <p className="text-sm text-navy-400 mt-4 text-center">Aucun artisan trouvé pour &ldquo;{search}&rdquo;.</p>
          )}
        </div>

        {/* Upcoming RDV */}
        {upcoming.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-300">
              <h2 className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Rendez-vous à venir</h2>
            </div>
            <div className="divide-y divide-cream-300">
              {upcoming.map(r => {
                const artisanName = r.artisans?.entreprise || `${r.artisans?.profiles?.prenom} ${r.artisans?.profiles?.nom}`
                const statusClass = STATUS_COLORS[r.statut || 'planifie']
                return (
                  <div key={r.id} className="p-5 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-cream-200 rounded-xl grid place-items-center text-navy-600 flex-shrink-0">
                        <Calendar size={18} />
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-navy-800">{r.titre || 'RDV'} · {artisanName}</div>
                        <div className="text-xs text-navy-400 mt-0.5">
                          {new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {r.heure}
                          {r.artisans?.metier && <span className="ml-2 capitalize text-terra-600">· {r.artisans.metier}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${statusClass}`}>{STATUS_LABELS[r.statut || 'planifie']}</span>
                      {r.artisans && (
                        <Link href={`/${r.artisans.slug || ''}`} className="btn btn-ghost btn-sm no-underline">Voir profil</Link>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Past interventions */}
        {past.length > 0 && (
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-300">
              <h2 className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Historique des interventions</h2>
            </div>
            <table className="w-table">
              <thead><tr><th>Artisan</th><th>Métier</th><th>Date</th><th>Avis</th></tr></thead>
              <tbody>
                {past.map(r => {
                  const artisanName = r.artisans?.entreprise || `${r.artisans?.profiles?.prenom} ${r.artisans?.profiles?.nom}`
                  return (
                    <tr key={r.id}>
                      <td className="font-semibold text-navy-800">{artisanName}</td>
                      <td className="text-navy-500 capitalize">{r.artisans?.metier || '—'}</td>
                      <td className="text-navy-400">{new Date(r.date).toLocaleDateString('fr-FR')}</td>
                      <td>
                        <button
                          onClick={() => { setShowAvis(r.artisans?.id); setAvisForm({ note: 5, commentaire: '', client_nom: `${profile?.prenom} ${profile?.nom}` }) }}
                          className="btn btn-ghost btn-sm">
                          <Star size={13} /> Laisser un avis
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        {rdvs.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔨</div>
            <h2 className="text-2xl font-black text-navy-800 mb-3" style={{ fontFamily: 'var(--font-manrope)' }}>Trouvez votre artisan idéal</h2>
            <p className="text-navy-500 mb-6">Des milliers d&apos;artisans certifiés près de chez vous</p>
            <button onClick={() => document.querySelector('input')?.focus()} className="btn btn-terra btn-lg">
              Rechercher un artisan <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Avis modal */}
      {showAvis && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowAvis(null)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl">
            <h2 className="font-bold text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Laisser un avis</h2>
            <div className="space-y-4">
              <div>
                <label className="form-label">Votre nom</label>
                <input className="form-input" value={avisForm.client_nom} onChange={e => setAvisForm(p => ({ ...p, client_nom: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Note</label>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setAvisForm(p => ({ ...p, note: n }))}
                      className={`w-10 h-10 rounded-xl border-2 text-lg transition-all ${avisForm.note >= n ? 'border-yellow-400 bg-yellow-50' : 'border-cream-300'}`}>
                      ⭐
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="form-label">Commentaire</label>
                <textarea className="form-textarea" rows={3} value={avisForm.commentaire}
                  onChange={e => setAvisForm(p => ({ ...p, commentaire: e.target.value }))}
                  placeholder="Décrivez votre expérience…" />
              </div>
              <div className="flex gap-3 pt-2">
                <button className="btn btn-ghost flex-1" onClick={() => setShowAvis(null)}>Annuler</button>
                <button disabled={submitting || !avisForm.client_nom} className="btn btn-terra flex-1" onClick={() => submitAvis(showAvis)}>
                  {submitting && <span className="spinner" />}
                  Publier l&apos;avis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
