'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

const CERTIFS = ['RGE', 'Qualibat', 'QualiPAC', 'QualiSol', 'Handibat', 'Eco-artisan', 'Qualifelec']

export default function ParametresPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [artisanId, setArtisanId] = useState<string | null>(null)

  const [profileForm, setProfileForm] = useState({ prenom: '', nom: '', email: '', phone: '' })
  const [artisanForm, setArtisanForm] = useState({
    metier: '',
    entreprise: '',
    siret: '',
    tva: '',
    adresse: '',
    ville: '',
    description: '',
    tarif_horaire: '',
    certifications: {} as Record<string, boolean>,
  })

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setUserId(user.id)

    const [{ data: profile }, { data: artisan }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('artisans').select('*').eq('profile_id', user.id).single(),
    ])

    if (profile) {
      setProfileForm({ prenom: profile.prenom || '', nom: profile.nom || '', email: profile.email || '', phone: profile.phone || '' })
    }
    if (artisan) {
      setArtisanId(artisan.id)
      setArtisanForm({
        metier: artisan.metier || '',
        entreprise: artisan.entreprise || '',
        siret: artisan.siret || '',
        tva: artisan.tva || '',
        adresse: artisan.adresse || '',
        ville: artisan.ville || '',
        description: artisan.description || '',
        tarif_horaire: artisan.tarif_horaire?.toString() || '',
        certifications: artisan.certifications || {},
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!userId || !artisanId) return
    setSaving(true)
    const supabase = createClient()

    await Promise.all([
      supabase.from('profiles').update({
        prenom: profileForm.prenom,
        nom: profileForm.nom,
        phone: profileForm.phone,
      }).eq('id', userId),
      supabase.from('artisans').update({
        metier: artisanForm.metier,
        entreprise: artisanForm.entreprise,
        siret: artisanForm.siret,
        tva: artisanForm.tva,
        adresse: artisanForm.adresse,
        ville: artisanForm.ville,
        description: artisanForm.description,
        tarif_horaire: artisanForm.tarif_horaire ? parseFloat(artisanForm.tarif_horaire) : null,
        certifications: artisanForm.certifications,
      }).eq('id', artisanId),
    ])

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--c-text-muted)' }}>Chargement…</div>

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 'var(--fs-3xl)', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Paramètres</h1>
        <p style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>Gérez votre profil et vos informations professionnelles</p>
      </div>

      {/* Section compte */}
      <section style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '24px 28px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--c-border)' }}>Informations personnelles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Prénom</label>
            <input className="form-input" value={profileForm.prenom} onChange={e => setProfileForm(p => ({ ...p, prenom: e.target.value }))} />
          </div>
          <div className="form-group">
            <label className="form-label">Nom</label>
            <input className="form-input" value={profileForm.nom} onChange={e => setProfileForm(p => ({ ...p, nom: e.target.value }))} />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={profileForm.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <span style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4, display: 'block' }}>L&apos;email ne peut pas être modifié ici</span>
          </div>
          <div className="form-group">
            <label className="form-label">Téléphone</label>
            <input type="tel" className="form-input" value={profileForm.phone} onChange={e => setProfileForm(p => ({ ...p, phone: e.target.value }))} placeholder="06 00 00 00 00" />
          </div>
        </div>
      </section>

      {/* Section entreprise */}
      <section style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '24px 28px', marginBottom: 24 }}>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--c-border)' }}>Informations professionnelles</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Métier</label>
            <input className="form-input" value={artisanForm.metier} onChange={e => setArtisanForm(p => ({ ...p, metier: e.target.value }))} placeholder="Plombier, Électricien…" />
          </div>
          <div className="form-group">
            <label className="form-label">Nom d&apos;entreprise</label>
            <input className="form-input" value={artisanForm.entreprise} onChange={e => setArtisanForm(p => ({ ...p, entreprise: e.target.value }))} placeholder="SARL Dupont Plomberie" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">SIRET</label>
            <input className="form-input" value={artisanForm.siret} onChange={e => setArtisanForm(p => ({ ...p, siret: e.target.value }))} placeholder="123 456 789 00012" />
          </div>
          <div className="form-group">
            <label className="form-label">N° TVA Intracommunautaire</label>
            <input className="form-input" value={artisanForm.tva} onChange={e => setArtisanForm(p => ({ ...p, tva: e.target.value }))} placeholder="FR12345678901" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Adresse professionnelle</label>
            <input className="form-input" value={artisanForm.adresse} onChange={e => setArtisanForm(p => ({ ...p, adresse: e.target.value }))} placeholder="12 rue de la Paix" />
          </div>
          <div className="form-group">
            <label className="form-label">Ville</label>
            <input className="form-input" value={artisanForm.ville} onChange={e => setArtisanForm(p => ({ ...p, ville: e.target.value }))} placeholder="Paris" />
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={4} value={artisanForm.description} onChange={e => setArtisanForm(p => ({ ...p, description: e.target.value }))} placeholder="Décrivez vos services, votre expérience, vos spécialités…" style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Tarif horaire (€)</label>
            <input type="number" className="form-input" value={artisanForm.tarif_horaire} onChange={e => setArtisanForm(p => ({ ...p, tarif_horaire: e.target.value }))} placeholder="65" />
          </div>
        </div>
      </section>

      {/* Certifications */}
      <section style={{ background: 'var(--c-surface)', borderRadius: 'var(--r-lg)', border: '1px solid var(--c-border)', padding: '24px 28px', marginBottom: 32 }}>
        <h2 style={{ fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 8, paddingBottom: 16, borderBottom: '1px solid var(--c-border)' }}>Certifications &amp; Labels</h2>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)', marginBottom: 20 }}>Ces certifications seront affichées sur votre profil public et inspirent confiance aux clients.</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {CERTIFS.map(c => {
            const active = artisanForm.certifications[c]
            return (
              <button key={c} onClick={() => setArtisanForm(p => ({ ...p, certifications: { ...p.certifications, [c]: !p.certifications[c] } }))}
                style={{ padding: '8px 16px', borderRadius: 'var(--r-pill)', border: `1.5px solid ${active ? 'var(--c-success)' : 'var(--c-border)'}`, background: active ? 'var(--c-success-soft)' : 'var(--c-surface)', color: active ? '#14532D' : 'var(--c-text-muted)', cursor: 'pointer', fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s' }}>
                {active && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 13, height: 13 }}><path d="M5 13l4 4L19 7"/></svg>}
                {c}
              </button>
            )
          })}
        </div>
      </section>

      {/* Save */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
        {saved && (
          <span style={{ fontSize: 13, color: 'var(--c-success)', fontFamily: 'var(--font-head)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 14, height: 14 }}><path d="M5 13l4 4L19 7"/></svg>
            Modifications enregistrées
          </span>
        )}
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 160 }}>
          {saving ? <span className="waitlist-spinner"></span> : null}
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}
