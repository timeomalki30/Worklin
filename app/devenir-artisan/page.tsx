'use client'
import Link from 'next/link'
import { useState } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'

const METIERS = ['Plombier-chauffagiste', 'Électricien', 'Maçon', 'Ébéniste', 'Menuisier', 'Tapissier', 'Ferronnier', 'Peintre', 'Carreleur', 'Autre']
const CERTIFS = ['RGE (Reconnu Garant Environnement)', 'Qualibat', 'Qualifelec', 'Décennale', 'QualiPAC', 'RGE Qualibois', 'Qualigaz']

export default function DevenirArtisanPage() {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState<{ prenom: string; phone: string } | null>(null)
  const [error, setError] = useState('')
  const [certifs, setCertifs] = useState<string[]>([])

  const toggleCertif = (c: string) => setCertifs(prev => prev.includes(c) ? prev.filter(x => x !== c) : [...prev, c])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const fd = new FormData(form)
    const data = Object.fromEntries(fd.entries()) as Record<string, string>
    data.certifs = certifs.join(', ')

    if (!data.prenom) return setError('Prénom requis')
    if (!data.nom) return setError('Nom requis')
    if (!data.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)) return setError('Email invalide')
    if (!data.siret.replace(/\s/g, '').match(/^\d{14}$/)) return setError('SIRET invalide (14 chiffres)')
    if (!data.metier) return setError('Métier requis')

    setLoading(true)
    try {
      const res = await fetch('/api/artisan-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (res.ok) {
        setSuccess({ prenom: data.prenom, phone: data.phone })
        form.reset()
        setCertifs([])
      } else {
        const d = await res.json()
        setError(d.error || 'Erreur lors de l\'envoi. Réessayez.')
      }
    } catch {
      setError('Erreur réseau, réessayez.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <header className="nav" id="nav">
        <div className="container nav-inner">
          <Link href="/" className="logo"><span className="logo-mark"><span>A</span></span>Worklin</Link>
          <nav><ul className="nav-links">
            <li><Link href="/#categories">Métiers</Link></li>
            <li><Link href="/#how">Comment ça marche</Link></li>
            <li><Link href="/recherche">Trouver un artisan</Link></li>
          </ul></nav>
          <div className="nav-actions">
            <Link href="/dashboard/artisan" className="btn btn-ghost btn-sm">Voir la démo</Link>
            <Link href="#inscription" className="btn btn-primary btn-sm">
              M&apos;inscrire gratuitement
              <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </Link>
          </div>
        </div>
      </header>

      {/* HERO PIONNIERS */}
      <section style={{ padding: 'var(--s-9) 0 var(--s-11)', position: 'relative', overflow: 'hidden', background: 'linear-gradient(180deg, var(--c-bg) 0%, var(--c-surface-warm) 100%)' }}>
        <div className="hero-bg"><div className="hero-orb orb-1"></div><div className="hero-orb orb-2"></div></div>
        <div className="container" style={{ position: 'relative', zIndex: 2, maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', background: 'var(--c-accent)', color: 'white', borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-xs)', fontWeight: 700, letterSpacing: '0.04em', boxShadow: '0 4px 14px rgba(221, 90, 42, 0.25)', marginBottom: 24, fontFamily: 'var(--font-head)' }}>
            ✨ Lancement · Offre Pionniers
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 76px)', letterSpacing: '-0.04em', fontWeight: 800, lineHeight: 0.98, marginBottom: 20 }}>
            Devenez l&apos;un des <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--c-accent)' }}>50 premiers</span> artisans<br/>
            Worklin. <span style={{ position: 'relative', color: 'var(--c-text-muted)', display: 'inline-block' }}>8 % commission.</span> Gratuit à vie.
          </h1>
          <p className="lead" style={{ margin: '0 auto 32px' }}>
            Worklin amène les clients, Kantoo gère vos devis, signatures et paiements (conforme à la réforme facturation électronique 2027). Pour les 50 premiers artisans : tout est offert.
          </p>
          <Link href="#inscription" className="btn btn-primary btn-lg">
            M&apos;inscrire en 2 minutes
            <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </Link>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', background: 'var(--c-accent-soft)', color: 'var(--c-accent)', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-head)', marginTop: 16 }}>
            <span style={{ background: 'var(--c-accent)', color: 'white', padding: '2px 10px', borderRadius: 'var(--r-pill)' }}>0</span>
            sur 50 places · Paris &amp; Île-de-France · Soyez le premier
          </div>
        </div>
      </section>

      {/* BÉNÉFICES */}
      <section style={{ padding: 'var(--s-10) 0', background: 'var(--c-bg-deep)', borderTop: '1px solid var(--c-border)', borderBottom: '1px solid var(--c-border)' }}>
        <div className="container">
          <div className="section-header">
            <span className="eyebrow">Ce que vous obtenez</span>
            <h2>4 avantages réservés <span className="serif">aux Pionniers</span></h2>
            <p>L&apos;offre Pionniers est sans engagement, sans CB demandée, sans clause cachée. Vous restez libre à 100 %.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginTop: 48 }}>
            {[
              { title: '0 % de commission', text: 'Aucun pourcentage prélevé sur vos prestations pendant les 6 premiers mois. Vous gardez 100 % de ce que vous facturez via Worklin.', value: 'Économisé : ~480 € sur 6 mois', icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/> },
              { title: 'Kantoo Pro inclus 1 an', text: 'Devis en 2 min, signature électronique eIDAS, factures auto, paiements Stripe sous 48 h. La suite complète, gratuite pendant 12 mois.', value: 'Économisé : 588 €', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8"/></>, accent: true },
              { title: 'Position prioritaire à vie', text: 'Vous apparaissez dans le top 3 des résultats pour votre métier dans votre arrondissement, à vie. Visibilité maximale, garantie pour les Pionniers.', value: 'Avantage permanent', icon: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/> },
            ].map((b, i) => (
              <div key={i} style={{ background: b.accent ? 'linear-gradient(135deg, var(--c-primary) 0%, #15375E 100%)' : 'var(--c-surface)', border: b.accent ? 'none' : '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: '28px 24px', transition: 'all var(--transition)' }}>
                <div style={{ width: 56, height: 56, borderRadius: 'var(--r-md)', background: b.accent ? 'rgba(255,255,255,0.1)' : 'var(--c-accent-soft)', color: b.accent ? 'var(--c-accent)' : 'var(--c-accent)', display: 'grid', placeItems: 'center', marginBottom: 20 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 28, height: 28 }}>{b.icon}</svg>
                </div>
                <h3 style={{ fontSize: 'var(--fs-xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12, color: b.accent ? 'white' : 'var(--c-text)' }}>{b.title}</h3>
                <p style={{ color: b.accent ? 'rgba(255,255,255,0.78)' : 'var(--c-text-soft)', lineHeight: 1.55 }}>{b.text}</p>
                <div style={{ display: 'inline-block', marginTop: 16, fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--c-accent)', fontSize: 'var(--fs-md)' }}>{b.value}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULAIRE */}
      <section id="inscription" style={{ padding: 'var(--s-10) 0', background: 'var(--c-surface-warm)', borderTop: '1px solid var(--c-border)' }}>
        <div className="container">
          <div style={{ maxWidth: 720, margin: '0 auto', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-xl)', padding: '48px 48px', boxShadow: 'var(--shadow-md)' }}>
            {success ? (
              <div style={{ textAlign: 'center', padding: '32px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'var(--c-success)', color: 'white', display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 40, height: 40 }}><path d="M5 13l4 4L19 7"/></svg>
                </div>
                <h3 style={{ fontSize: 'var(--fs-2xl)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 12 }}>{success.prenom}, votre candidature est reçue !</h3>
                <p style={{ color: 'var(--c-text-soft)', marginBottom: 16 }}>On vous rappelle sous 48 h au {success.phone}. On vérifie votre SIRET et vos certifs ensemble, et on vous met en ligne dans la foulée si tout est OK.</p>
                <p style={{ fontSize: 13, color: 'var(--c-text-muted)', marginBottom: 20 }}>En attendant notre appel, créez votre compte pour accéder à votre tableau de bord en avant-première.</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Link href="/register" className="btn btn-primary">Créer mon compte gratuit →</Link>
                  <Link href="/" className="btn btn-ghost">Retour à l&apos;accueil</Link>
                </div>
              </div>
            ) : (
              <>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                  <h2 style={{ fontSize: 'var(--fs-3xl)', fontWeight: 800, letterSpacing: '-0.025em', marginBottom: 12 }}>Candidature Pionniers</h2>
                  <p style={{ color: 'var(--c-text-soft)' }}>11 champs · 2 minutes · Sans engagement</p>
                </div>
                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 'var(--r-md)', background: '#FEF2F2', color: '#B91C1C', marginBottom: 20, fontSize: 14 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18, flexShrink: 0 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                    {error}
                  </div>
                )}
                <form id="artisanForm" onSubmit={handleSubmit} noValidate>
                  {/* Identité */}
                  <div style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--c-accent)', marginTop: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Votre identité
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div className="form-group"><label>Prénom *</label><input name="prenom" id="aPrenom" type="text" required /></div>
                    <div className="form-group"><label>Nom *</label><input name="nom" id="aNom" type="text" required /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div className="form-group"><label>Email *</label><input name="email" id="aEmail" type="email" required /></div>
                    <div className="form-group"><label>Téléphone *</label><input name="phone" id="aPhone" type="tel" placeholder="06 12 34 56 78" /></div>
                  </div>

                  {/* Entreprise */}
                  <div style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--c-accent)', marginTop: 8 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 13, height: 13 }}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                    Votre entreprise
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <div className="form-group"><label>Nom de l&apos;entreprise *</label><input name="entreprise" id="aEntreprise" type="text" required /></div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
                    <div className="form-group"><label>SIRET *</label><input name="siret" id="aSiret" type="text" placeholder="14 chiffres" maxLength={14} /></div>
                    <div className="form-group">
                      <label>Métier principal *</label>
                      <select name="metier" id="aMetier" required>
                        <option value="">Choisir…</option>
                        {METIERS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div className="form-group">
                      <label>Expérience</label>
                      <select name="experience" id="aExp">
                        <option value="">Ans d&apos;expérience</option>
                        <option>1-3 ans</option><option>3-5 ans</option><option>5-10 ans</option><option>10-20 ans</option><option>20+ ans</option>
                      </select>
                    </div>
                    <div className="form-group"><label>Code postal *</label><input name="codePostal" id="aCp" type="text" placeholder="75001" maxLength={5} /></div>
                    <div className="form-group"><label>Ville *</label><input name="ville" id="aVille" type="text" /></div>
                  </div>
                  <div style={{ marginBottom: 16 }}>
                    <div className="form-group">
                      <label>Rayon d&apos;intervention</label>
                      <select name="rayonKm" id="aRayon">
                        <option value="">Choisir…</option>
                        <option value="5">5 km</option><option value="10">10 km</option><option value="20">20 km</option><option value="30">30 km</option><option value="50">50+ km</option>
                      </select>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div style={{ marginBottom: 8, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--c-accent)', marginTop: 8 }}>
                    Certifications (optionnel)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 16 }}>
                    {CERTIFS.map(c => (
                      <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: certifs.includes(c) ? 'var(--c-accent-soft)' : 'var(--c-bg)', border: `1px solid ${certifs.includes(c) ? 'var(--c-accent)' : 'var(--c-border)'}`, borderRadius: 'var(--r-md)', cursor: 'pointer', fontSize: 13, color: certifs.includes(c) ? 'var(--c-accent)' : 'var(--c-text-soft)', fontWeight: certifs.includes(c) ? 600 : 400, transition: 'all var(--transition-fast)' }}>
                        <input type="checkbox" checked={certifs.includes(c)} onChange={() => toggleCertif(c)} style={{ accentColor: 'var(--c-accent)', width: 16, height: 16, flexShrink: 0 }} />
                        {c}
                      </label>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginBottom: 16 }}>
                    <label>Motivation (optionnel)</label>
                    <textarea name="motivation" id="aMotivation" rows={3} placeholder="Pourquoi rejoindre Worklin ? Quelle est votre spécialité ?" style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', background: 'var(--c-surface)', fontSize: 'var(--fs-base)', resize: 'vertical', minHeight: 80, outline: 'none' }} />
                  </div>

                  <button type="submit" className="btn btn-primary" style={{ width: '100%', height: 56, fontSize: 'var(--fs-md)' }} disabled={loading}>
                    {loading ? <span className="waitlist-spinner"></span> : null}
                    {loading ? 'Envoi en cours…' : 'Envoyer ma candidature Pionniers'}
                    {!loading && <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>}
                  </button>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 16, flexWrap: 'wrap', fontSize: 12, color: 'var(--c-text-muted)' }}>
                    {['Sans engagement', 'Sans CB demandée', 'Rappel sous 48 h'].map(t => (
                      <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 12, height: 12, color: 'var(--c-success)' }}><path d="M5 13l4 4L19 7"/></svg>
                        {t}
                      </span>
                    ))}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
