'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import type { HoraireDay } from '@/types'

const CERTIFS = ['RGE', 'Qualibat', 'QualiPAC', 'QualiSol', 'Handibat', 'Eco-artisan', 'Qualifelec', 'Décennale']

const JOURS_SEMAINE: { key: string; label: string }[] = [
  { key: 'lun', label: 'Lundi'    },
  { key: 'mar', label: 'Mardi'    },
  { key: 'mer', label: 'Mercredi' },
  { key: 'jeu', label: 'Jeudi'    },
  { key: 'ven', label: 'Vendredi' },
  { key: 'sam', label: 'Samedi'   },
  { key: 'dim', label: 'Dimanche' },
]

export const DEFAULT_HORAIRES: Record<string, HoraireDay> = {
  lun: { actif: true,  debut: '08:00', fin: '18:00' },
  mar: { actif: true,  debut: '08:00', fin: '18:00' },
  mer: { actif: true,  debut: '08:00', fin: '18:00' },
  jeu: { actif: true,  debut: '08:00', fin: '18:00' },
  ven: { actif: true,  debut: '08:00', fin: '18:00' },
  sam: { actif: false, debut: '09:00', fin: '12:00' },
  dim: { actif: false, debut: '09:00', fin: '12:00' },
}

type CertifEntry = { active: boolean; expires_at: string }

function getCertifEntry(raw: any, name: string): CertifEntry {
  const val = raw?.[name]
  if (!val) return { active: false, expires_at: '' }
  if (typeof val === 'boolean') return { active: val, expires_at: '' }
  return { active: val.active ?? false, expires_at: val.expires_at ?? '' }
}

function certifBadge(entry: CertifEntry) {
  if (!entry.active || !entry.expires_at) return null
  const today = new Date()
  const exp = new Date(entry.expires_at)
  const daysLeft = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (daysLeft <= 0)  return { label: 'Expirée',               color: '#DC2626', bg: '#fef2f2' }
  if (daysLeft <= 30) return { label: `Expire dans ${daysLeft}j`, color: '#CA8A04', bg: '#fffbeb' }
  return null
}

const FORMES = [
  { value: '',     label: '— Sélectionner —' },
  { value: 'auto', label: 'Auto-entrepreneur / Micro-entreprise' },
  { value: 'EI',   label: 'EI — Entreprise individuelle' },
  { value: 'EIRL', label: 'EIRL' },
  { value: 'EURL', label: 'EURL' },
  { value: 'SARL', label: 'SARL' },
  { value: 'SAS',  label: 'SAS'  },
  { value: 'SASU', label: 'SASU' },
  { value: 'SNC',  label: 'SNC'  },
  { value: 'SA',   label: 'SA'   },
]

