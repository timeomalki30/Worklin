'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import type { Facture, Devis, ClientArtisan } from '@/types'

const PDFDownloadLink = dynamic(() => import('@react-pdf/renderer').then(m => ({ default: m.PDFDownloadLink })), { ssr: false })
const PDFViewer = dynamic(() => import('@react-pdf/renderer').then(m => ({ default: m.PDFViewer })), { ssr: false })
const PDFDocument = dynamic(() => import('@/components/PDFDocument'), { ssr: false })

const STATUS_LABELS: Record<string, string> = {
  brouillon: 'Brouillon',
  envoyee: 'Envoyée',
  payee: 'Payée',
  en_retard: 'En retard',
  annulee: 'Annulée',
}

const STATUS_COLORS: Record<string, string> = {
  brouillon: '#8A8675',
  envoyee: '#0B6FD4',
  payee: '#16A34A',
  en_retard: '#DC2626',
  annulee: '#6B7280',
}

const EMPTY_LIGNE = { description: '', quantite: 1, unite: '', prix_unitaire: 0, tva_pct: 20 }

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[]>([])
  const [devis, setDevis] = useState<Devis[]>([])
  const [clients, setClients] = useState<ClientArtisan[]>([])
  const [artisanInfo, setArtisanInfo] = useState<any>(null)
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [previewFacture, setPreviewFacture] = useState<Facture | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    client_id: '',
    devis_id: '',
    titre: '',
    notes: '',
    date_echeance: '',
    lignes: [{ ...EMPTY_LIGNE }],
  })

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: profile }, { data: artisan }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('artisans').select('*').eq('profile_id', user.id).single(),
    ])

    if (artisan) {
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

      const [{ data: fList }, { data: dList }, { data: cList }] = await Promise.all([
        supabase.from('factures').select('*').eq('artisan_id', artisan.id).order('created_at', { ascending: false }),
        supabase.from('devis').select('*').eq('artisan_id', artisan.id).eq('statut', 'accepte'),
        supabase.from('clients').select('*').eq('artisan_id', artisan.id).order('nom'),
      ])
      setFactures(fList || [])
      setDevis(dList || [])
      setClients(cList || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleDevisSelect = (devisId: string) => {
    const d = devis.find(d => d.id === devisId)
    if (d) {
      setForm(p => ({
        ...p,
        devis_id: devisId,
        client_id: d.client_id || '',
        titre: d.titre || '',
        notes: d.notes || '',
        lignes: d.lignes,
      }))
    } else {
      setForm(p => ({ ...p, devis_id: '' }))
    }
  }

  const calcTotals = (lignes: typeof form.lignes) => {
    const total_ht = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire, 0)
    const tva = lignes.reduce((s, l) => s + l.quantite * l.prix_unitaire * (l.tva_pct / 100), 0)
    return { total_ht, tva, total_ttc: total_ht + tva }
  }

  const handleSave = async (statut: 'brouillon' | 'envoyee') => {
    if (!artisanId) return
    setSaving(true)
    const supabase = createClient()
    const { total_ht, tva, total_ttc } = calcTotals(form.lignes)

    const count = factures.length + 1
    const numero = `FAC-${new Date().getFullYear()}-${String(count).padStart(4, '0')}`

    const { data, error } = await supabase.from('factures').insert({
      artisan_id: artisanId,
      client_id: form.client_id || null,
      devis_id: form.devis_id || null,
      numero,
      titre: form.titre,
      notes: form.notes,
      date_emission: new Date().toISOString().split('T')[0],
      date_echeance: form.date_echeance || null,
      statut,
      lignes: form.lignes,
      total_ht,
      tva,
      total_ttc,
    }).select().single()

    if (!error && data) {
      if (statut === 'envoyee' && form.client_id) {
        const client = clients.find(c => c.id === form.client_id)
        if (client?.email) {
          await fetch('/api/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'facture', clientEmail: client.email, factureId: data.id }),
          })
        }
      }
      setShowCreate(false)
      setForm({ client_id: '', devis_id: '', titre: '', notes: '', date_echeance: '', lignes: [{ ...EMPTY_LIGNE }] })
      await loadData()
    }
    setSaving(false)
  }

  const handleStatusChange = async (id: string, statut: string) => {
    const supabase = createClient()
    await supabase.from('factures').update({ statut }).eq('id', id)
    setFactures(prev => prev.map(f => f.id === id ? { ...f, statut: statut as any } : f))
  }

  const updateLigne = (i: number, field: string, value: any) => {
    setForm(prev => {
      const lignes = [...prev.lignes]
      lignes[i] = { ...lignes[i], [field]: value }
      return { ...prev, lignes }
    })
  }

  const { total_ht, tva, total_ttc } = calcTotals(form.lignes)

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--c-text-muted)' }}>Chargement…</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-3xl)', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Factures</h1>
          <p style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>{factures.length} factures au total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 16, height: 16 }}><path d="M12 5v14M5 12h14"/></svg>
          Nouvelle facture
        </button>
      </div>

      {/* Récap CA */}
      {factures.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
          {[
            { label: 'CA total', value: factures.filter(f => f.statut === 'payee').reduce((s, f) => s + f.total_ttc, 0), color: 'var(--c-success)' },
            { label: 'En attente', value: factures.filter(f => f.statut === 'envoyee').reduce((s, f) => s + f.total_ttc, 0), color: 'var(--c-primary)' },
            { label: 'En retard', value: factures.filter(f => f.statut === 'en_retard').reduce((s, f) => s + f.total_ttc, 0), color: '#DC2626' },
          ].map(card => (
            <div key={card.label} style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '20px 24px' }}>
              <div style={{ fontSize: 12, color: 'var(--c-text-muted)', fontFamily: 'var(--font-head)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>{card.label}</div>
              <div style={{ fontSize: 'var(--fs-2xl)', fontFamily: 'var(--font-head)', fontWeight: 800, color: card.color }}>{card.value.toFixed(2)} €</div>
            </div>
          ))}
        </div>
      )}

      {factures.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--c-text-muted)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ width: 48, height: 48, margin: '0 auto 16px', opacity: 0.4 }}><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>
          <p>Aucune facture pour l&apos;instant</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreate(true)}>Créer ma première facture</button>
        </div>
      ) : (
        <div style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--c-bg)', borderBottom: '1px solid var(--c-border)' }}>
                {['Numéro', 'Titre', 'Client', 'Émission', 'Échéance', 'Montant TTC', 'Statut', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {factures.map((f, i) => {
                const client = clients.find(c => c.id === f.client_id)
                const isLate = f.statut === 'en_retard' || (f.statut === 'envoyee' && f.date_echeance && new Date(f.date_echeance) < new Date())
                return (
                  <tr key={f.id} style={{ borderBottom: i < factures.length - 1 ? '1px solid var(--c-border)' : 'none' }}>
                    <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-primary)' }}>{f.numero}</td>
                    <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)' }}>{f.titre || '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)' }}>{client ? `${client.prenom} ${client.nom}` : '—'}</td>
                    <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)' }}>{new Date(f.date_emission).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', color: isLate ? '#DC2626' : 'var(--c-text-muted)', fontWeight: isLate ? 700 : 400 }}>
                      {f.date_echeance ? new Date(f.date_echeance).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-head)', fontWeight: 700 }}>{f.total_ttc.toFixed(2)} €</td>
                    <td style={{ padding: '14px 16px' }}>
                      <select
                        value={f.statut}
                        onChange={e => handleStatusChange(f.id, e.target.value)}
                        style={{ fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 'var(--r-sm)', border: 'none', background: `${STATUS_COLORS[f.statut]}22`, color: STATUS_COLORS[f.statut], cursor: 'pointer', fontFamily: 'var(--font-head)', outline: 'none' }}
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => setPreviewFacture(f)} style={{ fontSize: 12, padding: '6px 12px', borderRadius: 'var(--r-sm)', border: '1px solid var(--c-border)', background: 'var(--c-surface)', cursor: 'pointer', fontFamily: 'var(--font-head)', fontWeight: 600 }}>
                        Aperçu PDF
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px', overflowY: 'auto' }}>
          <div style={{ background: 'white', borderRadius: 'var(--r-xl)', width: '100%', maxWidth: 760, marginTop: 24, marginBottom: 24 }}>
            <div style={{ padding: '24px 28px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 'var(--fs-xl)', fontFamily: 'var(--font-head)', fontWeight: 800 }}>Nouvelle facture</h2>
              <button onClick={() => setShowCreate(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, color: 'var(--c-text-muted)', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ padding: '24px 28px' }}>
              {devis.length > 0 && (
                <div className="form-group" style={{ marginBottom: 16, padding: '12px 16px', background: 'var(--c-accent-soft)', borderRadius: 'var(--r-md)', border: '1px solid var(--c-accent)20' }}>
                  <label className="form-label" style={{ color: 'var(--c-accent)' }}>Convertir depuis un devis accepté</label>
                  <select className="form-input" value={form.devis_id} onChange={e => handleDevisSelect(e.target.value)}>
                    <option value="">Créer sans devis</option>
                    {devis.map(d => <option key={d.id} value={d.id}>{d.numero} — {d.titre || 'Sans titre'} ({d.total_ttc.toFixed(2)} €)</option>)}
                  </select>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
                <div className="form-group">
                  <label className="form-label">Client</label>
                  <select className="form-input" value={form.client_id} onChange={e => setForm(p => ({ ...p, client_id: e.target.value }))}>
                    <option value="">Sans client</option>
                    {clients.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date d&apos;échéance</label>
                  <input type="date" className="form-input" value={form.date_echeance} onChange={e => setForm(p => ({ ...p, date_echeance: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Titre</label>
                  <input type="text" className="form-input" placeholder="Ex: Rénovation cuisine" value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} />
                </div>
              </div>

              {/* Lignes */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text)', marginBottom: 12 }}>Prestations</div>
                <div style={{ background: 'var(--c-bg)', borderRadius: 'var(--r-md)', overflow: 'hidden', border: '1px solid var(--c-border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 100px 80px 40px', gap: 0, padding: '8px 12px', background: '#f0ebe0', fontSize: 11, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <span>Description</span><span>Qté</span><span>Unité</span><span>Prix HT</span><span>TVA %</span><span></span>
                  </div>
                  {form.lignes.map((ligne, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 80px 80px 100px 80px 40px', gap: 0, padding: '8px 12px', borderTop: '1px solid var(--c-border)' }}>
                      <input value={ligne.description} onChange={e => updateLigne(i, 'description', e.target.value)} placeholder="Description" style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', padding: '4px 0' }} />
                      <input type="number" value={ligne.quantite} onChange={e => updateLigne(i, 'quantite', parseFloat(e.target.value) || 0)} style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', padding: '4px 4px', width: '100%' }} />
                      <input value={ligne.unite} onChange={e => updateLigne(i, 'unite', e.target.value)} placeholder="h / m²" style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', padding: '4px 4px' }} />
                      <input type="number" value={ligne.prix_unitaire} onChange={e => updateLigne(i, 'prix_unitaire', parseFloat(e.target.value) || 0)} style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', padding: '4px 4px', width: '100%' }} />
                      <select value={ligne.tva_pct} onChange={e => updateLigne(i, 'tva_pct', parseFloat(e.target.value))} style={{ border: 'none', background: 'transparent', fontSize: 13, outline: 'none', padding: '4px 2px' }}>
                        <option value={0}>0%</option>
                        <option value={5.5}>5.5%</option>
                        <option value={10}>10%</option>
                        <option value={20}>20%</option>
                      </select>
                      <button onClick={() => setForm(p => ({ ...p, lignes: p.lignes.filter((_, j) => j !== i) }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', fontSize: 18, lineHeight: 1 }} disabled={form.lignes.length === 1}>×</button>
                    </div>
                  ))}
                  <div style={{ padding: '8px 12px', borderTop: '1px solid var(--c-border)' }}>
                    <button onClick={() => setForm(p => ({ ...p, lignes: [...p.lignes, { ...EMPTY_LIGNE }] }))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-accent)', fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 600, padding: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 14, height: 14 }}><path d="M12 5v14M5 12h14"/></svg>
                      Ajouter une ligne
                    </button>
                  </div>
                </div>
              </div>

              {/* Totaux */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
                <div style={{ minWidth: 240 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: 'var(--c-text-muted)' }}>
                    <span>Total HT</span><span style={{ fontWeight: 600, color: 'var(--c-text)' }}>{total_ht.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 13, color: 'var(--c-text-muted)', borderBottom: '1px solid var(--c-border)' }}>
                    <span>TVA</span><span style={{ fontWeight: 600, color: 'var(--c-text)' }}>{tva.toFixed(2)} €</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', fontSize: 16, fontFamily: 'var(--font-head)', fontWeight: 800 }}>
                    <span>Total TTC</span><span>{total_ttc.toFixed(2)} €</span>
                  </div>
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 24 }}>
                <label className="form-label">Notes</label>
                <textarea className="form-input" rows={3} placeholder="Conditions de paiement, références…" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} style={{ resize: 'vertical' }} />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>Annuler</button>
                <button className="btn btn-secondary" onClick={() => handleSave('brouillon')} disabled={saving}>Sauvegarder en brouillon</button>
                <button className="btn btn-primary" onClick={() => handleSave('envoyee')} disabled={saving}>
                  {saving ? <span className="waitlist-spinner"></span> : null}
                  Envoyer au client
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Preview Modal */}
      {previewFacture && artisanInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#0B2440', color: 'white' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700 }}>{previewFacture.numero}</span>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <PDFDownloadLink document={<PDFDocument document={previewFacture} type="facture" artisanInfo={artisanInfo} client={clients.find(c => c.id === previewFacture.client_id)} />} fileName={`${previewFacture.numero}.pdf`}>
                {({ loading: l }) => (
                  <button style={{ padding: '8px 16px', background: 'var(--c-accent)', color: 'white', border: 'none', borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 700 }}>
                    {l ? 'Génération…' : 'Télécharger PDF'}
                  </button>
                )}
              </PDFDownloadLink>
              <button onClick={() => setPreviewFacture(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', cursor: 'pointer', color: 'white', fontSize: 24, lineHeight: 1, borderRadius: 'var(--r-sm)', padding: '4px 10px' }}>×</button>
            </div>
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <PDFViewer style={{ width: '100%', height: '100%' }}>
              <PDFDocument document={previewFacture} type="facture" artisanInfo={artisanInfo} client={clients.find(c => c.id === previewFacture.client_id)} />
            </PDFViewer>
          </div>
        </div>
      )}
    </div>
  )
}
