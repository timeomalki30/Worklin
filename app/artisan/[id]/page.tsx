'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import type { Artisan, Avis, Disponibilite } from '@/types'
import dynamic from 'next/dynamic'

const BookingCalendar = dynamic(() => import('@/components/BookingCalendar'), { ssr: false })

export default function ArtisanProfilePage() {
  const { id } = useParams<{ id: string }>()
  const [artisan, setArtisan] = useState<Artisan | null>(null)
  const [avis, setAvis] = useState<Avis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: a } = await supabase
        .from('artisans')
        .select('*, profiles(nom, prenom, avatar_url, phone)')
        .eq('id', id)
        .single()
      setArtisan(a)

      const { data: reviews } = await supabase
        .from('avis')
        .select('*, profiles(nom, prenom)')
        .eq('artisan_id', id)
        .order('created_at', { ascending: false })
        .limit(5)
      setAvis(reviews || [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Chargement…</div>
  if (!artisan) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Artisan introuvable.</div>

  const initiales = ((artisan.profiles?.prenom?.[0] || '') + (artisan.profiles?.nom?.[0] || '')).toUpperCase() || artisan.metier[0].toUpperCase()
  const certifs: string[] = artisan.certifications ? Object.entries(artisan.certifications).filter(([, v]) => v).map(([k]) => k) : []

  return (
    <>
      <Nav />

      {/* HERO */}
      <section className="artisan-profile-hero">
        <div className="container artisan-profile-inner">
          <div className="artisan-avatar-lg">{initiales}</div>
          <div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 'var(--fs-sm)', marginBottom: 8, textTransform: 'capitalize', fontWeight: 600 }}>{artisan.metier}</div>
            <h1 className="artisan-profile-name">{artisan.profiles?.prenom} {artisan.profiles?.nom}</h1>
            <div className="artisan-profile-meta">
              {artisan.ville && <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 1 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>{artisan.ville}</span>}
              {artisan.note_moyenne && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <svg viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16, color: 'var(--c-warning)' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                  {artisan.note_moyenne.toFixed(1)} ({artisan.nb_avis} avis)
                </span>
              )}
            </div>
            {certifs.length > 0 && (
              <div className="artisan-certifs">
                {certifs.map(c => <span key={c} className="certif-badge">{c}</span>)}
              </div>
            )}
          </div>
          <div>
            <a href="#booking" className="btn btn-primary btn-lg">
              Réserver un créneau
              <svg className="arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
            </a>
          </div>
        </div>
      </section>

      <div className="container" style={{ paddingTop: 64, paddingBottom: 96, display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' }}>
        {/* Gauche */}
        <div>
          {/* À propos */}
          {artisan.description && (
            <section style={{ padding: 0, marginBottom: 48 }}>
              <h2 style={{ fontSize: 'var(--fs-2xl)', marginBottom: 16 }}>À propos</h2>
              <p style={{ lineHeight: 1.7, fontSize: 'var(--fs-md)' }}>{artisan.description}</p>
            </section>
          )}

          {/* Avis */}
          <section style={{ padding: 0, marginBottom: 48 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: 'var(--fs-2xl)' }}>Avis clients</h2>
              {artisan.note_moyenne && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 'var(--fs-3xl)', fontWeight: 800, fontFamily: 'var(--font-head)', letterSpacing: '-0.03em' }}>{artisan.note_moyenne.toFixed(1)}</span>
                  <div>
                    <div style={{ display: 'flex', gap: 2 }}>
                      {[1,2,3,4,5].map(s => (
                        <svg key={s} viewBox="0 0 24 24" fill="currentColor" style={{ width: 18, height: 18, color: s <= Math.round(artisan.note_moyenne!) ? 'var(--c-warning)' : 'var(--c-border)' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      ))}
                    </div>
                    <div style={{ fontSize: 'var(--fs-xs)', color: 'var(--c-text-muted)' }}>{artisan.nb_avis} avis</div>
                  </div>
                </div>
              )}
            </div>
            {avis.length === 0 ? (
              <p style={{ color: 'var(--c-text-muted)' }}>Pas encore d&apos;avis. Soyez le premier à laisser un commentaire après votre prestation !</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {avis.map(a => (
                  <div key={a.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--c-border)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-head)' }}>
                        {a.profiles?.prenom} {a.profiles?.nom?.[0]}.
                      </div>
                      <div style={{ display: 'flex', gap: 2 }}>
                        {[1,2,3,4,5].map(s => (
                          <svg key={s} viewBox="0 0 24 24" fill="currentColor" style={{ width: 14, height: 14, color: s <= a.note ? 'var(--c-warning)' : 'var(--c-border)' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                        ))}
                      </div>
                    </div>
                    {a.commentaire && <p style={{ fontSize: 'var(--fs-sm)', lineHeight: 1.55 }}>{a.commentaire}</p>}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Droite — Booking */}
        <div id="booking" style={{ position: 'sticky', top: 24 }}>
          <BookingCalendar artisanId={id} artisanName={`${artisan.profiles?.prenom} ${artisan.profiles?.nom}`} />
        </div>
      </div>

      <Footer />
    </>
  )
}
