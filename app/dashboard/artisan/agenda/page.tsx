'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Agenda, Disponibilite, HoraireDay } from '@/types'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  planifie: { bg: '#FEF9C3', text: '#854D0E' },
  confirme: { bg: '#DCFCE7', text: '#14532D' },
  annule:   { bg: '#FEE2E2', text: '#7F1D1D' },
  termine:  { bg: '#F3F4F6', text: '#374151' },
}

const STATUS_LABELS: Record<string, string> = {
  planifie: 'Planifié',
  confirme: 'Confirmé',
  annule:   'Annulé',
  termine:  'Terminé',
}

const ABSENCE_LABELS: Record<string, string> = {
  conges:         'Congés',
  vacances:       'Vacances',
  arret_maladie:  'Arrêt maladie',
  autre:          'Indisponible',
}

// JS getDay() (0=Sun) → our horaires_defaut keys
const JS_DAY_TO_KEY: Record<number, string> = {
  0: 'dim', 1: 'lun', 2: 'mar', 3: 'mer', 4: 'jeu', 5: 'ven', 6: 'sam',
}

// JOURS_SEMAINE ordered Mon–Sun (matching DAYS array)
const JOURS_SEMAINE = [
  { key: 'lun', label: 'Lun' },
  { key: 'mar', label: 'Mar' },
  { key: 'mer', label: 'Mer' },
  { key: 'jeu', label: 'Jeu' },
  { key: 'ven', label: 'Ven' },
  { key: 'sam', label: 'Sam' },
  { key: 'dim', label: 'Dim' },
]

const DEFAULT_HORAIRES: Record<string, HoraireDay> = {
  lun: { actif: true,  debut: '08:00', fin: '18:00' },
  mar: { actif: true,  debut: '08:00', fin: '18:00' },
  mer: { actif: true,  debut: '08:00', fin: '18:00' },
  jeu: { actif: true,  debut: '08:00', fin: '18:00' },
  ven: { actif: true,  debut: '08:00', fin: '18:00' },
  sam: { actif: false, debut: '09:00', fin: '12:00' },
  dim: { actif: false, debut: '09:00', fin: '12:00' },
}

// Returns array of 'YYYY-MM-DD' strings for every date in [start, end] whose
// day-of-week key is in dayFilter (or all days when dayFilter is null)
function getDatesInRange(start: string, end: string, dayFilter: string[] | null = null): string[] {
  const result: string[] = []
  if (!start || !end) return result
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const cur  = new Date(sy, sm - 1, sd)
  const last = new Date(ey, em - 1, ed)
  while (cur <= last) {
    const key = JS_DAY_TO_KEY[cur.getDay()]
    if (!dayFilter || dayFilter.includes(key)) {
      const y = cur.getFullYear()
      const m = String(cur.getMonth() + 1).padStart(2, '0')
      const d = String(cur.getDate()).padStart(2, '0')
      result.push(`${y}-${m}-${d}`)
    }
    cur.setDate(cur.getDate() + 1)
  }
  return result
}

// ─── helpers ─────────────────────────────────────────────────────────────────
function absenceLabel(type?: string) {
  return ABSENCE_LABELS[type || 'autre'] ?? 'Indisponible'
}

