'use client'

import { useCallback, useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency, calcTotals, generateNumero, TVA_RATES } from '@/lib/utils'
import { statusBadge } from '@/components/ui/badge'
import type { Facture, Devis, Client, LigneDocument, FactureStatut } from '@/types'
import { FileText, Plus, X, Trash2, Eye, Download, Save, Send, AlertTriangle } from 'lucide-react'

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

const STATUTS: FactureStatut[] = ['brouillon', 'envoyee', 'payee', 'en_retard', 'annulee']

const STATUT_LABELS: Record<FactureStatut, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  payee: 'Payée',
  en_retard: 'En retard',
  annulee: 'Annulée',
}

const emptyLigne = (): LigneDocument => ({
  description: '', quantite: 1, unite: '', prix_unitaire: 0, tva_pct: 20,
})

const TODAY = new Date().toISOString().split('T')[0]

function isLate(facture: Facture): boolean {
  return facture.statut === 'envoyee' &&
    !!facture.date_echeance &&
    facture.date_echeance < TODAY
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FacturesPage() {
  const supabase = createClient()

  // Data
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [artisanInfo, setArtisanInfo] = useState<ArtisanInfo>({ nom: '', prenom: '' })
  const [clients, setClients] = useState<Client[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [acceptedDevis, setAcceptedDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)

  // UI
  const [showCreate, setShowCreate] = useState(false)
  const [previewFacture, setPreviewFacture] = useState<Facture | null>(null)
  const [saving, setSaving] = useState(false)

  // Create form
  const [form, setForm] = useState({
    client_id: '',
    devis_id: '',
    titre: '',
    date_echeance: '',
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

    const [{ data: clientsData }, { data: facturesData }, { data: devisData }] = await Promise.all([
      supabase.from('clients').select('*').eq('artisan_id', artisan.id).order('nom'),
      supabase.from('factures').select('*, clients(nom, prenom, email)').eq('artisan_id', artisan.id).order('created_at', { ascending: false }),
      supabase.from('devis').select('*, clients(nom, prenom, email)').eq('artisan_id', artisan.id).eq('statut', 'accepte').order('created_at', { ascending: false }),
    ])

    setClients(clientsData || [])
    setFactures(facturesData || [])
    setAcceptedDevis(devisData || [])
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  // ─── KPIs ──────────────────────────────────────────────────────────────────
  const caTotalPaye = factures
    .filter(f => f.statut === 'payee')
    .reduce((s, f) => s + f.total_ttc, 0)

  const enAttenteCount = factures.filter(f => f.statut === 'envoyee' && !isLate(f)).length
  const enRetardCount = factures.filter(f => isLate(f) || f.statut === 'en_retard').length

  // ─── Line items helpers ─────────────────────────────────────────────────────
  const updateLigne = (i: number, field: keyof LigneDocument, value: string | number) => {
    setLignes(prev => prev.map((l, idx) =>
      idx === i ? { ...l, [field]: field === 'description' || field === 'unite' ? value : Number(value) } : l
    ))
  }

  const addLigne = () => setLignes(prev => [...prev, emptyLigne()])
  const removeLigne = (i: number) => setLignes(prev => prev.filter((_, idx) => idx !== i))

  const totals = calcTotals(lignes)

  // ─── Convert from devis ─────────────────────────────────────────────────────
  const handleConvertDevis = (devisId: string) => {
    const devis = acceptedDevis.find(d => d.id === devisId)
    if (!devis) return
    setForm(f => ({
      ...f,
      devis_id: devisId,
      client_id: devis.client_id || '',
      titre: devis.titre || '',
    }))
    setLignes(devis.lignes.length > 0 ? devis.lignes.map(l => ({ ...l })) : [emptyLigne()])
  }

  // ─── Save facture ───────────────────────────────────────────────────────────
  const handleSave = async (statut: FactureStatut) => {
    if (!artisanId) return
    setSaving(true)
    try {
      const numero = generateNumero('FAC', factures.length + 1)
      const { data, error } = await supabase.from('factures').insert({
        artisan_id: artisanId,
        client_id: form.client_id || null,
        devis_id: form.devis_id || null,
        numero,
        titre: form.titre || null,
        notes: form.notes || null,
        statut,
        lignes,
        ...calcTotals(lignes),
        date_emission: TODAY,
        date_echeance: form.date_echeance || null,
      }).select('*, clients(nom, prenom, email)').single()

      if (error) throw error

      if (statut === 'envoyee' && data) {
        const client = clients.find(c => c.id === form.client_id)
        if (client?.email) {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: client.email,
              subject: `Votre facture ${numero}`,
              type: 'facture',
              document: data,
              artisanInfo,
              client,
            }),
          })
        }
      }

      setFactures(prev => [data!, ...prev])
      resetCreate()
    } catch (err) {
      console.error('Erreur sauvegarde facture:', err)
    } finally {
      setSaving(false)
    }
  }

  const resetCreate = () => {
    setShowCreate(false)
    setForm({ client_id: '', devis_id: '', titre: '', date_echeance: '', notes: '' })
    setLignes([emptyLigne()])
  }

  // ─── Status change inline ───────────────────────────────────────────────────
  const handleStatusChange = async (id: string, statut: FactureStatut) => {
    await supabase.from('factures').update({ statut }).eq('id', id)
    setFactures(prev => prev.map(f => f.id === id ? { ...f, statut } : f))
  }

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
            Factures
          </h1>
          <p className="text-navy-400 mt-1 text-sm">Suivez vos factures et vos paiements</p>
        </div>
        <button className="btn btn-terra" onClick={() => setShowCreate(true)}>
          <Plus size={16} />
          Nouvelle facture
        </button>
      </div>

      {/* ── Late warning banner ── */}
      {enRetardCount > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertTriangle size={18} className="text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <span className="font-semibold text-red-800 text-sm">
              {enRetardCount} facture{enRetardCount > 1 ? 's' : ''} en retard de paiement
            </span>
            <span className="text-red-600 text-xs ml-2">— Pensez à relancer vos clients</span>
          </div>
        </div>
      )}

      {/* ── KPI bar ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="kpi-card">
          <div className="w-10 h-10 bg-green-500 rounded-xl grid place-items-center text-white mb-1">
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            {formatCurrency(caTotalPaye)}
          </div>
          <div className="text-xs font-semibold text-navy-400 uppercase tracking-wider">CA total encaissé</div>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 bg-blue-500 rounded-xl grid place-items-center text-white mb-1">
            <FileText size={18} />
          </div>
          <div className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            {enAttenteCount}
          </div>
          <div className="text-xs font-semibold text-navy-400 uppercase tracking-wider">En attente de paiement</div>
        </div>
        <div className="kpi-card">
          <div className="w-10 h-10 bg-red-500 rounded-xl grid place-items-center text-white mb-1">
            <AlertTriangle size={18} />
          </div>
          <div className="text-2xl font-black text-red-600" style={{ fontFamily: 'var(--font-manrope)' }}>
            {enRetardCount}
          </div>
          <div className="text-xs font-semibold text-navy-400 uppercase tracking-wider">En retard</div>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="card overflow-hidden">
        {factures.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            {/* Illustration SVG */}
            <svg width="120" height="120" viewBox="0 0 120 120" fill="none" className="mb-6 opacity-30">
              <rect x="15" y="8" width="70" height="90" rx="8" fill="#0B2440" />
              <rect x="27" y="24" width="46" height="5" rx="2.5" fill="white" opacity=".4" />
              <rect x="27" y="36" width="36" height="4" rx="2" fill="white" opacity=".3" />
              <rect x="27" y="48" width="42" height="4" rx="2" fill="white" opacity=".3" />
              <rect x="27" y="60" width="30" height="4" rx="2" fill="white" opacity=".3" />
              <rect x="27" y="74" width="46" height="12" rx="4" fill="#DD5A2A" opacity=".7" />
              <circle cx="90" cy="90" r="22" fill="#22c55e" opacity=".85" />
              <path d="M80 90l7 7 13-13" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3 className="font-bold text-navy-700 text-lg mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>
              Aucune facture pour l&apos;instant
            </h3>
            <p className="text-navy-400 text-sm mb-6 max-w-xs">
              Créez votre première facture ou convertissez un devis accepté en un clic.
            </p>
            <button className="btn btn-terra" onClick={() => setShowCreate(true)}>
              <Plus size={15} /> Créer une facture
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-table">
              <thead>
                <tr>
                  <th>Numéro</th>
                  <th>Titre</th>
                  <th>Client</th>
                  <th>Émission</th>
                  <th>Échéance</th>
                  <th className="text-right">Montant TTC</th>
                  <th>Statut</th>
                  <th className="text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {factures.map(f => {
                  const late = isLate(f)
                  return (
                    <tr key={f.id} className={late ? 'bg-red-50/40' : ''}>
                      <td className="font-bold text-navy-700 whitespace-nowrap">
                        {f.numero}
                        {late && (
                          <span className="ml-2 badge badge-red text-[10px]">Retard</span>
                        )}
                      </td>
                      <td className="text-navy-600 max-w-[140px] truncate">{f.titre || '—'}</td>
                      <td className="text-navy-600 whitespace-nowrap">
                        {f.clients ? `${f.clients.prenom || ''} ${f.clients.nom}`.trim() : '—'}
                      </td>
                      <td className="text-navy-500 whitespace-nowrap">
                        {new Date(f.date_emission).toLocaleDateString('fr-FR')}
                      </td>
                      <td className={`whitespace-nowrap text-sm ${late ? 'text-red-600 font-semibold' : 'text-navy-500'}`}>
                        {f.date_echeance
                          ? new Date(f.date_echeance).toLocaleDateString('fr-FR')
                          : '—'}
                      </td>
                      <td className="text-right font-semibold text-navy-800 whitespace-nowrap">
                        {formatCurrency(f.total_ttc)}
                      </td>
                      <td>
                        <select
                          value={f.statut}
                          onChange={e => handleStatusChange(f.id, e.target.value as FactureStatut)}
                          className="form-select text-xs py-1 px-2 w-36"
                        >
                          {STATUTS.map(s => (
                            <option key={s} value={s}>{STATUT_LABELS[s]}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-center">
                        <button
                          className="btn btn-ghost btn-sm gap-1.5"
                          onClick={() => setPreviewFacture(f)}
                          title="Aperçu PDF"
                        >
                          <Eye size={14} />
                          <span className="hidden sm:inline">Aperçu PDF</span>
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

      {/* ── PDF Preview Modal ── */}
      {previewFacture && (
        <div className="fixed inset-0 z-50 flex flex-col" style={{ background: 'rgba(0,0,0,0.85)' }}>
          {/* Header bar */}
          <div
            className="flex items-center justify-between px-6 py-3 flex-shrink-0"
            style={{ background: '#0B2440' }}
          >
            <div className="flex items-center gap-3">
              <FileText size={18} className="text-terra-400" />
              <span className="text-white font-bold" style={{ fontFamily: 'var(--font-manrope)' }}>
                {previewFacture.numero}
              </span>
              {previewFacture.titre && (
                <span className="text-white/50 text-sm">— {previewFacture.titre}</span>
              )}
            </div>
            <div className="flex items-center gap-3">
              <PDFDownloadLink
                document={
                  <PDFDocument
                    document={previewFacture}
                    type="facture"
                    artisanInfo={artisanInfo}
                    client={previewFacture.clients}
                  />
                }
                fileName={`${previewFacture.numero}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <button className="btn btn-terra btn-sm gap-1.5" disabled={pdfLoading}>
                    {pdfLoading ? <div className="spinner w-3.5 h-3.5" /> : <Download size={14} />}
                    Télécharger
                  </button>
                )}
              </PDFDownloadLink>
              <button
                onClick={() => setPreviewFacture(null)}
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
                document={previewFacture}
                type="facture"
                artisanInfo={artisanInfo}
                client={previewFacture.clients}
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
                  Nouvelle facture
                </h2>
                <button
                  onClick={resetCreate}
                  className="w-8 h-8 rounded-lg grid place-items-center text-navy-400 hover:text-navy-700 hover:bg-cream-200"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Convert from devis */}
                {acceptedDevis.length > 0 && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <label className="form-label text-green-800 mb-2">
                      Convertir depuis un devis accepté
                    </label>
                    <div className="flex gap-3 items-center">
                      <select
                        className="form-select flex-1"
                        value={form.devis_id}
                        onChange={e => {
                          setForm(f => ({ ...f, devis_id: e.target.value }))
                          if (e.target.value) handleConvertDevis(e.target.value)
                        }}
                      >
                        <option value="">— Choisir un devis —</option>
                        {acceptedDevis.map(d => (
                          <option key={d.id} value={d.id}>
                            {d.numero}{d.titre ? ` — ${d.titre}` : ''} ({formatCurrency(d.total_ttc)})
                          </option>
                        ))}
                      </select>
                    </div>
                    {form.devis_id && (
                      <p className="text-xs text-green-700 mt-2">
                        Les lignes du devis ont été importées. Vous pouvez les modifier ci-dessous.
                      </p>
                    )}
                  </div>
                )}

                {/* Row 1: client + titre + date_echeance */}
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
                    <label className="form-label">Titre de la facture</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ex. Travaux salle de bain…"
                      value={form.titre}
                      onChange={e => setForm(f => ({ ...f, titre: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="form-label">Date d&apos;échéance</label>
                    <input
                      type="date"
                      className="form-input"
                      value={form.date_echeance}
                      min={TODAY}
                      onChange={e => setForm(f => ({ ...f, date_echeance: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Line items */}
                <div>
                  <label className="form-label mb-3">Prestations</label>
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
                    <label className="form-label">Notes / conditions de paiement</label>
                    <textarea
                      className="form-textarea"
                      placeholder="Modalités de paiement, RIB, informations complémentaires…"
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
                    onClick={() => handleSave('envoyee')}
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
