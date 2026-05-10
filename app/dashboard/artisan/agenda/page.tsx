'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Agenda, Disponibilite } from '@/types'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  planifie:  { bg: '#FEF9C3', text: '#854D0E' },
  confirme:  { bg: '#DCFCE7', text: '#14532D' },
  annule:    { bg: '#FEE2E2', text: '#7F1D1D' },
  termine:   { bg: '#F3F4F6', text: '#374151' },
}

const STATUS_LABELS: Record<string, string> = {
  planifie: 'Planifié',
  confirme: 'Confirmé',
  annule:   'Annulé',
  termine:  'Terminé',
}

export default function AgendaPage() {
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [rdvs, setRdvs] = useState<Agenda[]>([])
  const [dispos, setDispos] = useState<Disponibilite[]>([])
  const [clients, setClients] = useState<{ id: string; nom: string; prenom?: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showDispoModal, setShowDispoModal] = useState(false)
  const [showRdvModal, setShowRdvModal] = useState(false)
  const [dispoForm, setDispoForm] = useState({ date: '', heure_debut: '08:00', heure_fin: '18:00' })
  const [rdvForm, setRdvForm] = useState({
    titre: '', date: '', heure: '09:00', notes: '',
    type: 'rdv' as 'rdv' | 'chantier' | 'autre', client_id: '',
  })
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<'rdv' | 'dispos'>('rdv')

  const today = new Date().toISOString().split('T')[0]

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: artisan } = await supabase.from('artisans').select('id').eq('profile_id', user.id).single()
    if (artisan) {
      setArtisanId(artisan.id)
      const [{ data: agendaData }, { data: dList }, { data: clientList }] = await Promise.all([
        supabase.from('agenda')
          .select('*, clients(nom, prenom, phone, email)')
          .eq('artisan_id', artisan.id)
          .order('date', { ascending: true })
          .order('heure', { ascending: true }),
        supabase.from('disponibilites')
          .select('*')
          .eq('artisan_id', artisan.id)
          .gte('date', today)
          .order('date')
          .order('heure_debut'),
        supabase.from('clients')
          .select('id, nom, prenom')
          .eq('artisan_id', artisan.id)
          .order('nom'),
      ])
      setRdvs(agendaData || [])
      setDispos(dList || [])
      setClients(clientList || [])
    }
    setLoading(false)
  }, [today])

  useEffect(() => { loadData() }, [loadData])

  const handleStatusChange = async (id: string, statut: string) => {
    const supabase = createClient()
    await supabase.from('agenda').update({ statut }).eq('id', id)
    setRdvs(prev => prev.map(r => r.id === id ? { ...r, statut: statut as any } : r))
  }

  const handleAddRdv = async () => {
    if (!artisanId || !rdvForm.date || !rdvForm.titre) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase.from('agenda').insert({
      artisan_id: artisanId,
      titre: rdvForm.titre,
      date: rdvForm.date,
      heure: rdvForm.heure,
      notes: rdvForm.notes || null,
      type: rdvForm.type,
      statut: 'planifie',
      client_id: rdvForm.client_id || null,
    }).select('*, clients(nom, prenom, phone, email)').single()
    if (data) setRdvs(prev => [...prev, data].sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure)))
    setShowRdvModal(false)
    setRdvForm({ titre: '', date: '', heure: '09:00', notes: '', type: 'rdv', client_id: '' })
    setSaving(false)
  }

  const handleAddDispo = async () => {
    if (!artisanId || !dispoForm.date) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('disponibilites').insert({
      artisan_id: artisanId,
      date: dispoForm.date,
      heure_debut: dispoForm.heure_debut,
      heure_fin: dispoForm.heure_fin,
      disponible: true,
    })
    setShowDispoModal(false)
    setDispoForm({ date: '', heure_debut: '08:00', heure_fin: '18:00' })
    await loadData()
    setSaving(false)
  }

  const handleDeleteDispo = async (id: string) => {
    const supabase = createClient()
    await supabase.from('disponibilites').delete().eq('id', id)
    setDispos(prev => prev.filter(d => d.id !== id))
  }

  const handleDeleteRdv = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    const supabase = createClient()
    await supabase.from('agenda').delete().eq('id', id)
    setRdvs(prev => prev.filter(r => r.id !== id))
  }

  // Calendar grid
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1

  const rdvByDate: Record<string, Agenda[]> = {}
  rdvs.forEach(r => {
    if (!rdvByDate[r.date]) rdvByDate[r.date] = []
    rdvByDate[r.date].push(r)
  })
  const dispoByDate = new Set(dispos.map(d => d.date))

  const upcoming = rdvs.filter(r => r.date >= today && r.statut !== 'annule').slice(0, 10)
  const pending = rdvs.filter(r => r.statut === 'planifie' && r.date >= today)

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--c-text-muted)' }}>Chargement…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Agenda</h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
            {pending.length > 0 && <span style={{ color: '#854D0E', fontWeight: 700 }}>{pending.length} planifié{pending.length > 1 ? 's' : ''} · </span>}
            {upcoming.length} événement{upcoming.length !== 1 ? 's' : ''} à venir
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => setShowDispoModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
            Disponibilité
          </button>
          <button className="btn btn-primary" onClick={() => setShowRdvModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
            Nouveau RDV
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--c-bg)', borderRadius: 'var(--r-md)', padding: 4, width: 'fit-content' }}>
        {(['rdv', 'dispos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '8px 20px', borderRadius: 'var(--r-sm)', border: 'none', fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 700, cursor: 'pointer', background: tab === t ? 'white' : 'transparent', color: tab === t ? 'var(--c-text)' : 'var(--c-text-muted)', boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {t === 'rdv' ? 'Agenda' : 'Disponibilités'}
          </button>
        ))}
      </div>

      {tab === 'rdv' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 24, alignItems: 'start' }}>
          {/* Calendar */}
          <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--c-border)' }}>
              <button onClick={() => setCurrentDate(new Date(year, month - 1))} style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>‹</button>
              <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'var(--fs-lg)' }}>{MONTHS[month]} {year}</span>
              <button onClick={() => setCurrentDate(new Date(year, month + 1))} style={{ background: 'none', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', padding: '6px 12px', cursor: 'pointer', fontSize: 16 }}>›</button>
            </div>
            <div style={{ padding: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0' }}>{d}</div>)}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const hasRdv = rdvByDate[dateStr]?.length > 0
                  const hasDispo = dispoByDate.has(dateStr)
                  const isToday = dateStr === today
                  return (
                    <div key={day} style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', position: 'relative', background: isToday ? 'var(--c-accent)' : hasDispo ? 'var(--c-success-soft)' : 'transparent', border: isToday ? 'none' : '1px solid transparent' }}>
                      <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? 'white' : 'var(--c-text)' }}>{day}</span>
                      {hasRdv && (
                        <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                          {rdvByDate[dateStr].slice(0, 3).map((r, ri) => (
                            <div key={ri} style={{ width: 4, height: 4, borderRadius: '50%', background: r.statut === 'planifie' ? '#854D0E' : r.statut === 'confirme' ? '#16A34A' : 'var(--c-text-muted)' }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 12, padding: '8px 0', borderTop: '1px solid var(--c-border)', fontSize: 11, color: 'var(--c-text-muted)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#854D0E' }} /> Planifié</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: '50%', background: '#16A34A' }} /> Confirmé</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: 'var(--c-success-soft)', border: '1px solid #86efac' }} /> Dispo</span>
              </div>
            </div>
          </div>

          {/* RDV list */}
          <div>
            {upcoming.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 32, color: 'var(--c-text-muted)', background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 40, height: 40, margin: '0 auto 12px', opacity: 0.4 }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
                <p style={{ fontSize: 'var(--fs-sm)', marginBottom: 12 }}>Aucun événement à venir</p>
                <button className="btn btn-primary" style={{ fontSize: 13 }} onClick={() => setShowRdvModal(true)}>Créer un RDV</button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {upcoming.map(r => {
                  const colors = STATUS_COLORS[r.statut || 'planifie'] || STATUS_COLORS.planifie
                  const clientName = (r as any).clients
                    ? `${(r as any).clients.prenom || ''} ${(r as any).clients.nom || ''}`.trim()
                    : null
                  return (
                    <div key={r.id} style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'var(--fs-sm)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.titre || '—'}
                          </div>
                          {clientName && <div style={{ fontSize: 12, color: 'var(--c-accent)', marginBottom: 2 }}>{clientName}</div>}
                          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                            {new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {r.heure}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: colors.bg, color: colors.text, fontFamily: 'var(--font-head)', flexShrink: 0, marginLeft: 8 }}>
                          {STATUS_LABELS[r.statut || 'planifie']}
                        </span>
                      </div>
                      {r.notes && <p style={{ fontSize: 12, color: 'var(--c-text-muted)', lineHeight: 1.5, marginBottom: 10 }}>{r.notes}</p>}
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {r.statut === 'planifie' && (
                          <button onClick={() => handleStatusChange(r.id, 'confirme')} className="btn btn-primary" style={{ fontSize: 12, padding: '6px 14px', flex: 1 }}>Confirmer</button>
                        )}
                        {r.statut === 'confirme' && (
                          <button onClick={() => handleStatusChange(r.id, 'termine')} style={{ fontSize: 12, padding: '6px 14px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', background: 'var(--c-surface)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 600, flex: 1 }}>
                            Marquer terminé
                          </button>
                        )}
                        {r.statut !== 'annule' && r.statut !== 'termine' && (
                          <button onClick={() => handleStatusChange(r.id, 'annule')} style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #fecaca', borderRadius: 'var(--r-sm)', background: '#fef2f2', color: '#DC2626', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 600 }}>Annuler</button>
                        )}
                        <button onClick={() => handleDeleteRdv(r.id)} title="Supprimer" style={{ fontSize: 12, padding: '6px 10px', border: '1px solid #fecaca', borderRadius: 'var(--r-sm)', background: '#fef2f2', color: '#DC2626', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6"/></svg>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'dispos' && (
        <div>
          {dispos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--c-text-muted)' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.4 }}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg>
              <p>Aucune disponibilité configurée</p>
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowDispoModal(true)}>Ajouter mes premières disponibilités</button>
            </div>
          ) : (
            <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
                    {['Date', 'Horaires', 'Créneaux (1h)', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dispos.map((d, i) => {
                    const [sh, sm] = d.heure_debut.split(':').map(Number)
                    const [eh, em] = d.heure_fin.split(':').map(Number)
                    const slots = Math.floor((eh * 60 + em - sh * 60 - sm) / 60)
                    return (
                      <tr key={d.id} style={{ borderBottom: i < dispos.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                        <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-head)', fontWeight: 600 }}>
                          {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                        </td>
                        <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)' }}>{d.heure_debut} — {d.heure_fin}</td>
                        <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)' }}>
                          <span style={{ background: 'var(--c-success-soft)', color: '#14532D', padding: '3px 10px', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{slots} créneaux</span>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <button onClick={() => handleDeleteDispo(d.id)} style={{ fontSize: 12, padding: '6px 12px', border: '1px solid #fecaca', borderRadius: 'var(--r-sm)', background: '#fef2f2', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 600, color: '#DC2626' }}>
                            Supprimer
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* New RDV Modal */}
      {showRdvModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 480 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontFamily: 'var(--font-head)', fontWeight: 800 }}>Nouveau RDV</h2>
              <button onClick={() => setShowRdvModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--c-text-muted)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Titre *</label>
                <input type="text" className="form-input" placeholder="Rénovation salle de bain, Devis Dupont…" value={rdvForm.titre} onChange={e => setRdvForm(p => ({ ...p, titre: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={rdvForm.date} min={today} onChange={e => setRdvForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Heure *</label>
                  <input type="time" className="form-input" value={rdvForm.heure} onChange={e => setRdvForm(p => ({ ...p, heure: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-input" value={rdvForm.type} onChange={e => setRdvForm(p => ({ ...p, type: e.target.value as any }))}>
                    <option value="rdv">RDV client</option>
                    <option value="chantier">Chantier</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Client (optionnel)</label>
                  <select className="form-input" value={rdvForm.client_id} onChange={e => setRdvForm(p => ({ ...p, client_id: e.target.value }))}>
                    <option value="">— Aucun —</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} placeholder="Détails, adresse, matériel nécessaire…" value={rdvForm.notes} onChange={e => setRdvForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowRdvModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleAddRdv} disabled={saving || !rdvForm.date || !rdvForm.titre}>
                  {saving ? <span className="waitlist-spinner" /> : null}
                  Créer l&apos;événement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dispo Modal */}
      {showDispoModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 440 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontFamily: 'var(--font-head)', fontWeight: 800 }}>Nouvelle disponibilité</h2>
              <button onClick={() => setShowDispoModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--c-text-muted)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Date</label>
                <input type="date" className="form-input" value={dispoForm.date} min={today} onChange={e => setDispoForm(p => ({ ...p, date: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Heure de début</label>
                  <input type="time" className="form-input" value={dispoForm.heure_debut} onChange={e => setDispoForm(p => ({ ...p, heure_debut: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Heure de fin</label>
                  <input type="time" className="form-input" value={dispoForm.heure_fin} onChange={e => setDispoForm(p => ({ ...p, heure_fin: e.target.value }))} />
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                Des créneaux d&apos;1 heure seront automatiquement générés entre {dispoForm.heure_debut} et {dispoForm.heure_fin}.
              </p>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => setShowDispoModal(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleAddDispo} disabled={saving || !dispoForm.date}>
                  {saving ? <span className="waitlist-spinner" /> : null}
                  Ajouter la disponibilité
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
