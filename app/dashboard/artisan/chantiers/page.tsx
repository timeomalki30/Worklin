'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Chantier, Client, ChantierStatut } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────
type ChantierForm = {
  titre: string
  client_id: string
  statut: ChantierStatut
  date_debut: string
  date_fin: string
  notes: string
}

const EMPTY_FORM: ChantierForm = {
  titre: '',
  client_id: '',
  statut: 'planifie',
  date_debut: '',
  date_fin: '',
  notes: '',
}

// ─── Column config ────────────────────────────────────────────────────────────
const COLUMNS: { statut: ChantierStatut; label: string; badgeClass: string }[] = [
  { statut: 'planifie',  label: 'Planifié',  badgeClass: 'badge-blue'   },
  { statut: 'en_cours',  label: 'En cours',  badgeClass: 'badge-terra'  },
  { statut: 'suspendu',  label: 'Suspendu',  badgeClass: 'badge-yellow' },
  { statut: 'termine',   label: 'Terminé',   badgeClass: 'badge-green'  },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(d?: string) {
  if (!d) return null
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function StatusBadge({ statut }: { statut: ChantierStatut }) {
  const col = COLUMNS.find(c => c.statut === statut)
  return <span className={`badge ${col?.badgeClass ?? 'badge-gray'}`}>{col?.label ?? statut}</span>
}

// ─── Empty column ─────────────────────────────────────────────────────────────
function EmptyColumn() {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center opacity-50">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" className="mb-3">
        <rect x="4" y="8" width="32" height="24" rx="4" fill="#C5BFB5" />
        <rect x="10" y="14" width="20" height="3" rx="1.5" fill="#8B8074" />
        <rect x="10" y="20" width="14" height="3" rx="1.5" fill="#8B8074" />
      </svg>
      <p className="text-sm font-semibold text-navy-500">Aucun chantier</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ChantiersPage() {
  const router = useRouter()
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null)
  const [form, setForm] = useState<ChantierForm>(EMPTY_FORM)

  // Photo upload
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const uploadTargetId = useRef<string | null>(null)

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

      const [{ data: chantiersData }, { data: clientsData }] = await Promise.all([
        supabase
          .from('chantiers')
          .select('*, clients(id, nom, prenom)')
          .eq('artisan_id', artisan.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('clients')
          .select('id, nom, prenom')
          .eq('artisan_id', artisan.id)
          .order('nom'),
      ])

      setChantiers(chantiersData || [])
      setClients(clientsData || [])
      setLoading(false)
    }
    load()
  }, [router])

  useEffect(() => {
    if (modalOpen) setTimeout(() => firstInputRef.current?.focus(), 50)
  }, [modalOpen])

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const counts = {
    planifie: chantiers.filter(c => c.statut === 'planifie').length,
    en_cours: chantiers.filter(c => c.statut === 'en_cours').length,
    suspendu: chantiers.filter(c => c.statut === 'suspendu').length,
    termine:  chantiers.filter(c => c.statut === 'termine').length,
  }

  // ── Modal helpers ─────────────────────────────────────────────────────────
  function openCreate() {
    setEditingChantier(null)
    setForm(EMPTY_FORM)
    setError(null)
    setModalOpen(true)
  }

  function openEdit(chantier: Chantier) {
    setEditingChantier(chantier)
    setForm({
      titre: chantier.titre,
      client_id: chantier.client_id || '',
      statut: chantier.statut,
      date_debut: chantier.date_debut || '',
      date_fin: chantier.date_fin || '',
      notes: chantier.notes || '',
    })
    setError(null)
    setModalOpen(true)
  }

  function closeModal() {
    setModalOpen(false)
    setEditingChantier(null)
    setForm(EMPTY_FORM)
    setError(null)
  }

  function setField<K extends keyof ChantierForm>(k: K, v: ChantierForm[K]) {
    setForm(prev => ({ ...prev, [k]: v }))
  }

  // ── Save ──────────────────────────────────────────────────────────────────
  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titre.trim()) { setError('Le titre est obligatoire.'); return }
    if (!artisanId) return
    setSaving(true)
    setError(null)

    const supabase = createClient()
    const payload = {
      artisan_id: artisanId,
      titre: form.titre.trim(),
      client_id: form.client_id || null,
      statut: form.statut,
      date_debut: form.date_debut || null,
      date_fin: form.date_fin || null,
      notes: form.notes.trim() || null,
    }

    if (editingChantier) {
      const { error: err } = await supabase
        .from('chantiers')
        .update(payload)
        .eq('id', editingChantier.id)

      if (err) { setError(err.message); setSaving(false); return }

      const client = clients.find(c => c.id === payload.client_id)
      setChantiers(prev => prev.map(c =>
        c.id === editingChantier.id
          ? { ...c, ...payload, clients: client ? { ...client } as Client : undefined }
          : c
      ))
    } else {
      const { data, error: err } = await supabase
        .from('chantiers')
        .insert(payload)
        .select('*, clients(id, nom, prenom)')
        .single()

      if (err) { setError(err.message); setSaving(false); return }
      setChantiers(prev => [data, ...prev])
    }

    setSaving(false)
    closeModal()
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete(chantier: Chantier) {
    if (!confirm(`Supprimer le chantier "${chantier.titre}" ? Cette action est irréversible.`)) return
    const supabase = createClient()
    const { error: err } = await supabase.from('chantiers').delete().eq('id', chantier.id)
    if (err) { alert('Erreur : ' + err.message); return }
    setChantiers(prev => prev.filter(c => c.id !== chantier.id))
  }

  // ── Status inline change ──────────────────────────────────────────────────
  async function handleStatusChange(chantier: Chantier, newStatut: ChantierStatut) {
    const supabase = createClient()
    const { error: err } = await supabase
      .from('chantiers')
      .update({ statut: newStatut })
      .eq('id', chantier.id)
    if (err) { alert('Erreur : ' + err.message); return }
    setChantiers(prev => prev.map(c => c.id === chantier.id ? { ...c, statut: newStatut } : c))
  }

  // ── Photo upload ──────────────────────────────────────────────────────────
  function triggerPhotoUpload(chantier: Chantier) {
    uploadTargetId.current = chantier.id
    fileInputRef.current?.click()
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const targetId = uploadTargetId.current
    if (!file || !targetId) return

    setUploadingId(targetId)
    const supabase = createClient()

    const ext = file.name.split('.').pop()
    const path = `${targetId}/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('chantier-photos')
      .upload(path, file, { upsert: false })

    if (uploadErr) {
      alert('Erreur upload : ' + uploadErr.message)
      setUploadingId(null)
      e.target.value = ''
      return
    }

    const { data: urlData } = supabase.storage.from('chantier-photos').getPublicUrl(path)
    const publicUrl = urlData.publicUrl

    const chantier = chantiers.find(c => c.id === targetId)
    const updatedPhotos = [...(chantier?.photos || []), publicUrl]

    const { error: updateErr } = await supabase
      .from('chantiers')
      .update({ photos: updatedPhotos })
      .eq('id', targetId)

    if (updateErr) {
      alert('Erreur mise à jour : ' + updateErr.message)
    } else {
      setChantiers(prev => prev.map(c =>
        c.id === targetId ? { ...c, photos: updatedPhotos } : c
      ))
    }

    setUploadingId(null)
    e.target.value = ''
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
      {/* Hidden file input for photo upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            Chantiers
          </h1>
          <p className="text-navy-400 mt-1 text-sm">Suivi et gestion de vos chantiers</p>
        </div>
        <button onClick={openCreate} className="btn btn-primary self-start sm:self-auto">
          + Nouveau chantier
        </button>
      </div>

      {/* Summary row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {COLUMNS.map(col => (
          <div key={col.statut} className="card px-4 py-3 flex items-center gap-3">
            <div className="flex-1">
              <p className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
                {counts[col.statut]}
              </p>
              <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider mt-0.5">{col.label}</p>
            </div>
            <span className={`badge ${col.badgeClass} self-start`}>{col.label}</span>
          </div>
        ))}
      </div>

      {/* Kanban — desktop grid, mobile list */}
      {chantiers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <svg width="96" height="96" viewBox="0 0 96 96" fill="none" className="mb-6 opacity-40">
            <rect x="8" y="16" width="80" height="64" rx="8" fill="#E8E4DC" />
            <rect x="20" y="32" width="56" height="8" rx="4" fill="#8B8074" />
            <rect x="20" y="48" width="40" height="8" rx="4" fill="#8B8074" />
          </svg>
          <p className="text-navy-500 font-semibold text-lg mb-1">Aucun chantier pour l&apos;instant</p>
          <p className="text-navy-400 text-sm mb-6">Créez votre premier chantier pour commencer le suivi.</p>
          <button onClick={openCreate} className="btn btn-primary">
            + Nouveau chantier
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Kanban */}
          <div className="hidden md:grid grid-cols-4 gap-4 items-start">
            {COLUMNS.map(col => {
              const cards = chantiers.filter(c => c.statut === col.statut)
              return (
                <div key={col.statut} className="flex flex-col gap-3">
                  {/* Column header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`badge ${col.badgeClass}`}>{col.label}</span>
                    <span className="text-xs text-navy-400 font-bold ml-auto">{cards.length}</span>
                  </div>

                  {/* Cards */}
                  {cards.length === 0 ? (
                    <div className="card border-dashed opacity-60">
                      <EmptyColumn />
                    </div>
                  ) : (
                    cards.map(chantier => (
                      <ChantierCard
                        key={chantier.id}
                        chantier={chantier}
                        clients={clients}
                        uploadingId={uploadingId}
                        onEdit={() => openEdit(chantier)}
                        onDelete={() => handleDelete(chantier)}
                        onStatusChange={s => handleStatusChange(chantier, s)}
                        onAddPhoto={() => triggerPhotoUpload(chantier)}
                      />
                    ))
                  )}
                </div>
              )
            })}
          </div>

          {/* Mobile list grouped by status */}
          <div className="md:hidden space-y-6">
            {COLUMNS.map(col => {
              const cards = chantiers.filter(c => c.statut === col.statut)
              return (
                <div key={col.statut}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`badge ${col.badgeClass}`}>{col.label}</span>
                    <span className="text-xs text-navy-400 font-bold">({cards.length})</span>
                  </div>
                  {cards.length === 0 ? (
                    <p className="text-sm text-navy-400 italic pl-2">Aucun chantier</p>
                  ) : (
                    <div className="space-y-3">
                      {cards.map(chantier => (
                        <ChantierCard
                          key={chantier.id}
                          chantier={chantier}
                          clients={clients}
                          uploadingId={uploadingId}
                          onEdit={() => openEdit(chantier)}
                          onDelete={() => handleDelete(chantier)}
                          onStatusChange={s => handleStatusChange(chantier, s)}
                          onAddPhoto={() => triggerPhotoUpload(chantier)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Modal */}
      {modalOpen && (
        <ChantierModal
          form={form}
          setField={setField}
          editing={!!editingChantier}
          saving={saving}
          error={error}
          clients={clients}
          firstInputRef={firstInputRef}
          onClose={closeModal}
          onSubmit={handleSave}
        />
      )}
    </div>
  )
}

// ─── Chantier Card ────────────────────────────────────────────────────────────
function ChantierCard({
  chantier,
  clients,
  uploadingId,
  onEdit,
  onDelete,
  onStatusChange,
  onAddPhoto,
}: {
  chantier: Chantier
  clients: Client[]
  uploadingId: string | null
  onEdit: () => void
  onDelete: () => void
  onStatusChange: (s: ChantierStatut) => void
  onAddPhoto: () => void
}) {
  const clientName = chantier.clients
    ? [chantier.clients.prenom, chantier.clients.nom].filter(Boolean).join(' ')
    : null
  const photoCount = chantier.photos?.length ?? 0
  const isUploading = uploadingId === chantier.id

  return (
    <div className="card p-4 flex flex-col gap-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-bold text-navy-800 text-sm leading-snug line-clamp-2 flex-1">{chantier.titre}</h3>
        {photoCount > 0 && (
          <span className="badge badge-terra flex-shrink-0 flex items-center gap-1">
            <CameraIcon />
            {photoCount}
          </span>
        )}
      </div>

      {/* Client */}
      <p className="text-xs text-navy-500 flex items-center gap-1.5">
        <PersonIcon />
        {clientName || <span className="italic text-navy-400">—</span>}
      </p>

      {/* Dates */}
      {(chantier.date_debut || chantier.date_fin) && (
        <p className="text-xs text-navy-400 flex items-center gap-1.5">
          <CalendarIcon />
          {formatDate(chantier.date_debut) || '?'}
          {chantier.date_fin && <> → {formatDate(chantier.date_fin)}</>}
        </p>
      )}

      {/* Notes */}
      {chantier.notes && (
        <p className="text-xs text-navy-400 line-clamp-2 italic">{chantier.notes}</p>
      )}

      {/* Status select */}
      <select
        className="form-select text-xs py-1"
        value={chantier.statut}
        onChange={e => onStatusChange(e.target.value as ChantierStatut)}
      >
        {COLUMNS.map(col => (
          <option key={col.statut} value={col.statut}>{col.label}</option>
        ))}
      </select>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap pt-1 border-t border-cream-300">
        <button onClick={onEdit} className="btn btn-ghost btn-sm">Modifier</button>
        <button
          onClick={onAddPhoto}
          disabled={isUploading}
          className="btn btn-ghost btn-sm flex items-center gap-1"
        >
          {isUploading
            ? <span className="spinner w-3 h-3 border-navy-600 inline-block" />
            : <CameraIcon />}
          <span>Photos</span>
        </button>
        <button onClick={onDelete} className="btn btn-danger btn-sm ml-auto">Supprimer</button>
      </div>
    </div>
  )
}

// ─── Chantier Modal ───────────────────────────────────────────────────────────
function ChantierModal({
  form,
  setField,
  editing,
  saving,
  error,
  clients,
  firstInputRef,
  onClose,
  onSubmit,
}: {
  form: ChantierForm
  setField: <K extends keyof ChantierForm>(k: K, v: ChantierForm[K]) => void
  editing: boolean
  saving: boolean
  error: string | null
  clients: Client[]
  firstInputRef: React.RefObject<HTMLInputElement>
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-navy-900/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-5 border-b border-cream-300">
          <h2 className="text-xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            {editing ? 'Modifier le chantier' : 'Nouveau chantier'}
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

          <div>
            <label className="form-label">
              Titre du chantier <span className="text-red-500">*</span>
            </label>
            <input
              ref={firstInputRef}
              type="text"
              className="form-input"
              placeholder="Rénovation salle de bain…"
              value={form.titre}
              onChange={e => setField('titre', e.target.value)}
              required
            />
          </div>

          <div>
            <label className="form-label">Client</label>
            <select
              className="form-select"
              value={form.client_id}
              onChange={e => setField('client_id', e.target.value)}
            >
              <option value="">— Aucun client —</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {[c.prenom, c.nom].filter(Boolean).join(' ')}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Statut</label>
            <select
              className="form-select"
              value={form.statut}
              onChange={e => setField('statut', e.target.value as ChantierStatut)}
            >
              {COLUMNS.map(col => (
                <option key={col.statut} value={col.statut}>{col.label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="form-label">Date de début</label>
              <input
                type="date"
                className="form-input"
                value={form.date_debut}
                onChange={e => setField('date_debut', e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Date de fin</label>
              <input
                type="date"
                className="form-input"
                value={form.date_fin}
                onChange={e => setField('date_fin', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="form-label">Notes</label>
            <textarea
              className="form-textarea"
              rows={3}
              placeholder="Détails du chantier, matériaux, contraintes…"
              value={form.notes}
              onChange={e => setField('notes', e.target.value)}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn btn-ghost flex-1">
              Annuler
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary flex-1">
              {saving
                ? <span className="spinner w-4 h-4 border-white inline-block" />
                : editing ? 'Enregistrer' : 'Créer le chantier'
              }
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Inline SVG icons ─────────────────────────────────────────────────────────
function CameraIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  )
}
function PersonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-navy-400">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="flex-shrink-0 text-navy-400">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}
