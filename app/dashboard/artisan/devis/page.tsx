'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, calcTotals, generateNumero, TVA_RATES } from '@/lib/utils'
import { statusBadge } from '@/components/ui/badge'
import type { Devis, Client, LigneDocument, DevisStatut } from '@/types'
import { FileText, Plus, X, Trash2, Eye, Download, Sparkles, Send, Save, Copy, Filter } from 'lucide-react'

// Dynamic PDF imports (no SSR)
const PDFViewer = dynamic(
  () => import('@react-pdf/renderer').then(m => ({ default: m.PDFViewer })),
  { ssr: false }
)
const PDFDownloadLink = dynamic(
  () => import('@react-pdf/renderer').then(m => ({ default: m.PDFDownloadLink })),
  { ssr: false }
)
import PDFDocument from '@/components/PDFDocument'

// ─── Types ────────────────────────────────────────────────────────────────────
interface ArtisanInfo {
  nom: string; prenom: string; entreprise?: string; siret?: string
  tva?: string; adresse?: string; email?: string; phone?: string
}

const STATUTS: DevisStatut[] = ['brouillon', 'envoye', 'accepte', 'refuse', 'expire']

const STATUT_LABELS: Record<DevisStatut, string> = {
  brouillon: 'Brouillon',
  envoye: 'Envoyé',
  accepte: 'Accepté',
  refuse: 'Refusé',
  expire: 'Expiré',
}

const emptyLigne = (): LigneDocument => ({
  description: '', quantite: 1, unite: '', prix_unitaire: 0, tva_pct: 20,
})

