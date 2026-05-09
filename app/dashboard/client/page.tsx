'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Profile } from '@/types'

const STATUS_LABELS: Record<string, string> = {
  en_attente: 'En attente',
  confirmee: 'Confirmée',
  annulee: 'Annulée',
  terminee: 'Terminée',
}
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  en_attente: { bg: '#FEF9C3', text: '#854D0E' },
  confirmee: { bg: '#DCFCE7', text: '#14532D' },
  annulee: { bg: '#FEE2E2', text: '#7F1D1D' },
  terminee: { bg: '#F3F4F6', text: '#374151' },
}

export default function ClientDashboardPage() {
  const router = useRouter()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [reservations, setReservations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAvisModal, setShowAvisModal] = useState(false)
  const [selectedRdv, setSelectedRdv] = useState<any>(null)
  const [avisForm, setAvisForm] = useState({ note: 5, commentaire: '' })
  const [submittingAvis, setSubmittingAvis] = useState(false)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: p } = await supabase.from('profiles').select('*').eq('id', user.id).single()
      setProfile(p)

      const { data: rdvs } = await supabase
        .from('reservations')
        .select('*, artisans(id, metier, entreprise, profiles(nom, prenom))')
        .eq('client_id', user.id)
        .order('date', { ascending: false })
        .order('heure', { ascending: false })
      setReservations(rdvs || [])
      setLoading(false)
    }
    load()
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  const openAvisModal = (rdv: any) => {
    setSelectedRdv(rdv)
    setAvisForm({ note: 5, commentaire: '' })
    setShowAvisModal(true)
  }

  const submitAvis = async () => {
    if (!selectedRdv || !profile) return
    setSubmittingAvis(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('avis').insert({
      artisan_id: selectedRdv.artisan_id,
      client_id: user?.id,
      note: avisForm.note,
      commentaire: avisForm.commentaire,
      reservation_id: selectedRdv.id,
    })

    const { data: avisData } = await supabase.from('avis').select('note').eq('artisan_id', selectedRdv.artisan_id)
    if (avisData && avisData.length > 0) {
      const avg = avisData.reduce((s, a) => s + a.note, 0) / avisData.length
      await supabase.from('artisans').update({ note_moyenne: avg, nb_avis: avisData.length }).eq('id', selectedRdv.artisan_id)
    }

    setShowAvisModal(false)
    setSubmittingAvis(false)
  }

  const upcoming = reservations.filter(r => r.date >= new Date().toISOString().split('T')[0] && r.statut !== 'annulee')
  const past = reservations.filter(r => r.date < new Date().toISOString().split('T')[0] || r.statut === 'terminee')

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement…</div>

  return (
    <div style={{ minHeight: '100vh', background: 'var(--c-bg)' }}>
      {/* Nav */}
      <nav style={{ background: 'var(--c-text)', padding: '0 48px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'var(--fs-lg)', color: 'white', letterSpacing: '-0.025em', textDecoration: 'none' }}>
          Worklin <span style={{ color: 'var(--c-accent)', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginLeft: 4 }}>client</span>
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--fs-sm)' }}>{profile?.prenom} {profile?.nom}</span>
          <button onClick={handleLogout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'rgba(255,255,255,0.8)', padding: '8px 16px', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 600 }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="container" style={{ paddingTop: 48, paddingBottom: 96 }}>
        <div style={{ marginBottom: 40 }}>
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 8 }}>
            Bonjour, {profile?.prenom} 👋
          </h1>
          <p style={{ color: 'var(--c-text-muted)' }}>
            {upcoming.length > 0 ? `Vous avez ${upcoming.length} RDV à venir.` : 'Vous n\'avez pas de RDV à venir.'}
            {' '}
            <Link href="/recherche" style={{ color: 'var(--c-accent)', fontWeight: 600 }}>Trouver un artisan →</Link>
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 48 }}>
          {[
            { label: 'RDV à venir', value: upcoming.length, icon: '📅' },
            { label: 'Interventions terminées', value: past.filter(r => r.statut === 'terminee').length, icon: '✅' },
            { label: 'Avis laissés', value: 0, icon: '⭐' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '20px 24px' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 'var(--fs-2xl)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 4 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontFamily: 'var(--font-head)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Upcoming RDV */}
        {upcoming.length > 0 && (
          <section style={{ marginBottom: 48 }}>
            <h2 style={{ fontSize: 'var(--fs-xl)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 20 }}>RDV à venir</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {upcoming.map(r => {
                const colors = STATUS_COLORS[r.statut]
                const artisanName = r.artisans?.entreprise || `${r.artisans?.profiles?.prenom} ${r.artisans?.profiles?.nom}`
                return (
                  <div key={r.id} style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'var(--fs-md)', marginBottom: 4 }}>{artisanName}</div>
                      <div style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)', marginBottom: r.description_travaux ? 6 : 0 }}>
                        <span style={{ textTransform: 'capitalize' }}>{r.artisans?.metier}</span> ·{' '}
                        {new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {r.heure}
                      </div>
                      {r.description_travaux && <p style={{ fontSize: 12, color: 'var(--c-text-muted)', lineHeight: 1.4 }}>{r.description_travaux}</p>}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
                      <Link href={`/artisan/${r.artisan_id}`} style={{ fontSize: 12, padding: '6px 14px', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-border)', background: 'var(--c-surface)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 600, textDecoration: 'none', color: 'var(--c-text)' }}>
                        Voir le profil
                      </Link>
                      <span style={{ fontSize: 11, fontWeight: 700, padding: '5px 12px', borderRadius: 'var(--r-pill)', background: colors.bg, color: colors.text, fontFamily: 'var(--font-head)', whiteSpace: 'nowrap' }}>
                        {STATUS_LABELS[r.statut]}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Past RDV */}
        {past.length > 0 && (
          <section>
            <h2 style={{ fontSize: 'var(--fs-xl)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 20 }}>Historique</h2>
            <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
                    {['Artisan', 'Métier', 'Date', 'Statut', 'Avis'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {past.map((r, i) => {
                    const colors = STATUS_COLORS[r.statut]
                    const artisanName = r.artisans?.entreprise || `${r.artisans?.profiles?.prenom} ${r.artisans?.profiles?.nom}`
                    return (
                      <tr key={r.id} style={{ borderBottom: i < past.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                        <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-head)', fontWeight: 600 }}>{artisanName}</td>
                        <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)', textTransform: 'capitalize' }}>{r.artisans?.metier}</td>
                        <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)' }}>
                          {new Date(r.date).toLocaleDateString('fr-FR')} {r.heure && `à ${r.heure}`}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: colors.bg, color: colors.text, fontFamily: 'var(--font-head)' }}>
                            {STATUS_LABELS[r.statut]}
                          </span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {r.statut === 'terminee' && (
                            <button onClick={() => openAvisModal(r)} style={{ fontSize: 12, padding: '6px 12px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', background: 'var(--c-surface)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 600 }}>
                              Laisser un avis
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {reservations.length === 0 && (
          <div style={{ textAlign: 'center', padding: '96px 0' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🔨</div>
            <h2 style={{ fontSize: 'var(--fs-2xl)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 12 }}>Aucune réservation pour l&apos;instant</h2>
            <p style={{ color: 'var(--c-text-muted)', marginBottom: 24 }}>Trouvez un artisan de confiance près de chez vous</p>
            <Link href="/recherche" className="btn btn-primary btn-lg">
              Trouver un artisan
              <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
          </div>
        )}
      </div>

      {/* Avis Modal */}
      {showAvisModal && selectedRdv && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 460 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontFamily: 'var(--font-head)', fontWeight: 800 }}>Laisser un avis</h2>
              <button onClick={() => setShowAvisModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--c-text-muted)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div>
                <label className="form-label" style={{ marginBottom: 10, display: 'block' }}>Note</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setAvisForm(p => ({ ...p, note: n }))}
                      style={{ width: 44, height: 44, borderRadius: 'var(--r-md)', border: `2px solid ${avisForm.note >= n ? 'var(--c-warning)' : 'var(--c-border)'}`, background: avisForm.note >= n ? '#FEF9C3' : 'transparent', cursor: 'pointer', fontSize: 20 }}>
                      ⭐
                    </button>
                  ))}
                  <span style={{ alignSelf: 'center', fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-head)', fontWeight: 800, marginLeft: 8 }}>{avisForm.note}/5</span>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Commentaire</label>
                <textarea className="form-input" rows={4} value={avisForm.commentaire} onChange={e => setAvisForm(p => ({ ...p, commentaire: e.target.value }))} placeholder="Décrivez votre expérience avec cet artisan…" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowAvisModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={submitAvis} disabled={submittingAvis}>
                  {submittingAvis ? <span className="waitlist-spinner"></span> : null}
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
