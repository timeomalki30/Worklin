'use client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WaitlistBanner from '@/components/WaitlistBanner'

export default function HomePage() {
  const router = useRouter()
  const [craft, setCraft] = useState('')
  const [loc, setLoc] = useState('')
  const [scrolled, setScrolled] = useState(false)
  const [stickyCta, setStickyCta] = useState(false)

  useEffect(() => {
    let lastY = 0
    const onScroll = () => {
      const y = window.scrollY
      setScrolled(y > 8)
      setStickyCta(y > 700 && y > lastY)
      lastY = y
    }
    window.addEventListener('scroll', onScroll)

    // Scroll reveal
    const reveals = document.querySelectorAll('.reveal')
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target) } })
    }, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' })
    reveals.forEach(r => io.observe(r))

    return () => { window.removeEventListener('scroll', onScroll); io.disconnect() }
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (craft) params.set('metier', craft.toLowerCase())
    if (loc) params.set('lieu', loc)
    router.push('/recherche' + (params.toString() ? '?' + params : ''))
  }

  return (
    <>
      <WaitlistBanner />
      <Nav />

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb orb-1"></div>
          <div className="hero-orb orb-2"></div>
          <div className="hero-orb orb-3"></div>
        </div>
        <div className="container hero-inner">
          <div className="hero-eyebrow reveal">
            <span className="dot"></span>
            Lancement à Paris — Inscrivez-vous pour être prévenu en premier
          </div>
          <h1 className="reveal delay-1">
            L&apos;artisan qu&apos;il vous faut,<br/>
            <span className="accent">disponible</span> quand vous voulez.
          </h1>
          <p className="lead reveal delay-2">
            Plombiers, électriciens, ébénistes, tapissiers, ferronniers… Réservez en ligne en 2 minutes. Sans appels en boucle, sans devis qui traînent, sans surprises.
          </p>
          <form className="search-bar reveal delay-3" onSubmit={handleSearch} role="search">
            <label className="search-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
              <div className="search-field-content">
                <span className="search-field-label">Métier</span>
                <input type="text" placeholder="Plombier, ébéniste…" value={craft} onChange={e => setCraft(e.target.value)} autoComplete="off" />
              </div>
            </label>
            <span className="search-field-divider"></span>
            <label className="search-field">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              <div className="search-field-content">
                <span className="search-field-label">Où</span>
                <input type="text" placeholder="Code postal ou ville" value={loc} onChange={e => setLoc(e.target.value)} autoComplete="off" />
              </div>
            </label>
            <button className="btn btn-primary" type="submit">
              Rechercher
              <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </button>
          </form>
        </div>
      </section>

      {/* BENTO CATEGORIES */}
      <section id="categories">
        <div className="container">
          <div className="section-header reveal">
            <span className="eyebrow">Tous les métiers</span>
            <h2>Du dépannage urgent <span className="serif">au sur-mesure d&apos;exception</span></h2>
            <p>Que vous ayez besoin d&apos;une fuite réparée ce soir ou d&apos;un meuble restauré dans les règles de l&apos;art, nos artisans certifiés vous répondent.</p>
          </div>
          <div className="bento reveal delay-1">
            <Link href="/recherche?metier=plombier" className="bento-card featured">
              <div>
                <div className="bento-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v6M12 14v8M5 8h14M5 14h14"/><circle cx="12" cy="11" r="3"/></svg>
                </div>
              </div>
              <div>
                <div className="bento-craft">Le plus demandé</div>
                <h3>Plombier-chauffagiste</h3>
                <div className="bento-count">Dépannage urgent · entretien · installation</div>
              </div>
              <div className="bento-arrow">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
              </div>
            </Link>
            {[
              { slug: 'electricien', cat: 'Bâtiment', name: 'Électricien', sub: 'Installation · mise aux normes · Qualifelec', icon: <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/> },
              { slug: 'macon', cat: 'Bâtiment', name: 'Maçon', sub: 'Gros œuvre · rénovation', icon: <><rect x="3" y="6" width="18" height="14" rx="1"/><path d="M3 11h18M9 6V3M15 6V3M9 16h6"/></> },
              { slug: 'ebeniste', cat: 'Métier d\'art', name: 'Ébéniste', sub: 'Sur-mesure · restauration', icon: <><rect x="3" y="6" width="18" height="14" rx="2"/><path d="M3 10h18M8 6V3M16 6V3"/></>, accent: true },
              { slug: 'menuisier', cat: 'Bâtiment', name: 'Menuisier', sub: 'Pose · sur-mesure · agencement', icon: <path d="M3 21h18M5 21V8l7-5 7 5v13M9 9h6v12H9z"/> },
              { slug: 'tapissier', cat: 'Métier d\'art', name: 'Tapissier', sub: 'Garnissage · restauration', icon: <><path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M2 11l2-6h16l2 6M12 5v6"/></> },
              { slug: 'ferronnier', cat: 'Métier d\'art', name: 'Ferronnier', sub: 'Forge · métallerie d\'art', icon: <><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18"/></> },
            ].map(m => (
              <Link key={m.slug} href={`/recherche?metier=${m.slug}`} className={`bento-card${m.accent ? ' accent' : ''}`}>
                <div className="bento-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{m.icon}</svg></div>
                <div>
                  <div className="bento-craft">{m.cat}</div>
                  <h3>{m.name}</h3>
                  <div className="bento-count">{m.sub}</div>
                </div>
                <div className="bento-arrow">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* COMMENT ÇA MARCHE */}
      <section className="steps" id="how">
        <div className="container">
          <div className="section-header reveal">
            <span className="eyebrow">En 3 étapes</span>
            <h2>Trois étapes. Deux minutes. <span className="serif">Zéro appel.</span></h2>
            <p>Aussi simple que de réserver une table au restaurant. Plus jamais de standard téléphonique, de relances ou de devis qui traînent une semaine.</p>
          </div>
          <div className="steps-grid">
            {[
              { n: '01', t: 'Décrivez votre besoin', p: 'Métier, type de prestation, votre adresse. Pour une urgence, on filtre les artisans dispo dans l\'heure.' },
              { n: '02', t: 'Comparez et choisissez', p: 'Disponibilités, avis vérifiés, certifications, tarifs indicatifs. Tout est visible sur une seule page.' },
              { n: '03', t: 'Réservez en ligne', p: 'Confirmation immédiate par SMS. Paiement sécurisé après prestation. Litige ? Notre équipe intervient sous 24 h.' },
            ].map((s, i) => (
              <div key={i} className={`step reveal delay-${i + 1}`}>
                <div className="step-num">{s.n}</div>
                <h3>{s.t}</h3>
                <p>{s.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA ARTISAN */}
      <section id="artisans" style={{ paddingBottom: 0 }}>
        <div className="artisan-cta reveal">
          <div className="artisan-cta-grid">
            <div>
              <span className="eyebrow" style={{ color: 'var(--c-accent)' }}>✨ Lancement · 50 places Pionniers</span>
              <h2 style={{ margin: '16px 0 0' }}>Artisan ? Rejoignez les 50 Pionniers. <span className="serif">Gratuit à vie.</span></h2>
              <p className="lead">
                Worklin remplace votre standard téléphonique, Kantoo Pro gère devis et factures (conforme réforme 2027). Pour les 50 premiers : 0 % commission 6 mois, Kantoo Pro inclus 1 an, position prioritaire à vie.
              </p>
              <ul className="benefits">
                {[
                  { t: 'Agenda synchronisé', s: 'Avec Google Calendar et Outlook' },
                  { t: 'Devis et factures auto', s: 'Plus jamais de paperasse en fin de journée' },
                  { t: 'Paiement sécurisé', s: 'Encaissement garanti sous 48 h' },
                  { t: 'Gratuit pendant 30 jours', s: 'Sans engagement, sans CB demandée' },
                ].map((b, i) => (
                  <li key={i}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 13l4 4L19 7"/></svg>
                    <div><strong>{b.t}</strong><p>{b.s}</p></div>
                  </li>
                ))}
              </ul>
              <div className="artisan-cta-actions">
                <Link href="/devenir-artisan" className="btn btn-primary btn-lg">
                  Devenir Pionnier — Gratuit
                  <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
                </Link>
                <Link href="/dashboard/artisan" className="btn btn-ghost btn-lg">Voir le tableau de bord</Link>
              </div>
            </div>

            <div className="dashboard-mock" aria-hidden="true">
              <div className="dashboard-mock-header">
                <div>
                  <div className="dashboard-mock-title">Aujourd&apos;hui · 6 RDV</div>
                  <small>Mardi 5 mai</small>
                </div>
                <span className="dashboard-mock-badge"><span className="dot"></span>En ligne</span>
              </div>
              {[
                { t: '09:00', c: 'M. Dupont', j: 'Remplacement chauffe-eau' },
                { t: '11:30', c: 'Mme Lefèvre', j: 'Diagnostic fuite cuisine' },
                { t: '14:00', c: 'Boulangerie Martin', j: 'Maintenance plomberie pro' },
              ].map((a, i) => (
                <div key={i} className="appt">
                  <div className="appt-time">{a.t}</div>
                  <div className="appt-info">
                    <div className="appt-client">{a.c}</div>
                    <div className="appt-job">{a.j}</div>
                  </div>
                  <div className="appt-status"></div>
                </div>
              ))}
              <div className="appt" style={{ background: 'var(--c-accent-soft)' }}>
                <div className="appt-time" style={{ color: 'var(--c-accent)' }}>16:30</div>
                <div className="appt-info">
                  <div className="appt-client">Nouvelle demande</div>
                  <div className="appt-job">Installation lave-vaisselle · 89 €</div>
                </div>
                <div className="appt-status" style={{ background: 'var(--c-accent)' }}></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      {/* Sticky CTA */}
      <div className={`sticky-cta${stickyCta ? ' visible' : ''}`}>
        <div className="sticky-cta-text">
          <strong>Besoin d&apos;un artisan maintenant ?</strong>
          Réservation en 2 minutes
        </div>
        <Link href="/recherche" className="btn btn-primary">
          Trouver un artisan
          <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
        </Link>
      </div>
    </>
  )
}
