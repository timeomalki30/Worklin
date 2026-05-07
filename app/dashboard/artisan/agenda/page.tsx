'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Agenda, Client } from '@/types'
import { Plus, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { statusBadge } from '@/components/ui/badge'

const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']

export default function AgendaPage() {
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [events, setEvents] = useState<Agenda[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate, setCurrentDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ titre: '', client_id: '', date: '', heure: '09:00', duree: 60, type: 'rdv', statut: 'planifie', notes: '' })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: a } = await supabase.from('artisans').select('id').eq('profile_id', user.id).single()
    if (!a) return
    setArtisanId(a.id)
    const [{ data: ev }, { data: cl }] = await Promise.all([
      supabase.from('agenda').select('*, clients(nom, prenom)').eq('artisan_id', a.id).order('date').order('heure'),
      supabase.from('clients').select('id, nom, prenom').eq('artisan_id', a.id).order('nom'),
    ])
    setEvents(ev || [])
    setClients(cl || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!artisanId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('agenda').insert({ ...form, artisan_id: artisanId, client_id: form.client_id || null, duree: Number(form.duree) })
    setShowModal(false)
    setForm({ titre: '', client_id: '', date: '', heure: '09:00', duree: 60, type: 'rdv', statut: 'planifie', notes: '' })
    await loadData()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet événement ?')) return
    const supabase = createClient()
    await supabase.from('agenda').delete().eq('id', id)
    setEvents(prev => prev.filter(e => e.id !== id))
  }

  const handleStatusChange = async (id: string, statut: string) => {
    const supabase = createClient()
    await supabase.from('agenda').update({ statut }).eq('id', id)
    setEvents(prev => prev.map(e => e.id === id ? { ...e, statut: statut as any } : e))
  }

  // Calendar
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const offset = firstDay === 0 ? 6 : firstDay - 1

  const eventsByDate: Record<string, Agenda[]> = {}
  events.forEach(e => {
    if (!eventsByDate[e.date]) eventsByDate[e.date] = []
    eventsByDate[e.date].push(e)
  })

  const today = new Date().toISOString().split('T')[0]
  const upcoming = events.filter(e => e.date >= today && e.statut !== 'annule').slice(0, 8)

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8 border-navy-800" /></div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Agenda</h1>
          <p className="text-navy-400 mt-1">{upcoming.length} événements à venir</p>
        </div>
        <button className="btn btn-terra" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Nouvel événement
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300">
            <button onClick={() => setCurrentDate(new Date(year, month-1))} className="btn btn-ghost btn-sm btn-icon"><ChevronLeft size={18} /></button>
            <span className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{MONTHS[month]} {year}</span>
            <button onClick={() => setCurrentDate(new Date(year, month+1))} className="btn btn-ghost btn-sm btn-icon"><ChevronRight size={18} /></button>
          </div>
          <div className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-navy-400 uppercase py-1">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const ds = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
                const evs = eventsByDate[ds] || []
                const isToday = ds === today
                return (
                  <div key={day} className={`relative p-1 rounded-xl min-h-[52px] border transition-colors cursor-pointer hover:bg-cream-100 ${isToday ? 'bg-navy-800 border-navy-700' : 'border-transparent'}`}
                    onClick={() => { set('date', ds); setShowModal(true) }}>
                    <span className={`text-xs font-semibold ${isToday ? 'text-white' : 'text-navy-600'}`}>{day}</span>
                    {evs.slice(0, 2).map((ev, ei) => (
                      <div key={ei} className={`text-[9px] leading-tight rounded px-1 py-0.5 mt-0.5 truncate font-medium ${ev.type === 'rdv' ? 'bg-terra-100 text-terra-700' : 'bg-navy-100 text-navy-700'}`}>
                        {ev.heure} {ev.titre || (ev.clients as any)?.nom || ''}
                      </div>
                    ))}
                    {evs.length > 2 && <div className="text-[9px] text-navy-400 mt-0.5">+{evs.length - 2}</div>}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Upcoming events */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-cream-300">
            <h2 className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Prochains RDV</h2>
          </div>
          {upcoming.length === 0 ? (
            <div className="p-6 text-center text-navy-400 text-sm">
              <Clock size={28} className="mx-auto mb-2 opacity-30" />
              <p>Aucun événement à venir</p>
            </div>
          ) : (
            <div className="divide-y divide-cream-300 overflow-y-auto max-h-[500px]">
              {upcoming.map(ev => (
                <div key={ev.id} className="p-4 hover:bg-cream-50">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="font-semibold text-sm text-navy-800">{ev.titre || 'RDV'}</div>
                    <select value={ev.statut || 'planifie'} onChange={e => handleStatusChange(ev.id, e.target.value)}
                      className="text-xs border border-cream-300 rounded-lg px-1 py-0.5 bg-white outline-none text-navy-600">
                      <option value="planifie">Planifié</option>
                      <option value="confirme">Confirmé</option>
                      <option value="annule">Annulé</option>
                      <option value="termine">Terminé</option>
                    </select>
                  </div>
                  <div className="text-xs text-navy-500">
                    {new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {ev.heure}
                    {ev.duree && ` · ${ev.duree}min`}
                  </div>
                  {(ev.clients as any) && <div className="text-xs text-navy-400 mt-1">{(ev.clients as any).prenom} {(ev.clients as any).nom}</div>}
                  <button onClick={() => handleDelete(ev.id)} className="text-xs text-red-400 hover:text-red-600 mt-2">Supprimer</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40" onClick={() => setShowModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300">
              <h2 className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Nouvel événement</h2>
              <button onClick={() => setShowModal(false)} className="text-navy-400 hover:text-navy-700 text-xl leading-none">×</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="form-label">Titre</label>
                <input className="form-input" value={form.titre} onChange={e => set('titre', e.target.value)} placeholder="RDV client, Chantier Dupont…" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Date *</label>
                  <input type="date" className="form-input" value={form.date} onChange={e => set('date', e.target.value)} required />
                </div>
                <div>
                  <label className="form-label">Heure *</label>
                  <input type="time" className="form-input" value={form.heure} onChange={e => set('heure', e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Durée (min)</label>
                  <input type="number" className="form-input" value={form.duree} onChange={e => set('duree', e.target.value)} min={15} step={15} />
                </div>
                <div>
                  <label className="form-label">Type</label>
                  <select className="form-select" value={form.type} onChange={e => set('type', e.target.value)}>
                    <option value="rdv">RDV client</option>
                    <option value="chantier">Chantier</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="form-label">Client</label>
                <select className="form-select" value={form.client_id} onChange={e => set('client_id', e.target.value)}>
                  <option value="">Aucun</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" rows={2} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Informations utiles…" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" className="btn btn-ghost flex-1" onClick={() => setShowModal(false)}>Annuler</button>
                <button type="submit" disabled={saving} className="btn btn-terra flex-1">
                  {saving && <span className="spinner" />}
                  {saving ? 'Enregistrement…' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
