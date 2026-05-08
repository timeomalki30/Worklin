'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'
import type { Client } from '@/types'

type ClientStats = { ca: number; nb_devis: number; nb_chantiers: number }

// ─── Types ────────────────────────────────────────────────────────────────────
type ClientForm = {
  nom: string
  prenom: string
  email: string
  phone: string
  adresse: string
  type: 'particulier' | 'pro' | ''
  notes: string
}

const EMPTY_FORM: ClientForm = {
  nom: '',
  prenom: '',
  email: '',
  phone: '',
  adresse: '',
  type: '',
  notes: '',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function initials(nom: string, prenom?: string) {
  const a = (prenom || '').trim().charAt(0).toUpperCase()
  const b = nom.trim().charAt(0).toUpperCase()
  return `${a}${b}` || '?'
}

function TypeBadge({ type }: { type?: string }) {
  if (!type) return null
  if (type === 'pro') return <span className="badge badge-blue">Pro</span>
  return <span className="badge badge-gray">Particulier</span>
}

// ─── Empty state SVG ──────────────────────────────────────────────────────────
function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className="mb-6 opacity-40">
        <circle cx="48" cy="48" r="48" fill="#E8E4DC" />
        <circle cx="48" cy="38" r="14" fill="#8B8074" />
        <path d="M18 80c0-16.569 13.431-30 30-30s30 13.431 30 30" fill="#8B8074" />
      </svg>
      <p className="text-navy-500 font-semibold text-lg mb-1">Aucun client pour l&apos;instant</p>
      <p className="text-navy-400 text-sm mb-6">Ajoutez votre premier client pour commencer à gérer votre CRM.</p>
      <button onClick={onNew} className="btn btn-primary">
        + Nouveau client
      </button>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ClientsPage() {
  const router = useRouter()
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [clientStats, setClientStats] = useState<Record<string, ClientStats>>({})
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientForm>(EMPTY_FORM)

  const firstInputRef = useRef<HTMLInputElement>(null)

  // ── Load ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { data: artisan } = await supabase
        .from('artisans')
        .select('id')
        .eq('profile_id', user.id)
        .single()

      if (!artisan) { setLoading(false); return }
      setArtisanId(artisan.id)

      const [{ data, error: err }, { data: devisData }, { data: chantiersData }] = await Promise.all([
        supabase.from('clients').select('*').eq('artisan_id', artisan.id).order('created_at', { ascending: false }),
        supabase.from('devis').select('client_id, total_ttc, statut').eq('artisan_id', artisan.id),
        supabase.from('chantiers').select('client_id').eq('artisan_id', artisan.id),
      ])

      if (err) setError(err.message)
      else setClients(data || [])

      // Build per-client stats
      const stats: Record<string, ClientStats> = {}
      ;(devisData || []).forEach((d: any) => {
        if (!d.client_id) return
        if (!stats[d.client_id]) stats[d.client_id] = { ca: 0, nb_devis: 0, nb_chantiers: 0 }
        stats[d.client_id].nb_devis++
        if (d.statut === 'accepte') stats[d.client_id].ca += d.total_ttc || 0
      })
      ;(chantiersData || []).forEach((c: any) => {
        if (!c.client_id) return
        if (!stats[c.client_id]) stats[c.client_id] = { ca: 0, nb_devis: 0, nb_chantiers: 0 }
        stats[c.client_id].nb_chantiers++
      })
      setClientStats(stats)
      setLoading(false)
    }
    load()
  }, [router])

  // Focus first input when modal opens
  useEffect(() => {
    if (modalOpen) {
      setTimeout(() => firstInputRef.current?.focus(), 50)
    }
  }, [modalOpen])

  // ── Filtering ─────────────────────────────────────────────────────────────
  const filtered = clients.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.nom.toLowerCase().includes(q) ||
      (c.prenom || '').toLowerCase().includes(q) ||
      (c.email || '').toLowerCase().includes(q) ||
      (c.phone || '').toLowerCase().includes(q)
    )
  })

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openCreate() {
    setEditingClient(null)
    setForm(EMPTY_FORM)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(client: Client) {
    setEditingClient(client)
    setForm({
      nom: client.nom,
      prenom: client.prenom || '',
      email: client.email || '',
      phone: client.phone || '',
      adresse: client.adresse || '',
      type: client.type || '',
      notes: client.notes || '',
    })
    setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingClient(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  function setField<K extends keyof ClientForm>(k: K, v: ClientForm[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nom.trim()) { setError('Le nom est obligatoire.'); return }
    if (!artisanId) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      artisan_id: artisanId,
      nom: form.nom.trim(),
      prenom: form.prenom.trim() || null,
      email: form.email.trim() || null,
      phone: form.phone.trim() || null,
      adresse: form.adresse.trim() || null,
      type: form.type || null,
      notes: form.notes.trim() || null,
    }

    if (editingClient) {
      const { error: err } = await supabase
        .from('clients')
        .update(payload)
        .eq('id', editingClient.id)

      if (err) { setError(err.message); setSaving(false); return }
      setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...payload } : c))
    } else {
      const { data, error: err } = await supabase
        .from('clients')
        .insert(payload)
        .select()
        .single()

      if (err) { setError(err.message); setSaving(false); return }
      setClients(prev => [data, ...prev])
    }

    setSaving(false)
    closeModal()
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(client: Client) {
    if (!confirm(`Supprimer le client "${client.prenom ? client.prenom + ' ' : ''}${client.nom}" ? Cette action est irréversible.`)) return
    const supabase = createClient()
    const { error: err } = await supabase.from('clients').delete().eq('id', client.id)
    if (err) { alert('Erreur : ' + err.message); return }
    setClients(prev => prev.filter(c => c.id !== client.id))
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8 border-navy-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            Clients
          </h1>
          <p className="text-navy-400 mt-1 text-sm">
            {clients.length} client{clients.length !== 1 ? 's' : ''} au total
          </p>
        </div>
        <button onClick={openCreate} className="btn btn-primary self-start sm:self-auto">
          + Nouveau client
        </button>
      </div>

      {/* Search */}
      {clients.length > 0 && (
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom, email, téléphone…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="form-input pl-9"
          />
        </div>
      )}

      {/* Grid or empty */}
      {clients.length === 0 ? (
        <EmptyState onNew={openCreate} />
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-navy-400">
          <p className="text-lg font-semibold">Aucun résultat pour &ldquo;{search}&rdquo;</p>
          <button onClick={() => setSearch('')} className="btn btn-ghost btn-sm mt-4">Effacer la recherche</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map(client => (
            <ClientCard
              key={client.id}
              client={client}
              stats={clientStats[client.id]}
              onEdit={() => openEdit(client)}
              onDelete={() => handleDelete(client)}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <ClientModal
          form={form}
          setField={setField}
          editing={!!editingClient}
          saving={saving}
          error={error}
          firstInputRef={firstInputRef}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </div>
  )
}

// ─── Client Card ──────────────────────────────────────────────────────────────
function ClientCard({
  client,
  stats,
  onEdit,
  onDelete,
}: {
  client: Client
  stats?: ClientStats
  onEdit: () => void
  onDelete: () => void
}) {
  const fullName = [client.prenom, client.nom].filter(Boolean).join(' ')

  return (
    <div className="card flex flex-col h-full">
      {/* Top */}
      <div className="p-5 flex items-start gap-4 flex-1">
        {/* Avatar */}
        <div
          className="w-12 h-12 rounded-full flex-shrink-0 grid place-items-center text-white font-bold text-lg"
          style={{ background: 'var(--color-terra-500, #C0614A)' }}
        >
          {initials(client.nom, client.prenom)}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-navy-800 truncate">{fullName}</span>
            <TypeBadge type={client.type} />
          </div>

          {client.email && (
            <p className="text-sm text-navy-500 truncate flex items-center gap-1.5">
              <MailIcon />
              <span className="truncate">{client.email}</span>
            </p>
          )}
          {client.phone && (
            <p className="text-sm text-navy-500 flex items-center gap-1.5">
              <PhoneIcon />
              {client.phone}
            </p>
          )}
          {client.adresse && (
            <p className="text-sm text-navy-400 truncate flex items-center gap-1.5">
              <PinIcon />
              <span className="truncate">{client.adresse}</span>
            </p>
          )}
          {client.notes && (
            <p className="text-xs text-navy-400 mt-1 line-clamp-1 italic">{client.notes}</p>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {stats && (stats.nb_devis > 0 || stats.nb_chantiers > 0) && (
        <div className="px-5 py-2.5 bg-cream-50 border-t border-cream-300 flex items-center gap-4 text-xs text-navy-500">
          {stats.ca > 0 && (
            <span className="font-bold text-navy-700">{formatCurrency(stats.ca)} <span className="font-normal text-navy-400">CA devis</span></span>
          )}
          {stats.nb_devis > 0 && (
            <span>{stats.nb_devis} devis</span>
          )}
          {stats.nb_chantiers > 0 && (
            <span>{stats.nb_chantiers} chantier{stats.nb_chantiers > 1 ? 's' : ''}</span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-cream-300 flex items-center gap-2 flex-wrap">
        <button onClick={onEdit} className="btn btn-ghost btn-sm">
          Modifier
        </button>
        <Link
          href={`/dashboard/artisan/clients/${client.id}`}
          className="btn btn-ghost btn-sm no-underline"
        >
          Historique
        </Link>
        <button
          onClick={onDelete}
          className="btn btn-danger btn-sm ml-auto"
        >
          Supprimer
        </button>
      </div>
    </div>
  )
}

// ─── Client Modal ─────────────────────────────────────────────────────────────
function ClientModal({
  form,
  setField,
  editing,
  saving,
  error,
  firstInputRef,
  onClose,
  onSubmit,
}: {
  form: ClientForm
  setField: <K extends keyof ClientForm>(k: K, v: ClientForm[K]) => void
  editing: boolean
  saving: boolean
  error: string | null
  firstInputRef: React.RefObject<HTMLInputElement>
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-300">
          <h2 className="text-xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            {editing ? 'Modifier le client' : 'Nouveau client'}
          </h2>
          <button
            onClick={onClose}
            className="text-navy-400 hover:text-navy-700 transition-colors p-1 rounded-lg hover:bg-cream-200"
            aria-label="Fermer"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Prénom</label>
              <input
                ref={firstInputRef}
                type="text"
                className="form-input"
                placeholder="Jean"
                value={form.prenom}
                onChange={e => setField('prenom', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="Dupont"
                value={form.nom}
                onChange={e => setField('nom', e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label className="form-label">Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="jean.dupont@email.com"
              value={form.email}
              onChange={e => setField('email', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Téléphone</label>
            <input
              type="tel"
              className="form-input"
              placeholder="06 12 34 56 78"
              value={form.phone}
              onChange={e => setField('phone', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Adresse</label>
            <input
              type="text"
              className="form-input"
              placeholder="12 rue de la Paix, Paris"
              value={form.adresse}
              onChange={e => setField('adresse', e.target.value)}
            />
          </div>

          <div>
            <label className="form-label">Type de client</label>
            <select
              className="form-select"
              value={form.type}
              onChange={e => setField('type', e.target.value as ClientForm['type'])}
            >
              <option value="">— Sélectionner —</option>
              <option value="particulier">Particulier</option>
              <option value="pro">Professionnel</option>
            </select>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Informations complémentaires…"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving ? <span className="spinner w-4 h-4 border-white inline-block" /> : editing ? 'Enregistrer' : 'Créer le client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function MailIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-navy-400">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  )
}
function PhoneIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-navy-400">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.42 2 2 0 0 1 3.6 1.25h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.9a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  )
}
function PinIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-navy-400">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  )
}