// ─── main component ───────────────────────────────────────────────────────────
export default function AgendaPage() {
  const [artisanId, setArtisanId]         = useState<string | null>(null)
  const [rdvs, setRdvs]                   = useState<Agenda[]>([])
  const [dispos, setDispos]               = useState<Disponibilite[]>([])
  const [clients, setClients]             = useState<{ id: string; nom: string; prenom?: string }[]>([])
  const [horairesDefaut, setHorairesDefaut] = useState<Record<string, HoraireDay>>(DEFAULT_HORAIRES)
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [deletingId, setDeletingId]       = useState<string | null>(null)
  const [currentDate, setCurrentDate]     = useState(new Date())
  const [tab, setTab]                     = useState<'rdv' | 'dispos'>('rdv')

  // — modals
  const [showRdvModal,     setShowRdvModal]     = useState(false)
  const [showDispoModal,   setShowDispoModal]   = useState(false)
  const [showAbsenceModal, setShowAbsenceModal] = useState(false)

  const todayStr = new Date().toISOString().split('T')[0]

  // — forms
  const [rdvForm, setRdvForm] = useState({
    titre: '', date: '', heure: '09:00', notes: '',
    type: 'rdv' as 'rdv' | 'chantier' | 'autre', client_id: '',
  })

  // Dispo form — date range + day-of-week selection
  const activeKeys = Object.entries(DEFAULT_HORAIRES)
    .filter(([, v]) => v.actif)
    .map(([k]) => k)
  const [dispoForm, setDispoForm] = useState<{ date_debut: string; date_fin: string; jours: string[] }>({
    date_debut: '', date_fin: '', jours: activeKeys,
  })

  // Absence form — date range + type + note
  const [absenceForm, setAbsenceForm] = useState({
    date_debut: '', date_fin: '', type_absence: 'conges' as string, note: '',
  })

  // ── load ──────────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: artisan } = await supabase
      .from('artisans').select('id, horaires_defaut').eq('profile_id', user.id).single()
    if (!artisan) { setLoading(false); return }
    setArtisanId(artisan.id)

    // Merge saved horaires with defaults
    if (artisan.horaires_defaut) {
      const merged = { ...DEFAULT_HORAIRES, ...artisan.horaires_defaut }
      setHorairesDefaut(merged)
      // Pre-populate dispo form with active days from saved horaires
      const savedActiveKeys = Object.entries(merged)
        .filter(([, v]) => v.actif)
        .map(([k]) => k)
      setDispoForm(p => ({ ...p, jours: savedActiveKeys }))
    }

    const [{ data: agendaData }, { data: dList }, { data: clientList }] = await Promise.all([
      supabase.from('agenda')
        .select('*, clients(nom, prenom, phone, email)')
        .eq('artisan_id', artisan.id)
        .order('date', { ascending: true })
        .order('heure', { ascending: true }),
      // load ALL (past + future) so the calendar renders any navigated month
      supabase.from('disponibilites')
        .select('*')
        .eq('artisan_id', artisan.id)
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
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ── RDV actions ───────────────────────────────────────────────────────────
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
      titre:     rdvForm.titre,
      date:      rdvForm.date,
      heure:     rdvForm.heure,
      notes:     rdvForm.notes || null,
      type:      rdvForm.type,
      statut:    'planifie',
      client_id: rdvForm.client_id || null,
    }).select('*, clients(nom, prenom, phone, email)').single()
    if (data) setRdvs(prev =>
      [...prev, data].sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure))
    )
    setShowRdvModal(false)
    setRdvForm({ titre: '', date: '', heure: '09:00', notes: '', type: 'rdv', client_id: '' })
    setSaving(false)
  }

  const handleDeleteRdv = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    const supabase = createClient()
    await supabase.from('agenda').delete().eq('id', id)
    setRdvs(prev => prev.filter(r => r.id !== id))
  }

  // ── Dispo actions (via service-role API to bypass RLS) ────────────────────
  const batchInsertDispos = async (rows: object[]): Promise<Disponibilite[] | null> => {
    const res = await fetch('/api/disponibilites', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(rows),
    })
    const json = await res.json()
    if (!res.ok || json.error) {
      alert('Erreur : ' + (json.error ?? res.statusText))
      return null
    }
    return Array.isArray(json) ? json : [json]
  }

  const handleAddDispo = async () => {
    if (!artisanId || !dispoForm.date_debut || !dispoForm.date_fin || dispoForm.jours.length === 0) return
    setSaving(true)

    const dates = getDatesInRange(dispoForm.date_debut, dispoForm.date_fin, dispoForm.jours)
    if (dates.length === 0) {
      alert('Aucun jour correspondant dans la plage sélectionnée.')
      setSaving(false)
      return
    }

    const rows = dates.map(date => {
      const dayKey = JS_DAY_TO_KEY[new Date(date + 'T00:00:00').getDay()]
      const h = horairesDefaut[dayKey] ?? { debut: '08:00', fin: '18:00' }
      return {
        artisan_id:  artisanId,
        date,
        heure_debut: h.debut,
        heure_fin:   h.fin,
        disponible:  true,
      }
    })

    const inserted = await batchInsertDispos(rows)
    if (inserted) {
      setDispos(prev => [...prev, ...inserted].sort((a, b) => a.date.localeCompare(b.date)))
    }
    setShowDispoModal(false)
    const savedActiveKeys = Object.entries(horairesDefaut).filter(([, v]) => v.actif).map(([k]) => k)
    setDispoForm({ date_debut: '', date_fin: '', jours: savedActiveKeys })
    setSaving(false)
  }

  const handleAddAbsence = async () => {
    if (!artisanId || !absenceForm.date_debut || !absenceForm.date_fin) return
    setSaving(true)

    const dates = getDatesInRange(absenceForm.date_debut, absenceForm.date_fin, null)
    if (dates.length === 0) {
      alert('Plage de dates invalide.')
      setSaving(false)
      return
    }

    const rows = dates.map(date => ({
      artisan_id:   artisanId,
      date,
      heure_debut:  '00:00',
      heure_fin:    '23:59',
      disponible:   false,
      type_absence: absenceForm.type_absence,
      ...(absenceForm.note ? { note: absenceForm.note } : {}),
    }))

    const inserted = await batchInsertDispos(rows)
    if (inserted) {
      setDispos(prev => [...prev, ...inserted].sort((a, b) => a.date.localeCompare(b.date)))
    }
    setShowAbsenceModal(false)
    setAbsenceForm({ date_debut: '', date_fin: '', type_absence: 'conges', note: '' })
    setSaving(false)
  }

  const handleDeleteDispo = async (id: string) => {
    setDeletingId(id)
    const res = await fetch('/api/disponibilites', {
      method: 'DELETE',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (res.ok) {
      setDispos(prev => prev.filter(d => d.id !== id))
    } else {
      const j = await res.json()
      alert('Erreur suppression : ' + (j.error ?? res.statusText))
    }
    setDeletingId(null)
  }

  // ── Calendar data ─────────────────────────────────────────────────────────
  const year  = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset      = firstDay === 0 ? 6 : firstDay - 1

  // map date → list of dispos for quick lookup
  const dispoMap = new Map<string, Disponibilite[]>()
  dispos.forEach(d => {
    const list = dispoMap.get(d.date) ?? []
    dispoMap.set(d.date, [...list, d])
  })

  const rdvByDate: Record<string, Agenda[]> = {}
  rdvs.forEach(r => {
    if (!rdvByDate[r.date]) rdvByDate[r.date] = []
    rdvByDate[r.date].push(r)
  })

  const upcoming = rdvs.filter(r => r.date >= todayStr && r.statut !== 'annule').slice(0, 10)
  const pending  = rdvs.filter(r => r.statut === 'planifie' && r.date >= todayStr)

  // split for the dispos tab
  const futureDispos = dispos.filter(d => d.disponible !== false && d.date >= todayStr)
  const allAbsences  = dispos.filter(d => d.disponible === false)

  // toggle a day-of-week in the dispo form
  const toggleJour = (key: string) => {
    setDispoForm(p => ({
      ...p,
      jours: p.jours.includes(key) ? p.jours.filter(k => k !== key) : [...p.jours, key],
    }))
  }

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--c-text-muted)' }}>Chargement…</div>

  return (
    <div>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Agenda</h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>
            {pending.length > 0 && <span style={{ color: '#854D0E', fontWeight: 700 }}>{pending.length} planifié{pending.length > 1 ? 's' : ''} · </span>}
            {upcoming.length} événement{upcoming.length !== 1 ? 's' : ''} à venir
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={() => setShowDispoModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}><path d="M12 5v14M5 12h14"/></svg>
            Disponibilité
          </button>
          <button className="btn btn-ghost" style={{ borderColor: '#fecaca', color: '#DC2626' }} onClick={() => setShowAbsenceModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}><path d="M18 6 6 18M6 6l12 12"/></svg>
            Indisponibilité
          </button>
          <button className="btn btn-primary" onClick={() => setShowRdvModal(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 15, height: 15 }}><path d="M12 5v14M5 12h14"/></svg>
            Nouveau RDV
          </button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--c-bg)', borderRadius: 'var(--r-md)', padding: 4, width: 'fit-content' }}>
        {(['rdv', 'dispos'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: '8px 20px', borderRadius: 'var(--r-sm)', border: 'none', fontSize: 13,
            fontFamily: 'var(--font-head)', fontWeight: 700, cursor: 'pointer',
            background: tab === t ? 'white' : 'transparent',
            color: tab === t ? 'var(--c-text)' : 'var(--c-text-muted)',
            boxShadow: tab === t ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
          }}>
            {t === 'rdv' ? 'Agenda' : `Disponibilités ${dispos.length > 0 ? `(${dispos.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* ── AGENDA TAB ─────────────────────────────────────────────────────── */}
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
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, marginBottom: 8 }}>
                {DAYS.map(d => (
                  <div key={d} style={{ textAlign: 'center', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 0' }}>{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
                {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day     = i + 1
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                  const slots   = dispoMap.get(dateStr) ?? []
                  const hasAbsence = slots.some(s => s.disponible === false)
                  const hasDispo   = slots.some(s => s.disponible !== false)
                  const hasRdv     = (rdvByDate[dateStr]?.length ?? 0) > 0
                  const isToday    = dateStr === todayStr

                  let cellBg = 'transparent'
                  if (isToday)         cellBg = 'var(--c-accent)'
                  else if (hasAbsence) cellBg = '#FEE2E2'
                  else if (hasDispo)   cellBg = '#DCFCE7'

                  const absenceType = slots.find(s => s.disponible === false)?.type_absence

                  return (
                    <div key={day} title={hasAbsence ? absenceLabel(absenceType) : hasDispo ? 'Disponible' : undefined}
                      style={{ aspectRatio: '1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--r-sm)', background: cellBg, border: isToday ? 'none' : '1px solid transparent', cursor: 'default', position: 'relative' }}>
                      <span style={{ fontSize: 13, fontWeight: isToday ? 700 : 500, color: isToday ? 'white' : hasAbsence ? '#991B1B' : 'var(--c-text)' }}>
                        {day}
                      </span>
                      {hasRdv && (
                        <div style={{ display: 'flex', gap: 2, marginTop: 2 }}>
                          {rdvByDate[dateStr].slice(0, 3).map((r, ri) => (
                            <div key={ri} style={{ width: 4, height: 4, borderRadius: '50%', background: r.statut === 'planifie' ? '#92400E' : r.statut === 'confirme' ? '#15803D' : '#9CA3AF' }} />
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              {/* Legend */}
              <div style={{ display: 'flex', gap: 12, marginTop: 12, padding: '8px 0', borderTop: '1px solid var(--c-border)', fontSize: 11, color: 'var(--c-text-muted)', flexWrap: 'wrap' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#DCFCE7', border: '1px solid #86efac' }} /> Disponible</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 10, height: 10, borderRadius: 2, background: '#FEE2E2', border: '1px solid #fca5a5' }} /> Absent</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#92400E' }} /> Planifié</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803D' }} /> Confirmé</span>
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
                  const colors     = STATUS_COLORS[r.statut ?? 'planifie'] ?? STATUS_COLORS.planifie
                  const clientName = (r as any).clients
                    ? `${(r as any).clients.prenom ?? ''} ${(r as any).clients.nom ?? ''}`.trim()
                    : null
                  return (
                    <div key={r.id} style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '16px 20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'var(--fs-sm)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {r.titre ?? '—'}
                          </div>
                          {clientName && <div style={{ fontSize: 12, color: 'var(--c-accent)', marginBottom: 2 }}>{clientName}</div>}
                          <div style={{ fontSize: 12, color: 'var(--c-text-muted)' }}>
                            {new Date(r.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {r.heure}
                          </div>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 'var(--r-pill)', background: colors.bg, color: colors.text, fontFamily: 'var(--font-head)', flexShrink: 0, marginLeft: 8 }}>
                          {STATUS_LABELS[r.statut ?? 'planifie']}
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
                          <button onClick={() => handleStatusChange(r.id, 'annule')} style={{ fontSize: 12, padding: '6px 12px', border: '1px solid #fecaca', borderRadius: 'var(--r-sm)', background: '#fef2f2', color: '#DC2626', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 600 }}>Annuler</button>
                        )}
                        <button onClick={() => handleDeleteRdv(r.id)} title="Supprimer" style={{ padding: '6px 10px', border: '1px solid #fecaca', borderRadius: 'var(--r-sm)', background: '#fef2f2', color: '#DC2626', cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
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

      {/* ── DISPOS TAB ─────────────────────────────────────────────────────── */}
      {tab === 'dispos' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Disponibilités section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'var(--fs-lg)', color: 'var(--c-text)' }}>
                Disponibilités <span style={{ fontSize: 13, color: '#15803D', background: '#DCFCE7', borderRadius: 'var(--r-pill)', padding: '2px 10px', marginLeft: 8, fontWeight: 700 }}>{futureDispos.length} à venir</span>
              </h2>
              <button className="btn btn-primary btn-sm" onClick={() => setShowDispoModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}><path d="M12 5v14M5 12h14"/></svg>
                Ajouter
              </button>
            </div>
            {futureDispos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-muted)', background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)' }}>
                <p style={{ marginBottom: 12 }}>Aucune disponibilité à venir</p>
                <button className="btn btn-primary btn-sm" onClick={() => setShowDispoModal(true)}>Ajouter</button>
              </div>
            ) : (
              <DispoTable rows={futureDispos} deletingId={deletingId} onDelete={handleDeleteDispo} />
            )}
          </div>

          {/* Indisponibilités / absences section */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'var(--fs-lg)', color: 'var(--c-text)' }}>
                Absences &amp; indisponibilités <span style={{ fontSize: 13, color: '#DC2626', background: '#FEE2E2', borderRadius: 'var(--r-pill)', padding: '2px 10px', marginLeft: 8, fontWeight: 700 }}>{allAbsences.length}</span>
              </h2>
              <button className="btn btn-ghost btn-sm" style={{ borderColor: '#fecaca', color: '#DC2626' }} onClick={() => setShowAbsenceModal(true)}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 13, height: 13 }}><path d="M12 5v14M5 12h14"/></svg>
                Ajouter
              </button>
            </div>
            {allAbsences.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--c-text-muted)', background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)' }}>
                <p>Aucune absence enregistrée</p>
              </div>
            ) : (
              <AbsenceTable rows={allAbsences} deletingId={deletingId} onDelete={handleDeleteDispo} />
            )}
          </div>
        </div>
      )}

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

      {/* New RDV */}
      {showRdvModal && (
        <Modal title="Nouveau RDV" onClose={() => setShowRdvModal(false)}>
          <div className="form-group">
            <label className="form-label">Titre *</label>
            <input type="text" className="form-input" placeholder="Rénovation salle de bain, Devis Dupont…"
              value={rdvForm.titre} onChange={e => setRdvForm(p => ({ ...p, titre: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Date *</label>
              <input type="date" className="form-input" value={rdvForm.date} min={todayStr}
                onChange={e => setRdvForm(p => ({ ...p, date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Heure *</label>
              <input type="time" className="form-input" value={rdvForm.heure}
                onChange={e => setRdvForm(p => ({ ...p, heure: e.target.value }))} />
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
            <textarea className="form-input" rows={3} placeholder="Détails, adresse, matériel…"
              value={rdvForm.notes} onChange={e => setRdvForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
          </div>
          <ModalFooter onCancel={() => setShowRdvModal(false)} onConfirm={handleAddRdv}
            disabled={saving || !rdvForm.date || !rdvForm.titre} saving={saving} label="Créer l'événement" />
        </Modal>
      )}

      {/* Add disponibilité — date range + day checkboxes */}
      {showDispoModal && (
        <Modal title="Ajouter des disponibilités" onClose={() => setShowDispoModal(false)}>
          <div style={{ background: '#F0FDF4', border: '1px solid #86EFAC', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, color: '#166534' }}>
            🟢 Plage où vous êtes disponible pour des interventions
          </div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Date de début *</label>
              <input type="date" className="form-input" value={dispoForm.date_debut} min={todayStr}
                onChange={e => setDispoForm(p => ({ ...p, date_debut: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Date de fin *</label>
              <input type="date" className="form-input" value={dispoForm.date_fin}
                min={dispoForm.date_debut || todayStr}
                onChange={e => setDispoForm(p => ({ ...p, date_fin: e.target.value }))} />
            </div>
          </div>

          {/* Day-of-week checkboxes */}
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: 10 }}>Jours de la semaine</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {JOURS_SEMAINE.map(({ key, label }) => {
                const checked = dispoForm.jours.includes(key)
                const h = horairesDefaut[key]
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleJour(key)}
                    title={h?.actif ? `${h.debut} — ${h.fin}` : 'Inactif dans vos horaires'}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 'var(--r-pill)',
                      border: `2px solid ${checked ? 'var(--c-accent)' : 'var(--c-border)'}`,
                      background: checked ? 'var(--c-accent)' : 'var(--c-surface)',
                      color: checked ? 'white' : 'var(--c-text-muted)',
                      fontSize: 13,
                      fontFamily: 'var(--font-head)',
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Info about default hours */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--c-bg)', borderRadius: 'var(--r-md)', fontSize: 12, color: 'var(--c-text-muted)' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
            <span>Les horaires par défaut sont définis dans vos <strong>Paramètres</strong>. Chaque jour utilisera ses heures configurées.</span>
          </div>

          {/* Preview: number of days that will be created */}
          {dispoForm.date_debut && dispoForm.date_fin && (
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {(() => {
                if (dispoForm.date_fin < dispoForm.date_debut) {
                  return <span style={{ color: '#DC2626' }}>→ La date de fin doit être après la date de début</span>
                }
                const n = getDatesInRange(dispoForm.date_debut, dispoForm.date_fin, dispoForm.jours).length
                return n > 0
                  ? <span style={{ color: '#166534' }}>→ {n} jour{n > 1 ? 's' : ''} de disponibilité seront créés</span>
                  : <span style={{ color: '#DC2626' }}>→ Aucun jour correspondant (vérifiez les jours cochés)</span>
              })()}
            </div>
          )}

          <ModalFooter
            onCancel={() => setShowDispoModal(false)}
            onConfirm={handleAddDispo}
            disabled={
              saving ||
              !dispoForm.date_debut ||
              !dispoForm.date_fin ||
              dispoForm.date_fin < dispoForm.date_debut ||
              dispoForm.jours.length === 0 ||
              getDatesInRange(dispoForm.date_debut, dispoForm.date_fin, dispoForm.jours).length === 0
            }
            saving={saving}
            label="Enregistrer"
          />
        </Modal>
      )}

      {/* Add indisponibilité — date range + type + note */}
      {showAbsenceModal && (
        <Modal title="Bloquer une période" onClose={() => setShowAbsenceModal(false)}>
          <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--r-md)', padding: '10px 14px', fontSize: 13, color: '#991B1B' }}>
            🔴 Congé, arrêt maladie ou toute période non disponible — apparaîtra en rouge sur le calendrier
          </div>

          {/* Date range */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Date de début *</label>
              <input type="date" className="form-input" value={absenceForm.date_debut}
                onChange={e => setAbsenceForm(p => ({ ...p, date_debut: e.target.value }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Date de fin *</label>
              <input type="date" className="form-input" value={absenceForm.date_fin}
                min={absenceForm.date_debut}
                onChange={e => setAbsenceForm(p => ({ ...p, date_fin: e.target.value }))} />
            </div>
          </div>

          {/* Type */}
          <div className="form-group">
            <label className="form-label">Type d&apos;absence</label>
            <select className="form-input" value={absenceForm.type_absence}
              onChange={e => setAbsenceForm(p => ({ ...p, type_absence: e.target.value }))}>
              <option value="conges">Congés</option>
              <option value="vacances">Vacances</option>
              <option value="arret_maladie">Arrêt maladie</option>
              <option value="autre">Autre / Indisponible</option>
            </select>
          </div>

          {/* Note optionnelle */}
          <div className="form-group">
            <label className="form-label">Note (optionnelle)</label>
            <textarea className="form-input" rows={2} placeholder="Précisions, motif…"
              value={absenceForm.note} onChange={e => setAbsenceForm(p => ({ ...p, note: e.target.value }))}
              style={{ resize: 'vertical' }} />
          </div>

          {/* Preview */}
          {absenceForm.date_debut && absenceForm.date_fin && (
            <div style={{ fontSize: 13, fontWeight: 600 }}>
              {(() => {
                if (absenceForm.date_fin < absenceForm.date_debut) {
                  return <span style={{ color: '#DC2626' }}>→ La date de fin doit être après la date de début</span>
                }
                const n = getDatesInRange(absenceForm.date_debut, absenceForm.date_fin, null).length
                return n > 0
                  ? <span style={{ color: '#991B1B' }}>→ {n} jour{n > 1 ? 's' : ''} seront bloqués</span>
                  : <span style={{ color: '#DC2626' }}>→ Plage invalide</span>
              })()}
            </div>
          )}

          <ModalFooter
            onCancel={() => setShowAbsenceModal(false)}
            onConfirm={handleAddAbsence}
            disabled={
              saving ||
              !absenceForm.date_debut ||
              !absenceForm.date_fin ||
              absenceForm.date_fin < absenceForm.date_debut ||
              getDatesInRange(absenceForm.date_debut, absenceForm.date_fin, null).length === 0
            }
            saving={saving}
            label="Bloquer cette période"
            danger
          />
        </Modal>
      )}
    </div>
  )
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 500 }}>
        <div style={{ padding: '22px 28px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: 'var(--fs-xl)', fontFamily: 'var(--font-head)', fontWeight: 800 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--c-text-muted)', lineHeight: 1 }}>×</button>
        </div>
        <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

function ModalFooter({ onCancel, onConfirm, disabled, saving, label, danger = false }: {
  onCancel: () => void; onConfirm: () => void; disabled: boolean; saving: boolean; label: string; danger?: boolean
}) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
      <button className="btn btn-ghost" onClick={onCancel}>Annuler</button>
      <button
        onClick={onConfirm}
        disabled={disabled}
        style={danger ? { padding: '10px 20px', background: '#DC2626', color: 'white', border: 'none', borderRadius: 'var(--r-md)', fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer', opacity: disabled ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: 8 } : undefined}
        className={danger ? undefined : 'btn btn-primary'}
      >
        {saving && <span className="waitlist-spinner" />}
        {label}
      </button>
    </div>
  )
}

function DispoTable({ rows, deletingId, onDelete }: {
  rows: Disponibilite[]; deletingId: string | null; onDelete: (id: string) => void
}) {
  return (
    <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
            {['Date', 'Horaires', 'Créneaux (1h)', ''].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => {
            const [sh, sm] = d.heure_debut.split(':').map(Number)
            const [eh, em] = d.heure_fin.split(':').map(Number)
            const slots = Math.max(0, Math.floor((eh * 60 + em - sh * 60 - sm) / 60))
            return (
              <tr key={d.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-head)', fontWeight: 600 }}>
                  {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </td>
                <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)' }}>{d.heure_debut} — {d.heure_fin}</td>
                <td style={{ padding: '14px 16px' }}>
                  <span style={{ background: '#DCFCE7', color: '#15803D', padding: '3px 10px', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)' }}>{slots} créneaux</span>
                </td>
                <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                  <TrashBtn id={d.id} deletingId={deletingId} onDelete={onDelete} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function AbsenceTable({ rows, deletingId, onDelete }: {
  rows: Disponibilite[]; deletingId: string | null; onDelete: (id: string) => void
}) {
  return (
    <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
            {['Date', 'Type', 'Note', ''].map(h => (
              <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((d, i) => (
            <tr key={d.id} style={{ borderBottom: i < rows.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
              <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-head)', fontWeight: 600 }}>
                {new Date(d.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </td>
              <td style={{ padding: '14px 16px' }}>
                <span style={{ background: '#FEE2E2', color: '#DC2626', padding: '3px 10px', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-head)' }}>
                  {ABSENCE_LABELS[d.type_absence ?? 'autre'] ?? 'Indisponible'}
                </span>
              </td>
              <td style={{ padding: '14px 16px', fontSize: 12, color: 'var(--c-text-muted)' }}>
                {d.note ?? '—'}
              </td>
              <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                <TrashBtn id={d.id} deletingId={deletingId} onDelete={onDelete} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TrashBtn({ id, deletingId, onDelete }: { id: string; deletingId: string | null; onDelete: (id: string) => void }) {
  const loading = deletingId === id
  return (
    <button
      onClick={() => onDelete(id)}
      disabled={loading}
      title="Supprimer"
      style={{ padding: '6px 10px', border: '1px solid #fecaca', borderRadius: 'var(--r-sm)', background: '#fef2f2', color: '#DC2626', cursor: loading ? 'wait' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
    >
      {loading
        ? <span className="waitlist-spinner" style={{ width: 12, height: 12 }} />
        : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
      }
    </button>
  )
}