// ─── Component ────────────────────────────────────────────────────────────────
export default function DevisPage() {
  const supabase = createClient()

  // Data
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [artisanInfo, setArtisanInfo] = useState<ArtisanInfo>({ nom: '', prenom: '' })
  const [clients, setClients] = useState<Client[]>([])
  const [devis, setDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)

  // UI state
  const [showCreate, setShowCreate] = useState(false)
  const [previewDevis, setPreviewDevis] = useState<Devis | null>(null)
  const [saving, setSaving] = useState(false)
  const [filterStatut, setFilterStatut] = useState<DevisStatut | ''>('')
  const [filterSearch, setFilterSearch] = useState('')

  // Create form
  const [form, setForm] = useState({
    client_id: '',
    titre: '',
    date_validite: '',
    notes: '',
  })
  const [lignes, setLignes] = useState<LigneDocument[]>([emptyLigne()])

  // ─── Load data ─────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profile }, { data: artisan }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('artisans').select('*').eq('profile_id', user.id).single(),
    ])

    if (!artisan) return
    setArtisanId(artisan.id)
    setArtisanInfo({
      nom: profile?.nom || '',
      prenom: profile?.prenom || '',
      entreprise: artisan.entreprise,
      siret: artisan.siret,
      tva: artisan.tva,
      adresse: artisan.adresse,
      email: profile?.email,
      phone: profile?.phone,
    })

    const [{ data: clientsData }, { data: devisData }] = await Promise.all([
      supabase.from('clients').select('*').eq('artisan_id', artisan.id).order('nom'),
      supabase.from('devis').select('*, clients(nom, prenom, email)').eq('artisan_id', artisan.id).order('created_at', { ascending: false }),
    ])

    setClients(clientsData || [])
    setDevis(devisData || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const totalDevis = devis.length
  const enAttenteCount = devis.filter(d => d.statut === 'envoye').length
  const caAcceptes = devis
    .filter(d => d.statut === 'accepte')
    .reduce((s, d) => s + d.total_ttc, 0)

  // ─── Line items helpers ─────────────────────────────────────────────────────
  const updateLigne = (i: number, field: keyof LigneDocument, value: string | number) => {
    setLignes(prev => prev.map((l, idx) =>
      idx === i ? { ...l, [field]: field === 'description' || field === 'unite' ? value : Number(value) } : l
    ))
  }

  const addLigne = () => setLignes(prev => [...prev, emptyLigne()])
  const removeLigne = (i: number) => setLignes(prev => prev.filter((_, idx) => idx !== i))

  const totals = calcTotals(lignes)

  // ─── Save devis ────────────────────────────────────────────────────────────
  const handleSave = async (statut: DevisStatut) => {
    if (!artisanId) return
    setSaving(true)
    try {
      const numero = generateNumero('DEV', devis.length + 1)
      const { data, error } = await supabase.from('devis').insert({
        artisan_id: artisanId,
        client_id: form.client_id || null,
        numero,
        titre: form.titre || null,
        notes: form.notes || null,
        statut,
        lignes,
        ...calcTotals(lignes),
        date_emission: new Date().toISOString().split('T')[0],
        date_validite: form.date_validite || null,
      }).select('*, clients(nom, prenom, email)').single()

      if (error) throw error

      if (statut === 'envoye' && data) {
        const client = clients.find(c => c.id === form.client_id)
        if (client?.email) {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: client.email,
              subject: `Votre devis ${numero}`,
              type: 'devis',
              document: data,
              artisanInfo,
              client,
            }),
          })
        }
      }

      setDevis(prev => [data!, ...prev])
      resetCreate()
    } catch (err) {
      console.error('Erreur sauvegarde devis:', err)
    } finally {
      setSaving(false)
    }
  }

  const resetCreate = () => {
    setShowCreate(false)
    setForm({ client_id: '', titre: '', date_validite: '', notes: '' })
    setLignes([emptyLigne()])
  }

  // ─── Status change inline ───────────────────────────────────────────────────
  const handleStatusChange = async (id: string, statut: DevisStatut) => {
    await supabase.from('devis').update({ statut }).eq('id', id)
    setDevis(prev => prev.map(d => d.id === id ? { ...d, statut } : d))
  }

  // ─── Delete devis ───────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce devis ? Cette action est irréversible.')) return
    const { error } = await supabase.from('devis').delete().eq('id', id)
    if (!error) setDevis(prev => prev.filter(d => d.id !== id))
  }

  // ─── Duplicate devis ────────────────────────────────────────────────────────
  const handleDuplicate = async (d: Devis) => {
    if (!artisanId) return
    const numero = generateNumero('DEV', devis.length + 1)
    const { data, error } = await supabase.from('devis').insert({
      artisan_id: artisanId,
      client_id: d.client_id || null,
      numero,
      titre: d.titre ? `Copie — ${d.titre}` : null,
      notes: d.notes || null,
      statut: 'brouillon' as DevisStatut,
      lignes: d.lignes,
      total_ht: d.total_ht,
      tva: d.tva,
      total_ttc: d.total_ttc,
      date_emission: new Date().toISOString().split('T')[0],
      date_validite: null,
    }).select('*, clients(nom, prenom, email)').single()
    if (!error && data) setDevis(prev => [data, ...prev])
  }

  // ─── Filtered list ──────────────────────────────────────────────────────────
  const filteredDevis = devis.filter(d => {
    if (filterStatut && d.statut !== filterStatut) return false
    if (filterSearch) {
      const q = filterSearch.toLowerCase()
      const clientName = d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.toLowerCase() : ''
      return d.numero.toLowerCase().includes(q) || (d.titre || '').toLowerCase().includes(q) || clientName.includes(q)
    }
    return true
  })

  // ─── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8 border-navy-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            Devis
          </h1>
          <p className="text-navy-400 mt-1 text-sm">Gérez vos devis et suivez leur statut</p>
        </div>
        <button className="btn btn-terra" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nouveau devis
        </button>
      </div>

      {/* ── KPI bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="w-10 h-10 bg-navy-800 rounded-xl grid place-items-center text-white mb-1">
            <FileText size={18} />
          </div>
          <div className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            {totalDevis}
          </div>
          <div className="text-xs font-semibold text-navy-400 uppercase tracking-wider">Total devis</div>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 bg-blue-500 rounded-xl grid place-items-center text-white mb-1">
            <Send size={18} />
          </div>
          <div className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            {enAttenteCount}
          </div>
          <div className="text-xs font-semibold text-navy-400 uppercase tracking-wider">En attente de réponse</div>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 bg-terra-500 rounded-xl grid place-items-center text-white mb-1">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            {formatCurrency(caAcceptes)}
          </div>
          <div className="text-xs font-semibold text-navy-400 uppercase tracking-wider">CA devis acceptés</div>
        </div>
      </div>

      {/* ── Filters ── */}
      {devis.length > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-xs">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input type="text" placeholder="Rechercher…" value={filterSearch} onChange={e => setFilterSearch(e.target.value)} className="form-input pl-9 py-2 text-sm" />
          </div>
          <select value={filterStatut} onChange={e => setFilterStatut(e.target.value as DevisStatut | '')} className="form-select py-2 text-sm w-40">
            <option value="">Tous les statuts</option>
            {STATUTS.map(s => <option key={s} value={s}>{STATUT_LABELS[s]}</option>)}
          </select>
          {(filterStatut || filterSearch) && (
            <button onClick={() => { setFilterStatut(''); setFilterSearch('') }} className="btn btn-ghost btn-sm">
              <X size={13} /> Effacer
            </button>
          )}
        </div>
      )}

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {devis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            {/* Illustration SVG */}
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6 opacity-30">
              <rect x="20" y="10" width="65" height="85" rx="8" fill="#0B2440" />
              <rect x="30" y="25" width="45" height="5" rx="2.5" fill="white" opacity=".4" />
              <rect x="30" y="37" width="35" height="4" rx="2" fill="white" opacity=".3" />
              <rect x="30" y="49" width="40" height="4" rx="2" fill="white" opacity=".3" />
              <rect x="30" y="61" width="25" height="4" rx="2" fill="white" opacity=".3" />
              <rect x="30" y="75" width="45" height="10" rx="4" fill="#DD5A2A" opacity=".7" />
              <circle cx="88" cy="88" r="22" fill="#DD5A2A" />
              <path d="M88 79v9m0 0v9m0-9h9m-9 0h-9" stroke="white" strokeWidth="3" strokeLinecap="round" />
            </svg>
            <h3 className="font-bold text-navy-700 text-lg mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>
              Aucun devis pour l&apos;instant
            </h3>
            <p className="text-navy-400 text-sm mb-6 max-w-xs">
              Créez votre premier devis professionnel en quelques clics, ou laissez l&apos;IA le générer pour vous.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <button className="btn btn-terra" onClick={() => setShowCreate(true)}>
                <Plus size={15} /> Créer un devis
              </button>
              <Link href="/dashboard/artisan/ia" className="btn btn-secondary no-underline">
                <Sparkles size={15} /> Générer avec l&apos;IA
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {filteredDevis.length === 0 ? (
              <div className="py-12 text-center text-navy-400 text-sm">Aucun devis ne correspond à vos filtres.</div>
            ) : (
            <table className="w-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Titre</th>
                  <th>Client</th>
                  <th>Date</th>
                  <th className="text-right">Montant TTC</th>
                  <th>Statut</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredDevis.map(d => (
                  <tr key={d.id}>
                    <td className="font-bold text-navy-700 whitespace-nowrap">{d.numero}</td>
                    <td className="text-navy-600 max-w-[160px] truncate">{d.titre || '—'}</td>
                    <td className="text-navy-600 whitespace-nowrap">
                      {d.clients ? `${d.clients.prenom || ''} ${d.clients.nom}`.trim() : '—'}
                    </td>
                    <td className="text-navy-500 whitespace-nowrap">
                      {new Date(d.date_emission).toLocaleDateString('fr-FR')}
                    </td>
                    <td className="text-right font-semibold text-navy-800 whitespace-nowrap">
                      {formatCurrency(d.total_ttc)}
                    </td>
                    <td>
                      <select
                        value={d.statut}
                        onChange={e => handleStatusChange(d.id, e.target.value as DevisStatut)}
                        className="form-select text-xs py-1 px-2 w-32"
                      >
                        {STATUTS.map(s => (
                          <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                        ))}
                      </select>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button className="btn btn-ghost btn-sm p-2" onClick={() => setPreviewDevis(d)} title="Aperçu PDF">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm p-2" onClick={() => handleDuplicate(d)} title="Dupliquer">
                          <Copy size={14} />
                        </button>
                        <button className="btn btn-ghost btn-sm p-2 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(d.id)} title="Supprimer">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            )}
          </div>
        )}
      </div>

      {/* ── PDF Preview Modal ── */}
      {previewDevis && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.85)' }}>
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-6 py-3 flex-shrink-0"
            style={{ background: '#0B2440' }}
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-terra-400" />
              <span className="text-white font-bold" style={{ fontFamily: 'var(--font-manrope)' }}>
                {previewDevis.numero}
              </span>
              {previewDevis.titre && (
                <span className="text-white/50 text-sm">— {previewDevis.titre}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <PDFDownloadLink
                document={
                  <PDFDocument
                    document={previewDevis}
                    type="devis"
                    artisanInfo={artisanInfo}
                    client={previewDevis.clients}
                  />
                }
                fileName={`${previewDevis.numero}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button className="btn btn-terra btn-sm gap-1.5" disabled={pdfLoading}>
                    {pdfLoading ? <div className="spinner w-3.5 h-3.5" /> : <Download size={14} />}
                    Télécharger
                  </button>
                )}
              </PDFDownloadLink>
              <button
                onClick={() => setPreviewDevis(null)}
                className="w-8 h-8 rounded-lg grid place-items-center text-white/60 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* PDF viewer */}
          <div className="flex-1 overflow-hidden">
            <PDFViewer style={{ width: '100%', height: '100%' }} showToolbar={false}>
              <PDFDocument
                document={previewDevis}
                type="devis"
                artisanInfo={artisanInfo}
                client={previewDevis.clients}
              />
            </PDFViewer>
          </div>
        </div>
      )}

      {/* ── Create Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 z-40 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="min-h-full flex items-start justify-center p-4 pt-10 pb-16">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-cream-300">
                <h2 className="text-xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
                  Nouveau devis
                </h2>
                <div className="flex items-center gap-3">
                  <Link
                    href="/dashboard/artisan/ia"
                    className="btn btn-terra btn-sm gap-1.5 no-underline"
                    onClick={resetCreate}
                  >
                    <Sparkles size={14} />
                    Générer avec l&apos;IA
                  </Link>
                  <button
                    onClick={resetCreate}
                    className="w-8 h-8 rounded-lg grid place-items-center text-navy-400 hover:text-navy-700 hover:bg-cream-200"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Row 1: client + titre + date */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="form-label">Client</label>
                    <select
                      className="form-select"
                      value={form.client_id}
                      onChange={e => setForm(f => ({ ...f, client_id: e.target.value }))}
                    >
                      <option value="">Sans client</option>
                      {clients.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.prenom ? `${c.prenom} ${c.nom}` : c.nom}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">Titre du devis</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex. Rénovation cuisine…"
                      value={form.titre}
                      onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Valable jusqu&apos;au</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.date_validite}
                      onChange={e => setForm(f => ({ ...f, date_validite: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="form-label mb-0">Prestations</label>
                  </div>
                  <div className="rounded-xl border border-cream-300 overflow-hidden">
                    {/* Table header */}
                    <div className="hidden sm:grid grid-cols-[1fr_80px_80px_110px_90px_40px] gap-2 px-4 py-2.5 bg-cream-200 text-xs font-bold text-navy-400 uppercase tracking-wider">
                      <span>Description</span>
                      <span>Qté</span>
                      <span>Unité</span>
                      <span>Prix HT</span>
                      <span>TVA %</span>
                      <span />
                    </div>

                    {lignes.map((ligne, i) => (
                      <div
                        key={i}
                        className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_110px_90px_40px] gap-2 px-4 py-3 border-t border-cream-300 first:border-t-0"
                      >
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Description de la prestation"
                          value={ligne.description}
                          onChange={e => updateLigne(i, 'description', e.target.value)}
                        />
                        <input
                          type="number"
                          className="form-input"
                          placeholder="1"
                          min={0}
                          step="0.01"
                          value={ligne.quantite}
                          onChange={e => updateLigne(i, 'quantite', e.target.value)}
                        />
                        <input
                          type="text"
                          className="form-input"
                          placeholder="m², h…"
                          value={ligne.unite || ''}
                          onChange={e => updateLigne(i, 'unite', e.target.value)}
                        />
                        <input
                          type="number"
                          className="form-input"
                          placeholder="0.00"
                          min={0}
                          step="0.01"
                          value={ligne.prix_unitaire}
                          onChange={e => updateLigne(i, 'prix_unitaire', e.target.value)}
                        />
                        <select
                          className="form-select"
                          value={ligne.tva_pct}
                          onChange={e => updateLigne(i, 'tva_pct', e.target.value)}
                        >
                          {TVA_RATES.map(r => (
                            <option key={r} value={r}>{r} %</option>
                          ))}
                        </select>
                        <button
                          className="btn btn-ghost btn-sm p-2 text-red-400 hover:text-red-600 hover:bg-red-50 justify-self-end"
                          onClick={() => removeLigne(i)}
                          disabled={lignes.length === 1}
                          title="Supprimer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>

                  <button className="btn btn-ghost btn-sm mt-3 gap-1.5" onClick={addLigne}>
                    <Plus size={14} />
                    Ajouter une ligne
                  </button>
                </div>

                {/* Totals + Notes side by side */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                  {/* Notes */}
                  <div>
                    <label className="form-label">Notes / conditions</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Conditions particulières, délais, informations complémentaires…"
                      rows={4}
                      value={form.notes}
                      onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    />
                  </div>

                  {/* Live totals */}
                  <div className="bg-cream-200/60 rounded-2xl p-5 space-y-2.5">
                    <div className="flex justify-between text-sm text-navy-600">
                      <span>Total HT</span>
                      <span className="font-semibold">{formatCurrency(totals.total_ht)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-navy-600">
                      <span>TVA</span>
                      <span className="font-semibold">{formatCurrency(totals.tva)}</span>
                    </div>
                    <div className="h-px bg-cream-400" />
                    <div className="flex justify-between">
                      <span className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
                        Total TTC
                      </span>
                      <span className="text-xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
                        {formatCurrency(totals.total_ttc)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-cream-300">
                  <button className="btn btn-ghost" onClick={resetCreate} disabled={saving}>
                    Annuler
                  </button>
                  <button
                    className="btn btn-secondary gap-1.5"
                    onClick={() => handleSave('brouillon')}
                    disabled={saving}
                  >
                    {saving ? <div className="spinner w-3.5 h-3.5" /> : <Save size={14} />}
                    Sauvegarder brouillon
                  </button>
                  <button
                    className="btn btn-terra gap-1.5"
                    onClick={() => handleSave('envoye')}
                    disabled={saving}
                  >
                    {saving ? <div className="spinner w-3.5 h-3.5" /> : <Send size={14} />}
                    Envoyer au client
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
