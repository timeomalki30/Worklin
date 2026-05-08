'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Globe, ExternalLink, Copy, CheckCircle, Edit3 } from 'lucide-react'
import type { Demande } from '@/types'

const CERTIFS = ['RGE', 'Qualibat', 'QualiPAC', 'QualiSol', 'Handibat', 'Eco-artisan', 'Qualifelec', 'Décennale']
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://worklin.fr'

export default function VitrinePage() {
  const [artisan, setArtisan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [copied, setCopied] = useState(false)
  const [demandes, setDemandes] = useState<Demande[]>([])
  const [form, setForm] = useState({
    slug: '', metier: '', description: '', ville: '',
    entreprise: '', adresse: '', tarif_horaire: '',
    certifications: {} as Record<string, boolean>,
    photo_url: '',
  })
  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: a } = await supabase.from('artisans').select('*').eq('profile_id', user.id).single()
    if (a) {
      setArtisan(a)
      setForm({
        slug: a.slug || '',
        metier: a.metier || '',
        description: a.description || '',
        ville: a.ville || '',
        entreprise: a.entreprise || '',
        adresse: a.adresse || '',
        tarif_horaire: a.tarif_horaire?.toString() || '',
        certifications: a.certifications || {},
        photo_url: a.photo_url || '',
      })
      const { data: d } = await supabase.from('demandes').select('*').eq('artisan_id', a.id).order('created_at', { ascending: false }).limit(20)
      setDemandes(d || [])
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!artisan) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('artisans').update({
      slug: form.slug,
      metier: form.metier,
      description: form.description,
      ville: form.ville,
      entreprise: form.entreprise,
      adresse: form.adresse,
      tarif_horaire: form.tarif_horaire ? parseFloat(form.tarif_horaire) : null,
      certifications: form.certifications,
      photo_url: form.photo_url,
    }).eq('id', artisan.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleDemandeStatus = async (id: string, statut: string) => {
    const supabase = createClient()
    await supabase.from('demandes').update({ statut }).eq('id', id)
    setDemandes(prev => prev.map(d => d.id === id ? { ...d, statut: statut as any } : d))
  }

  const copyLink = () => {
    navigator.clipboard.writeText(`${APP_URL}/${form.slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8 border-navy-800" /></div>

  const vitrineUrl = `${APP_URL}/${form.slug}`

  return (
    <div className="space-y-8 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Vitrine publique</h1>
          <p className="text-navy-400 mt-1">Votre page publique sur Worklin</p>
        </div>
        <div className="flex gap-3">
          <a href={vitrineUrl} target="_blank" rel="noreferrer" className="btn btn-ghost no-underline">
            <ExternalLink size={16} /> Voir ma vitrine
          </a>
          <button onClick={handleSave} disabled={saving} className="btn btn-terra">
            {saving && <span className="spinner" />}
            {saved ? <><CheckCircle size={16} /> Enregistré</> : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* URL Box */}
      <div className="card p-5 flex items-center gap-4">
        <div className="w-10 h-10 bg-terra-50 rounded-xl grid place-items-center flex-shrink-0">
          <Globe size={20} className="text-terra-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-navy-400 uppercase tracking-wider mb-1">Votre URL publique</div>
          <div className="font-mono text-sm text-navy-700 truncate">{vitrineUrl}</div>
        </div>
        <button onClick={copyLink} className="btn btn-ghost btn-sm flex-shrink-0">
          {copied ? <CheckCircle size={14} className="text-green-600" /> : <Copy size={14} />}
          {copied ? 'Copié !' : 'Copier'}
        </button>
      </div>

      {/* Edit form */}
      <div className="card p-6 space-y-5">
        <h2 className="font-bold text-navy-800 flex items-center gap-2" style={{ fontFamily: 'var(--font-manrope)' }}>
          <Edit3 size={18} /> Personnaliser ma vitrine
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Slug URL (identifiant unique)</label>
            <div className="flex">
              <span className="px-3 py-2.5 bg-cream-200 border border-r-0 border-cream-300 rounded-l-xl text-sm text-navy-400">worklin.fr/</span>
              <input className="form-input rounded-l-none" value={form.slug} onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} placeholder="jean-dupont-plombier" />
            </div>
          </div>
          <div>
            <label className="form-label">Métier</label>
            <input className="form-input" value={form.metier} onChange={e => set('metier', e.target.value)} placeholder="Plombier, Électricien…" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Nom d&apos;entreprise</label>
            <input className="form-input" value={form.entreprise} onChange={e => set('entreprise', e.target.value)} placeholder="SARL Dupont" />
          </div>
          <div>
            <label className="form-label">Ville</label>
            <input className="form-input" value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Paris" />
          </div>
        </div>

        <div>
          <label className="form-label">Adresse</label>
          <input className="form-input" value={form.adresse} onChange={e => set('adresse', e.target.value)} placeholder="12 rue de la Paix, 75001 Paris" />
        </div>

        <div>
          <label className="form-label">Description / Présentation</label>
          <textarea className="form-textarea" rows={4} value={form.description} onChange={e => set('description', e.target.value)}
            placeholder="Artisan plombier depuis 15 ans, spécialisé en rénovation salle de bain et dépannage urgent…" />
          <p className="text-xs text-navy-400 mt-1">{form.description.length}/500 caractères</p>
        </div>

        <div>
          <label className="form-label">Tarif horaire indicatif (€)</label>
          <input type="number" className="form-input max-w-[140px]" value={form.tarif_horaire} onChange={e => set('tarif_horaire', e.target.value)} placeholder="65" />
        </div>
      </div>

      {/* Certifications */}
      <div className="card p-6">
        <h2 className="font-bold text-navy-800 mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>Certifications & Labels</h2>
        <p className="text-sm text-navy-400 mb-5">Affichées sur votre vitrine avec un badge de confiance</p>
        <div className="flex flex-wrap gap-2">
          {CERTIFS.map(c => {
            const active = form.certifications[c]
            return (
              <button key={c} type="button"
                onClick={() => set('certifications', { ...form.certifications, [c]: !active })}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold transition-all ${
                  active ? 'border-green-500 bg-green-50 text-green-700' : 'border-cream-300 text-navy-500 hover:border-navy-300'
                }`}>
                {active && <CheckCircle size={13} />}
                {c}
              </button>
            )
          })}
        </div>
      </div>

      {/* Demandes */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300">
          <h2 className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Demandes de devis reçues</h2>
          {demandes.filter(d => d.statut === 'nouveau').length > 0 && (
            <span className="badge badge-terra">{demandes.filter(d => d.statut === 'nouveau').length} nouvelles</span>
          )}
        </div>
        {demandes.length === 0 ? (
          <div className="p-8 text-center text-navy-400 text-sm">
            <Globe size={32} className="mx-auto mb-3 opacity-30" />
            <p>Activez votre vitrine pour recevoir des demandes</p>
          </div>
        ) : (
          <div className="divide-y divide-cream-300">
            {demandes.map(d => {
              const statutBadge = d.statut === 'nouveau'
                ? <span className="badge badge-terra text-xs">Nouveau</span>
                : d.statut === 'contacte'
                ? <span className="badge badge-blue text-xs">Contacté</span>
                : d.statut === 'converti'
                ? <span className="badge badge-green text-xs">Converti</span>
                : <span className="badge badge-gray text-xs">Traité</span>
              return (
              <div key={d.id} className="p-4 flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm text-navy-800">{d.nom}</span>
                    {statutBadge}
                  </div>
                  {d.email && <div className="text-xs text-navy-400">{d.email}</div>}
                  {d.phone && <div className="text-xs text-navy-400">{d.phone}</div>}
                  <p className="text-sm text-navy-600 mt-2 line-clamp-2">{d.description}</p>
                  <div className="text-xs text-navy-400 mt-1">{new Date(d.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}</div>
                </div>
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <a href={`/dashboard/artisan/devis?prefill_nom=${encodeURIComponent(d.nom)}&prefill_desc=${encodeURIComponent(d.description)}`}
                    className="btn btn-terra btn-sm no-underline whitespace-nowrap">Créer devis</a>
                  <select
                    value={d.statut || 'nouveau'}
                    onChange={e => handleDemandeStatus(d.id, e.target.value)}
                    className="form-select text-xs py-1 px-2"
                  >
                    <option value="nouveau">Nouveau</option>
                    <option value="contacte">Contacté</option>
                    <option value="converti">Converti</option>
                    <option value="traite">Traité / Fermé</option>
                  </select>
                </div>
              </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
