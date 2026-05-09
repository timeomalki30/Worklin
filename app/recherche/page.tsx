'use client'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import WaitlistBanner from '@/components/WaitlistBanner'
import { createClient } from '@/lib/supabase/client'
import type { Artisan } from '@/types'

function RechercheContent() {
  const router = useRouter()
  const params = useSearchParams()
  const [craft, setCraft] = useState(params.get('metier') || '')
  const [loc, setLoc] = useState(params.get('lieu') || '')
  const [artisans, setArtisans] = useState<Artisan[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchArtisans = async () => {
      const supabase = createClient()
      let query = supabase
        .from('artisans')
        .select('*, profiles(nom, prenom, avatar_url)')
        .eq('actif', true)

      const metier = params.get('metier')
      const lieu = params.get('lieu')
      if (metier) query = query.ilike('metier', `%${metier}%`)
      if (lieu) query = query.ilike('ville', `%${lieu}%`)

      const { data } = await query.limit(20)
      setArtisans(data || [])
      setLoading(false)
    }
    fetchArtisans()
  }, [params])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const p = new URLSearchParams()
    if (craft) p.set('metier', craft.toLowerCase())
    if (loc) p.set('lieu', loc)
    router.push('/recherche' + (p.toString() ? '?' + p : ''))
  }

  return (
    <>
      <WaitlistBanner />
      <Nav />

      {/* Search toolbar */}
      <div className="search-toolbar">
        <form className="toolbar-search" onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 'var(--container)', margin: '0 auto', padding: '0 24px', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-pill)', maxWidth: 320 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--c-text-muted)', flexShrink: 0 }}><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
            <input type="text" placeholder="Métier (plombier, ébéniste…)" value={craft} onChange={e => setCraft(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--fs-sm)', fontWeight: 500, minWidth: 0 }} />
          </div>
          <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-pill)', maxWidth: 320 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18, color: 'var(--c-text-muted)', flexShrink: 0 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            <input type="text" placeholder="Code postal ou ville" value={loc} onChange={e => setLoc(e.target.value)} style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 'var(--fs-sm)', fontWeight: 500, minWidth: 0 }} />
          </div>
          <button className="btn btn-primary btn-sm" type="submit" style={{ marginLeft: 'auto' }}>
            Rechercher
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </form>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '96px 24px', color: 'var(--c-text-muted)' }}>Chargement…</div>
      ) : artisans.length === 0 ? (
        /* État lancement */
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '64px 24px 128px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '7px 16px', background: 'var(--c-accent-soft)', color: 'var(--c-accent)', borderRadius: 'var(--r-pill)', fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-head)', marginBottom: 24 }}>
            <span style={{ width: 8, height: 8, background: 'var(--c-accent)', borderRadius: '50%', position: 'relative' }}></span>
            Lancement en cours
          </div>
          <h1 style={{ fontSize: 'clamp(36px, 5vw, 56px)', letterSpacing: '-0.03em', fontWeight: 800, lineHeight: 1.05, marginBottom: 20 }}>
            Worklin arrive <span className="accent" style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontWeight: 400, color: 'var(--c-accent)' }}>bientôt</span><br/>dans votre quartier.
          </h1>
          <p className="lead" style={{ margin: '0 auto 32px' }}>
            Nous sélectionnons en ce moment les premiers artisans Pionniers — plombiers, électriciens, ébénistes, tapissiers — pour vous proposer un service de qualité dès le lancement. Inscrivez-vous pour être prévenu en premier.
          </p>
          <div style={{ display: 'inline-flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} className="btn btn-primary btn-lg">
              S&apos;inscrire à la liste d&apos;attente
              <svg className="arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
            <Link href="/" className="btn btn-ghost btn-lg">Retour à l&apos;accueil</Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, maxWidth: 720, margin: '64px auto 0' }}>
            {[
              { n: '01', t: 'Inscrivez-vous', p: 'Email, code postal et coordonnées. On vous prévient dès qu\'un artisan de votre métier ouvre sa zone.' },
              { n: '02', t: 'Première vague', p: 'Les premiers artisans Pionniers sont en cours de validation. Mise en ligne progressive courant mai.' },
              { n: '03', t: 'Réservation directe', p: 'Quand l\'artisan est en ligne, vous réservez en 2 minutes en choisissant un créneau dans son agenda.' },
            ].map((c, i) => (
              <div key={i} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: 20, textAlign: 'left' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 36, color: 'var(--c-accent)', lineHeight: 1, marginBottom: 12 }}>{c.n}</div>
                <h3 style={{ fontSize: 'var(--fs-md)', fontWeight: 700, marginBottom: 8 }}>{c.t}</h3>
                <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.5 }}>{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Liste artisans */
        <div className="container" style={{ padding: '48px 24px' }}>
          <div style={{ marginBottom: 24, color: 'var(--c-text-soft)' }}>{artisans.length} artisan{artisans.length > 1 ? 's' : ''} trouvé{artisans.length > 1 ? 's' : ''}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {artisans.map(a => (
              <Link key={a.id} href={a.slug ? `/${a.slug}` : `/artisan/${a.id}`} style={{ display: 'flex', alignItems: 'center', gap: 20, background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: 20, transition: 'all var(--transition)', textDecoration: 'none', color: 'inherit' }}>
                <div style={{ width: 64, height: 64, borderRadius: 'var(--r-md)', background: 'var(--c-accent)', display: 'grid', placeItems: 'center', fontSize: 24, fontWeight: 800, color: 'white', fontFamily: 'var(--font-head)', flexShrink: 0 }}>
                  {(a.profiles?.prenom?.[0] || a.metier[0]).toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'var(--fs-md)' }}>
                    {a.profiles?.prenom} {a.profiles?.nom}
                  </div>
                  <div style={{ color: 'var(--c-accent)', fontSize: 'var(--fs-sm)', fontWeight: 600, textTransform: 'capitalize' }}>{a.metier}</div>
                  <div style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)', marginTop: 4 }}>{a.ville}</div>
                </div>
                {a.note_moyenne && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                    <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, color: 'var(--c-warning)' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                    <span style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-head)' }}>{a.note_moyenne.toFixed(1)}</span>
                    <span style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-xs)' }}>({a.nb_avis} avis)</span>
                  </div>
                )}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 20, height: 20, color: 'var(--c-text-muted)', flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
              </Link>
            ))}
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

export default function RecherchePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement…</div>}>
      <RechercheContent />
    </Suspense>
  )
}
