'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, Shield, AlertCircle, Calendar } from 'lucide-react'

const CERTIFS = [
  { id: 'RGE', label: 'RGE', desc: 'Reconnu Garant de l\'Environnement' },
  { id: 'Qualibat', label: 'Qualibat', desc: 'Qualification bâtiment' },
  { id: 'QualiPAC', label: 'QualiPAC', desc: 'Pompes à chaleur' },
  { id: 'QualiSol', label: 'QualiSol', desc: 'Énergie solaire' },
  { id: 'Handibat', label: 'Handibat', desc: 'Accessibilité handicap' },
  { id: 'Qualifelec', label: 'Qualifelec', desc: 'Électricité' },
  { id: 'Decennale', label: 'Décennale', desc: 'Assurance décennale' },
  { id: 'RC_Pro', label: 'RC Pro', desc: 'Responsabilité civile pro' },
]

export default function ParametresPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [profileForm, setProfileForm] = useState({ prenom: '', nom: '', email: '', phone: '' })
  const [artisanForm, setArtisanForm] = useState({
    metier: '', entreprise: '', siret: '', tva: '', adresse: '', ville: '', description: '', tarif_horaire: '',
    forme_juridique: '',
    certifications: {} as Record<string, any>,
  })
  const [conformite, setConformite] = useState({ score: 0, missing: [] as string[] })

  const sp = (k: string, v: string) => setProfileForm(p => ({ ...p, [k]: v }))
  const sa = (k: string, v: any) => setArtisanForm(p => ({ ...p, [k]: v }))

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)
    const [{ data: p }, { data: a }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('artisans').select('*').eq('profile_id', user.id).single(),
    ])
    if (p) setProfileForm({ prenom: p.prenom || '', nom: p.nom || '', email: p.email || '', phone: p.phone || '' })
    if (a) {
      setArtisanId(a.id)
      setArtisanForm({
        metier: a.metier || '', entreprise: a.entreprise || '', siret: a.siret || '',
        tva: a.tva || '', adresse: a.adresse || '', ville: a.ville || '',
        description: a.description || '', tarif_horaire: a.tarif_horaire?.toString() || '',
        forme_juridique: a.forme_juridique || '',
        certifications: a.certifications || {},
      })
      const missing = []
      if (!a.siret) missing.push('SIRET')
      if (!a.tva) missing.push('N° TVA')
      if (!p?.phone) missing.push('Téléphone')
      if (!a.description) missing.push('Description')
      setConformite({ score: Math.round(((4 - missing.length) / 4) * 100), missing })
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!userId || !artisanId) return
    setSaving(true)
    const supabase = createClient()
    await Promise.all([
      supabase.from('profiles').update({ prenom: profileForm.prenom, nom: profileForm.nom, phone: profileForm.phone }).eq('id', userId),
      supabase.from('artisans').update({
        metier: artisanForm.metier, entreprise: artisanForm.entreprise, siret: artisanForm.siret,
        tva: artisanForm.tva, adresse: artisanForm.adresse, ville: artisanForm.ville,
        description: artisanForm.description,
        tarif_horaire: artisanForm.tarif_horaire ? parseFloat(artisanForm.tarif_horaire) : null,
        forme_juridique: artisanForm.forme_juridique || null,
        certifications: artisanForm.certifications,
      }).eq('id', artisanId),
    ])
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
    await loadData()
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8 border-navy-800" /></div>

  return (
    <div className="space-y-8 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Paramètres</h1>
          <p className="text-navy-400 mt-1">Profil professionnel et conformité</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn btn-terra">
          {saving && <span className="spinner" />}
          {saved ? <><CheckCircle size={16} /> Enregistré</> : 'Enregistrer'}
        </button>
      </div>

      {/* Conformité */}
      <div className={`card p-5 ${conformite.score === 100 ? 'border-green-300 bg-green-50' : 'border-yellow-300 bg-yellow-50'}`}>
        <div className="flex items-center gap-4">
          {conformite.score === 100
            ? <CheckCircle size={24} className="text-green-600 flex-shrink-0" />
            : <AlertCircle size={24} className="text-yellow-600 flex-shrink-0" />}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-sm">{conformite.score === 100 ? 'Profil conforme 2027 ✓' : 'Complétez votre profil'}</span>
              <span className="font-black text-lg">{conformite.score}%</span>
            </div>
            <div className="w-full bg-white/60 rounded-full h-2">
              <div className={`h-2 rounded-full transition-all ${conformite.score === 100 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${conformite.score}%` }} />
            </div>
            {conformite.missing.length > 0 && <p className="text-xs mt-1 text-yellow-700">Manquant : {conformite.missing.join(', ')}</p>}
          </div>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-navy-800 pb-3 border-b border-cream-300" style={{ fontFamily: 'var(--font-manrope)' }}>Informations personnelles</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">Prénom</label><input className="form-input" value={profileForm.prenom} onChange={e => sp('prenom', e.target.value)} /></div>
          <div><label className="form-label">Nom</label><input className="form-input" value={profileForm.nom} onChange={e => sp('nom', e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Email</label>
            <input className="form-input opacity-60 cursor-not-allowed" value={profileForm.email} disabled />
            <p className="text-xs text-navy-400 mt-1">Non modifiable</p>
          </div>
          <div><label className="form-label">Téléphone</label><input type="tel" className="form-input" value={profileForm.phone} onChange={e => sp('phone', e.target.value)} placeholder="06 00 00 00 00" /></div>
        </div>
      </div>

      {/* Entreprise */}
      <div className="card p-6 space-y-4">
        <h2 className="font-bold text-navy-800 pb-3 border-b border-cream-300" style={{ fontFamily: 'var(--font-manrope)' }}>Informations professionnelles</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="form-label">Métier</label><input className="form-input" value={artisanForm.metier} onChange={e => sa('metier', e.target.value)} placeholder="Plombier" /></div>
          <div><label className="form-label">Nom d&apos;entreprise</label><input className="form-input" value={artisanForm.entreprise} onChange={e => sa('entreprise', e.target.value)} placeholder="SARL Dupont" /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label">Forme juridique</label>
            <select className="form-select" value={artisanForm.forme_juridique} onChange={e => sa('forme_juridique', e.target.value)}>
              <option value="">— Sélectionner —</option>
              <option value="auto">Auto-entrepreneur / Micro-entreprise</option>
              <option value="EI">EI — Entreprise individuelle</option>
              <option value="EIRL">EIRL</option>
              <option value="EURL">EURL</option>
              <option value="SARL">SARL</option>
              <option value="SAS">SAS</option>
              <option value="SASU">SASU</option>
              <option value="SNC">SNC</option>
              <option value="SA">SA</option>
            </select>
          </div>
          <div>
            <label className="form-label">Tarif horaire (€)</label>
            <input type="number" className="form-input" value={artisanForm.tarif_horaire} onChange={e => sa('tarif_horaire', e.target.value)} placeholder="65" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="form-label flex items-center gap-1">SIRET <Shield size={12} className="text-terra-500" /></label>
            <input className="form-input" value={artisanForm.siret} onChange={e => sa('siret', e.target.value)} placeholder="123 456 789 00012" />
          </div>
          <div>
            <label className="form-label flex items-center gap-1">N° TVA Intracommunautaire <Shield size={12} className="text-terra-500" /></label>
            <input className="form-input" value={artisanForm.tva} onChange={e => sa('tva', e.target.value)} placeholder="FR12345678901" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2"><label className="form-label">Adresse</label><input className="form-input" value={artisanForm.adresse} onChange={e => sa('adresse', e.target.value)} placeholder="12 rue de la Paix" /></div>
          <div><label className="form-label">Ville</label><input className="form-input" value={artisanForm.ville} onChange={e => sa('ville', e.target.value)} placeholder="Paris" /></div>
        </div>
        <div>
          <label className="form-label">Description</label>
          <textarea className="form-textarea" rows={3} value={artisanForm.description} onChange={e => sa('description', e.target.value)} placeholder="Présentez vos services et votre expérience…" />
        </div>
      </div>

      {/* Certifications */}
      <div className="card p-6">
        <h2 className="font-bold text-navy-800 mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>Certifications & Assurances</h2>
        <p className="text-sm text-navy-400 mb-5">Sélectionnez vos certifications. Elles apparaîtront sur votre vitrine et vos PDF.</p>
        <div className="grid grid-cols-2 gap-3">
          {CERTIFS.map(c => {
            const active = artisanForm.certifications[c.id]
            return (
              <button key={c.id} type="button"
                onClick={() => sa('certifications', { ...artisanForm.certifications, [c.id]: !active })}
                className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${active ? 'border-green-400 bg-green-50' : 'border-cream-300 hover:border-navy-200'}`}>
                <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 mt-0.5 grid place-items-center ${active ? 'border-green-500 bg-green-500' : 'border-cream-400'}`}>
                  {active && <CheckCircle size={13} className="text-white" />}
                </div>
                <div>
                  <div className={`font-bold text-sm ${active ? 'text-green-800' : 'text-navy-700'}`}>{c.label}</div>
                  <div className="text-xs text-navy-400">{c.desc}</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