export default function ParametresPage() {
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [saved, setSaved]         = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [userId, setUserId]       = useState<string | null>(null)
  const [artisanId, setArtisanId] = useState<string | null>(null)

  const [profileForm, setProfileForm] = useState({ prenom: '', nom: '', email: '', phone: '' })
  const [artisanForm, setArtisanForm] = useState({
    metier: '', entreprise: '', siret: '', tva: '', adresse: '', ville: '',
    description: '', tarif_horaire: '', forme_juridique: '',
    certifications: {} as Record<string, any>,
  })
  const [horairesDefaut, setHorairesDefaut] = useState<Record<string, HoraireDay>>({ ...DEFAULT_HORAIRES })

  const sp = (k: string, v: string) => setProfileForm(p => ({ ...p, [k]: v }))
  const sa = (k: string, v: any)    => setArtisanForm(p => ({ ...p, [k]: v }))
  const sh = (key: string, field: keyof HoraireDay, value: any) =>
    setHorairesDefaut(p => ({ ...p, [key]: { ...p[key], [field]: value } }))

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
        metier: artisan.metier || '', entreprise: artisan.entreprise || '',
        siret: artisan.siret || '', tva: artisan.tva || '', adresse: artisan.adresse || '',
        ville: artisan.ville || '', description: artisan.description || '',
        tarif_horaire: artisan.tarif_horaire?.toString() || '',
        forme_juridique: artisan.forme_juridique || '',
        certifications: artisan.certifications || {},
      })
      if (artisan.horaires_defaut) {
        setHorairesDefaut({ ...DEFAULT_HORAIRES, ...artisan.horaires_defaut })
      }
    }
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!userId || !artisanId) return
    setSaving(true)
    setSaveError(null)
    try {
      const supabase = createClient()
      const [profileRes, artisanRes] = await Promise.all([
        supabase.from('profiles').update({
          prenom: profileForm.prenom, nom: profileForm.nom, phone: profileForm.phone,
        }).eq('id', userId),
        supabase.from('artisans').update({
          metier: artisanForm.metier, entreprise: artisanForm.entreprise,
          siret: artisanForm.siret, tva: artisanForm.tva, adresse: artisanForm.adresse,
          ville: artisanForm.ville, description: artisanForm.description,
          tarif_horaire: artisanForm.tarif_horaire ? parseFloat(artisanForm.tarif_horaire) : null,
          certifications: artisanForm.certifications,
          horaires_defaut: horairesDefaut,
        }).eq('id', artisanId),
      ])
      const err = profileRes.error || artisanRes.error
      if (err) {
        setSaveError(err.message)
      } else {
        setSaved(true)
        setTimeout(() => setSaved(false), 3000)
      }
    } catch (e: any) {
      setSaveError(e?.message ?? 'Erreur inattendue')
    } finally {
      setSaving(false)
    }
  }

  const toggleCertif = (name: string) => {
    const current = getCertifEntry(artisanForm.certifications, name)
    sa('certifications', { ...artisanForm.certifications, [name]: { ...current, active: !current.active } })
  }

  const setCertifDate = (name: string, expires_at: string) => {
    const current = getCertifEntry(artisanForm.certifications, name)
    sa('certifications', { ...artisanForm.certifications, [name]: { ...current, expires_at } })
  }

  const alertCount = CERTIFS.reduce((n, c) => certifBadge(getCertifEntry(artisanForm.certifications, c)) ? n + 1 : n, 0)

  if (loading) return <div style={{ padding: 48, textAlign: 'center', color: 'var(--c-text-muted)' }}>Chargement…</div>

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 'var(--fs-3xl)', fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>Paramètres</h1>
        <p style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)' }}>Gérez votre profil et vos informations professionnelles</p>
      </div>

      {/* ── Infos personnelles ──────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <SectionTitle>Informations personnelles</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group"><label className="form-label">Prénom</label><input className="form-input" value={profileForm.prenom} onChange={e => sp('prenom', e.target.value)} /></div>
          <div className="form-group"><label className="form-label">Nom</label><input className="form-input" value={profileForm.nom} onChange={e => sp('nom', e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" value={profileForm.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
            <span style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 4, display: 'block' }}>L&apos;email ne peut pas être modifié ici</span>
          </div>
          <div className="form-group"><label className="form-label">Téléphone</label><input type="tel" className="form-input" value={profileForm.phone} onChange={e => sp('phone', e.target.value)} placeholder="06 00 00 00 00" /></div>
        </div>
      </section>

      {/* ── Infos professionnelles ──────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <SectionTitle>Informations professionnelles</SectionTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group"><label className="form-label">Métier</label><input className="form-input" value={artisanForm.metier} onChange={e => sa('metier', e.target.value)} placeholder="Plombier, Électricien…" /></div>
          <div className="form-group"><label className="form-label">Nom d&apos;entreprise</label><input className="form-input" value={artisanForm.entreprise} onChange={e => sa('entreprise', e.target.value)} placeholder="SARL Dupont Plomberie" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group"><label className="form-label">SIRET</label><input className="form-input" value={artisanForm.siret} onChange={e => sa('siret', e.target.value)} placeholder="123 456 789 00012" /></div>
          <div className="form-group"><label className="form-label">N° TVA Intracommunautaire</label><input className="form-input" value={artisanForm.tva} onChange={e => sa('tva', e.target.value)} placeholder="FR12345678901" /></div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Forme juridique</label>
            <select className="form-input" value={artisanForm.forme_juridique} onChange={e => sa('forme_juridique', e.target.value)}>
              {FORMES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group"><label className="form-label">Adresse professionnelle</label><input className="form-input" value={artisanForm.adresse} onChange={e => sa('adresse', e.target.value)} placeholder="12 rue de la Paix" /></div>
          <div className="form-group"><label className="form-label">Ville</label><input className="form-input" value={artisanForm.ville} onChange={e => sa('ville', e.target.value)} placeholder="Paris" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16, marginBottom: 16 }}>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-input" rows={4} value={artisanForm.description} onChange={e => sa('description', e.target.value)} placeholder="Décrivez vos services…" style={{ resize: 'vertical' }} />
          </div>
          <div className="form-group">
            <label className="form-label">Tarif horaire (€)</label>
            <input type="number" className="form-input" value={artisanForm.tarif_horaire} onChange={e => sa('tarif_horaire', e.target.value)} placeholder="65" />
          </div>
        </div>
      </section>

      {/* ── Certifications ──────────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, paddingBottom: 16, borderBottom: '1px solid var(--c-border)' }}>
          <h2 style={{ fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-head)', fontWeight: 800 }}>Certifications &amp; Labels</h2>
          {alertCount > 0 && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#fffbeb', color: '#CA8A04', border: '1px solid #fde68a', borderRadius: 'var(--r-pill)', fontSize: 12, fontWeight: 700, padding: '4px 12px' }}>
              <AlertTriangle size={13} /> {alertCount} alerte{alertCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)', marginBottom: 20 }}>Activez vos certifications et renseignez leur date d&apos;expiration pour recevoir des alertes.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CERTIFS.map(name => {
            const entry = getCertifEntry(artisanForm.certifications, name)
            const badge = certifBadge(entry)
            return (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 'var(--r-md)', border: `1.5px solid ${entry.active ? (badge ? badge.color : 'var(--c-success)') : 'var(--c-border)'}`, background: entry.active ? (badge ? badge.bg : 'var(--c-success-soft)') : 'var(--c-surface)', transition: 'all 0.15s', flexWrap: 'wrap' }}>
                <button onClick={() => toggleCertif(name)} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: 0, flex: 1, textAlign: 'left', minWidth: 120 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${entry.active ? (badge ? badge.color : 'var(--c-success)') : 'var(--c-border)'}`, background: entry.active ? (badge ? badge.color : 'var(--c-success)') : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {entry.active && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 11, height: 11 }}><path d="M5 13l4 4L19 7"/></svg>}
                  </span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text)' }}>{name}</span>
                </button>
                {badge && (
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 'var(--r-pill)', background: badge.bg, color: badge.color, border: `1px solid ${badge.color}`, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <AlertTriangle size={10} /> {badge.label}
                  </span>
                )}
                {entry.active && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <label style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>Expire le</label>
                    <input type="date" value={entry.expires_at} onChange={e => setCertifDate(name, e.target.value)} onClick={e => e.stopPropagation()} style={{ fontSize: 12, padding: '3px 8px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', background: 'white', color: 'var(--c-text)', outline: 'none' }} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Horaires de travail ─────────────────────────────────────────────── */}
      <section style={sectionStyle}>
        <SectionTitle>Horaires de travail par défaut</SectionTitle>
        <p style={{ fontSize: 'var(--fs-sm)', color: 'var(--c-text-muted)', marginBottom: 20 }}>
          Ces horaires sont utilisés automatiquement lors de la création de disponibilités sur l&apos;agenda.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {JOURS_SEMAINE.map(({ key, label }) => {
            const h: HoraireDay = horairesDefaut[key] ?? DEFAULT_HORAIRES[key] ?? { actif: false, debut: '08:00', fin: '18:00' }
            return (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', borderRadius: 'var(--r-md)', border: `1.5px solid ${h.actif ? 'var(--c-success)' : 'var(--c-border)'}`, background: h.actif ? 'var(--c-success-soft)' : 'var(--c-surface)', transition: 'all 0.15s', flexWrap: 'wrap' }}>
                {/* Toggle + label */}
                <button
                  type="button"
                  onClick={() => sh(key, 'actif', !h.actif)}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, minWidth: 120 }}
                >
                  <span style={{ width: 18, height: 18, borderRadius: 4, border: `2px solid ${h.actif ? 'var(--c-success)' : 'var(--c-border)'}`, background: h.actif ? 'var(--c-success)' : 'transparent', display: 'grid', placeItems: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                    {h.actif && <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" style={{ width: 11, height: 11 }}><path d="M5 13l4 4L19 7"/></svg>}
                  </span>
                  <span style={{ fontSize: 13, fontFamily: 'var(--font-head)', fontWeight: 700, color: 'var(--c-text)', width: 82 }}>{label}</span>
                </button>

                {h.actif ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="time"
                      value={h.debut}
                      onChange={e => sh(key, 'debut', e.target.value)}
                      style={{ fontSize: 13, padding: '5px 10px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', background: 'white', outline: 'none', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 13, color: 'var(--c-text-muted)', fontWeight: 600 }}>→</span>
                    <input
                      type="time"
                      value={h.fin}
                      onChange={e => sh(key, 'fin', e.target.value)}
                      style={{ fontSize: 13, padding: '5px 10px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-sm)', background: 'white', outline: 'none', cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: 12, color: '#15803D', fontFamily: 'var(--font-head)', fontWeight: 600, marginLeft: 4 }}>
                      {(() => {
                        const [sh2, sm2] = h.debut.split(':').map(Number)
                        const [eh, em] = h.fin.split(':').map(Number)
                        const mins = eh * 60 + em - sh2 * 60 - sm2
                        return mins > 0 ? `${Math.floor(mins / 60)}h${mins % 60 > 0 ? String(mins % 60).padStart(2, '0') : ''}` : ''
                      })()}
                    </span>
                  </div>
                ) : (
                  <span style={{ fontSize: 12, color: 'var(--c-text-muted)', fontStyle: 'italic' }}>Jour non travaillé</span>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ── Save ────────────────────────────────────────────────────────────── */}
      {saveError && (
        <div style={{ marginBottom: 16, padding: '12px 16px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: 'var(--r-md)', fontSize: 13, color: '#991B1B', display: 'flex', alignItems: 'flex-start', gap: 8 }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <span><strong>Erreur lors de la sauvegarde :</strong> {saveError}</span>
        </div>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
        {saved && (
          <span style={{ fontSize: 13, color: 'var(--c-success)', fontFamily: 'var(--font-head)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <CheckCircle size={14} /> Modifications enregistrées
          </span>
        )}
        <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ minWidth: 160 }}>
          {saving ? <span className="waitlist-spinner" /> : null}
          {saving ? 'Enregistrement…' : 'Enregistrer les modifications'}
        </button>
      </div>
    </div>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sectionStyle: React.CSSProperties = {
  background: 'var(--c-surface)',
  borderRadius: 'var(--r-lg)',
  border: '1px solid var(--c-border)',
  padding: '24px 28px',
  marginBottom: 24,
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 style={{ fontSize: 'var(--fs-lg)', fontFamily: 'var(--font-head)', fontWeight: 800, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--c-border)' }}>
      {children}
    </h2>
  )
}
