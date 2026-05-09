'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle, ChevronRight, ChevronLeft, X } from 'lucide-react'

const STEPS = [
  {
    n: 1,
    title: 'Complétez votre profil',
    desc: 'Votre nom et téléphone permettent à vos clients de vous contacter facilement.',
    icon: '👤',
    fields: ['prenom', 'nom', 'phone'],
  },
  {
    n: 2,
    title: 'Infos entreprise',
    desc: 'Votre SIRET, métier et ville sont indispensables pour apparaître dans les recherches.',
    icon: '🏢',
    fields: ['metier', 'siret', 'ville'],
  },
  {
    n: 3,
    title: 'Personnalisez votre vitrine',
    desc: 'Votre slug définit votre URL publique. Votre bio rassure vos futurs clients.',
    icon: '🌐',
    fields: ['slug', 'description'],
  },
  {
    n: 4,
    title: 'Créez votre premier devis',
    desc: 'Worklin vous permet de créer et envoyer des devis professionnels en quelques clics.',
    icon: '📄',
    fields: [],
  },
  {
    n: 5,
    title: "C'est parti !",
    desc: "Votre espace Worklin est prêt. Bonne gestion de votre activité !",
    icon: '🚀',
    fields: [],
  },
]

export default function OnboardingModal({
  profileId,
  artisanId,
  initialData,
  onComplete,
}: {
  profileId: string
  artisanId: string
  initialData: {
    prenom: string; nom: string; phone: string
    metier: string; siret: string; ville: string
    slug: string; description: string
  }
  onComplete: () => void
}) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState(initialData)
  const [saving, setSaving] = useState(false)

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1
  const progress = ((step + 1) / STEPS.length) * 100

  const set = (k: string, v: string) => setData(p => ({ ...p, [k]: v }))

  const handleNext = async () => {
    if (isLast) {
      await finish()
      return
    }
    setStep(s => s + 1)
  }

  const finish = async () => {
    setSaving(true)
    const supabase = createClient()
    await Promise.all([
      supabase.from('profiles').update({
        prenom: data.prenom,
        nom: data.nom,
        phone: data.phone,
        onboarding_done: true,
      }).eq('id', profileId),
      supabase.from('artisans').update({
        metier: data.metier,
        siret: data.siret,
        ville: data.ville,
        slug: data.slug,
        description: data.description,
      }).eq('id', artisanId),
    ])
    setSaving(false)
    onComplete()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: 'white', borderRadius: 20, width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', overflow: 'hidden' }}>
        {/* Progress bar */}
        <div style={{ height: 4, background: '#f0ebe0' }}>
          <div style={{ height: '100%', background: 'var(--c-accent)', width: `${progress}%`, transition: 'width 0.4s ease', borderRadius: 2 }} />
        </div>

        {/* Header */}
        <div style={{ padding: '28px 32px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--c-accent)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 6 }}>
              Étape {current.n} / {STEPS.length}
            </div>
            <h2 style={{ fontSize: 22, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--c-text)', marginBottom: 4 }}>
              {current.icon} {current.title}
            </h2>
            <p style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.5 }}>{current.desc}</p>
          </div>
          <button
            onClick={onComplete}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', padding: 4, borderRadius: 8, lineHeight: 0 }}
            title="Passer l'onboarding"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step content */}
        <div style={{ padding: '24px 32px' }}>
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Prénom</label>
                  <input className="form-input" value={data.prenom} onChange={e => set('prenom', e.target.value)} placeholder="Jean" />
                </div>
                <div className="form-group">
                  <label className="form-label">Nom</label>
                  <input className="form-input" value={data.nom} onChange={e => set('nom', e.target.value)} placeholder="Dupont" />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Téléphone</label>
                <input type="tel" className="form-input" value={data.phone} onChange={e => set('phone', e.target.value)} placeholder="06 00 00 00 00" />
              </div>
            </div>
          )}

          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Métier</label>
                <input className="form-input" value={data.metier} onChange={e => set('metier', e.target.value)} placeholder="Plombier, Électricien, Menuisier…" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">SIRET</label>
                  <input className="form-input" value={data.siret} onChange={e => set('siret', e.target.value)} placeholder="123 456 789 00012" />
                </div>
                <div className="form-group">
                  <label className="form-label">Ville</label>
                  <input className="form-input" value={data.ville} onChange={e => set('ville', e.target.value)} placeholder="Paris" />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="form-group">
                <label className="form-label">Slug URL</label>
                <div style={{ display: 'flex' }}>
                  <span style={{ padding: '10px 12px', background: '#f5f2ec', border: '1px solid var(--c-border)', borderRight: 'none', borderRadius: 'var(--r-md) 0 0 var(--r-md)', fontSize: 13, color: 'var(--c-text-muted)', whiteSpace: 'nowrap' }}>worklin.fr/</span>
                  <input
                    className="form-input"
                    style={{ borderRadius: '0 var(--r-md) var(--r-md) 0' }}
                    value={data.slug}
                    onChange={e => set('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                    placeholder="jean-dupont-plombier"
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Présentation</label>
                <textarea
                  className="form-input"
                  rows={3}
                  value={data.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Artisan plombier depuis 15 ans, spécialisé en rénovation salle de bain…"
                  style={{ resize: 'vertical' }}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ background: 'var(--c-bg)', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[
                { icon: '✅', t: 'Créer un devis en 2 minutes', d: 'Remplissez les lignes de prestation, le montant se calcule automatiquement.' },
                { icon: '📧', t: 'Envoyer par email', d: 'Le client reçoit directement un PDF professionnel.' },
                { icon: '🔄', t: 'Transformer en facture', d: 'Un clic pour convertir un devis accepté en facture.' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 20 }}>{item.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--c-text)', fontFamily: 'var(--font-head)', marginBottom: 2 }}>{item.t}</div>
                    <div style={{ fontSize: 12, color: 'var(--c-text-muted)', lineHeight: 1.4 }}>{item.d}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {step === 4 && (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--c-success-soft)', margin: '0 auto 16px', display: 'grid', placeItems: 'center' }}>
                <CheckCircle size={40} style={{ color: 'var(--c-success)' }} />
              </div>
              <p style={{ fontSize: 14, color: 'var(--c-text-muted)', lineHeight: 1.6 }}>
                Votre compte est configuré. Explorez votre tableau de bord, créez votre premier devis ou activez votre vitrine publique.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 32px 28px', display: 'flex', gap: 12, justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Step dots */}
          <div style={{ display: 'flex', gap: 6 }}>
            {STEPS.map((_, i) => (
              <div key={i} style={{ width: i === step ? 20 : 8, height: 8, borderRadius: 4, background: i <= step ? 'var(--c-accent)' : '#e5e0d8', transition: 'all 0.3s' }} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button onClick={() => setStep(s => s - 1)} className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronLeft size={16} /> Retour
              </button>
            )}
            <button onClick={handleNext} className="btn btn-primary" disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {saving ? <span className="waitlist-spinner" /> : null}
              {isLast ? 'Commencer' : 'Continuer'}
              {!isLast && <ChevronRight size={16} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
