'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { ClientArtisan } from '@/types'

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientArtisan[]>([])
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [editClient, setEditClient] = useState<ClientArtisan | null>(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  const emptyForm = { prenom: '', nom: '', email: '', phone: '', adresse: '', notes: '' }
  const [form, setForm] = useState(emptyForm)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: artisan } = await supabase.from('artisans').select('id').eq('profile_id', user.id).single()
    if (artisan) {
      setArtisanId(artisan.id)
      const { data } = await supabase.from('clients').select('*').eq('artisan_id', artisan.id).order('nom')
      setClients(data || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const openEdit = (c: ClientArtisan) => {
    setEditClient(c)
    setForm({ prenom: c.prenom || '', nom: c.nom || '', email: c.email || '', phone: c.phone || '', adresse: c.adresse || '', notes: c.notes || '' })
  }

  const handleSave = async () => {
    if (!artisanId) return
    setSaving(true)
    const supabase = createClient()
    if (editClient) {
      await supabase.from('clients').update(form).eq('id', editClient.id)
    } else {
      await supabase.from('clients').insert({ ...form, artisan_id: artisanId })
    }
    setShowCreate(false)
    setEditClient(null)
    setForm(emptyForm)
    await loadData()
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce client ?')) return
    const supabase = createClient()
    await supabase.from('clients').delete().eq('id', id)
    setClients(prev => prev.filter(c => c.id !== id))
  }

  const filtered = clients.filter(c =>
    `${c.prenom} ${c.nom} ${c.email} ${c.phone}`.toLowerCase().includes(search.toLowerCase())
  )

  const initials = (c: ClientArtisan) => `${c.prenom?.[0] || ''}${c.nom?.[0] || ''}`.toUpperCase() || '?'

  const isFormOpen = showCreate || !!editClient

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--c-text-muted)' }}>Chargement…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Clients</h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>{clients.length} clients au total</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setShowCreate(true) }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
          Nouveau client
        </button>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div style={{ position: 'relative', marginBottom: 24, maxWidth: 400 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: 'var(--c-text-muted)' }}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Rechercher un client…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', fontSize: 'var(--fs-sm)', background: 'var(--c-surface)', outline: 'none' }}
          />
        </div>
      )}

      {clients.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--c-text-muted)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.4 }}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
          <p>Aucun client pour l&apos;instant</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>Ajouter mon premier client</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--c-accent)', color: 'white', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 16, flexShrink: 0 }}>
                  {initials(c)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'var(--fs-md)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {c.prenom} {c.nom}
                  </div>
                  {c.email && <div style={{ fontSize: 12, color: 'var(--c-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.email}</div>}
                </div>
              </div>
              {c.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--c-text-muted)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, flexShrink: 0 }}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6 6l.92-.92a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  {c.phone}
                </div>
              )}
              {c.adresse && (
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--c-text-muted)' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14, flexShrink: 0, marginTop: 1 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <span style={{ lineHeight: 1.4 }}>{c.adresse}</span>
                </div>
              )}
              {c.notes && (
                <div style={{ fontSize: 12, color: 'var(--c-text-muted)', background: 'var(--c-bg)', borderRadius: 'var(--r-sm)', padding: '8px 10px', lineHeight: 1.4 }}>{c.notes}</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 4, borderTop: '1px solid var(--c-border)', paddingTop: 12 }}>
                <button onClick={() => openEdit(c)} style={{ flex: 1, padding: '8px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', background: 'var(--c-surface)', fontSize: 12, fontFamily: 'var(--font-head)', fontWeight: 600, cursor: 'pointer' }}>
                  Modifier
                </button>
                <button onClick={() => handleDelete(c.id)} style={{ padding: '8px 12px', border: '1px solid #fecaca', borderRadius: 'var(--r-sm)', background: '#fef2f2', fontSize: 12, fontFamily: 'var(--font-head)', fontWeight: 600, cursor: 'pointer', color: '#DC2626' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isFormOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'white', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 500 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontFamily: 'var(--font-head)', fontWeight: 800 }}>{editClient ? 'Modifier le client' : 'Nouveau client'}</h2>
              <button onClick={() => { setShowCreate(false); setEditClient(null) }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--c-text-muted)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input className="form-input" value={form.prenom} onChange={e => setForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Jean" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input className="form-input" value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Dupont" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="jean.dupont@email.fr" />
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input type="tel" className="form-input" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="06 00 00 00 00" />
              </div>
              <div className="form-group">
                <label className="form-label">Adresse</label>
                <input className="form-input" value={form.adresse} onChange={e => setForm(p => ({ ...p, adresse: e.target.value }))} placeholder="12 rue de la Paix, 75001 Paris" />
              </div>
              <div className="form-group">
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} placeholder="Préférences, historique, remarques…" style={{ resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', paddingTop: 8 }}>
                <button className="btn btn-ghost" onClick={() => { setShowCreate(false); setEditClient(null) }}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.nom}>
                  {saving ? <span className="waitlist-spinner"></span> : null}
                  {editClient ? 'Enregistrer' : 'Ajouter le client'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
