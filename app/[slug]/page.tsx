import { createAdminClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Star, MapPin, Phone, Mail, Shield, Send, ChevronRight } from 'lucide-react'
import type { Metadata } from 'next'
import VitrineContactForm from './VitrineContactForm'

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('artisans').select('*, profiles(nom, prenom)').eq('slug', params.slug).single()
  if (!data) return {}
  const name = data.profiles?.prenom ? `${data.profiles.prenom} ${data.profiles.nom}` : data.metier
  return {
    title: `${name} — ${data.metier} à ${data.ville || 'France'} | Worklin`,
    description: data.description || `${name}, ${data.metier} professionnel. Demandez un devis gratuit.`,
  }
}

export default async function VitrinePage({ params }: { params: { slug: string } }) {
  const supabase = createAdminClient()
  const { data: artisan } = await supabase
    .from('artisans')
    .select('*, profiles(nom, prenom, phone, email, avatar_url)')
    .eq('slug', params.slug)
    .single()

  if (!artisan) notFound()

  const { data: avis } = await supabase
    .from('avis')
    .select('*')
    .eq('artisan_id', artisan.id)
    .order('created_at', { ascending: false })
    .limit(6)

  const name = artisan.profiles?.prenom
    ? `${artisan.profiles.prenom} ${artisan.profiles.nom}`
    : artisan.entreprise || artisan.metier

  const initials = artisan.profiles?.prenom
    ? `${artisan.profiles.prenom[0]}${artisan.profiles.nom?.[0] || ''}`.toUpperCase()
    : artisan.metier[0].toUpperCase()

  const certifs: string[] = artisan.certifications
    ? Object.entries(artisan.certifications).filter(([, v]) => v).map(([k]) => k)
    : []

  return (
    <div className="min-h-screen bg-cream-200">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-cream-200/90 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 bg-navy-800 rounded-lg grid place-items-center">
              <span className="text-white font-black text-xs">W</span>
            </div>
            <span className="font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Worklin</span>
          </a>
          <a href="#contact" className="btn btn-terra btn-sm no-underline">
            Demander un devis <ChevronRight size={14} />
          </a>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">
          {/* Left col */}
          <div className="lg:col-span-2 space-y-8">
            {/* Hero card */}
            <div className="card p-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 rounded-2xl bg-navy-800 grid place-items-center text-white font-black text-2xl flex-shrink-0" style={{ fontFamily: 'var(--font-manrope)' }}>
                  {initials}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-terra-600 uppercase tracking-wider mb-1">{artisan.metier}</div>
                  <h1 className="text-3xl font-black text-navy-800 mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>{name}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-navy-500">
                    {artisan.ville && (
                      <span className="flex items-center gap-1.5">
                        <MapPin size={14} /> {artisan.ville}
                      </span>
                    )}
                    {artisan.note_moyenne && (
                      <span className="flex items-center gap-1.5">
                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                        <span className="font-semibold text-navy-800">{artisan.note_moyenne.toFixed(1)}</span>
                        <span>({artisan.nb_avis} avis)</span>
                      </span>
                    )}
                  </div>
                  {certifs.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {certifs.map(c => (
                        <span key={c} className="inline-flex items-center gap-1 bg-green-50 text-green-700 border border-green-200 text-xs font-bold px-3 py-1 rounded-full">
                          <Shield size={11} /> {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* À propos */}
            {artisan.description && (
              <div className="card p-8">
                <h2 className="text-xl font-bold text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>À propos</h2>
                <p className="text-navy-600 leading-relaxed">{artisan.description}</p>
              </div>
            )}

            {/* Infos contact */}
            <div className="card p-8">
              <h2 className="text-xl font-bold text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Coordonnées</h2>
              <div className="space-y-3">
                {artisan.profiles?.phone && (
                  <a href={`tel:${artisan.profiles.phone}`} className="flex items-center gap-3 text-navy-700 hover:text-terra-600 no-underline transition-colors">
                    <div className="w-9 h-9 bg-cream-200 rounded-xl grid place-items-center">
                      <Phone size={16} />
                    </div>
                    {artisan.profiles.phone}
                  </a>
                )}
                {artisan.profiles?.email && (
                  <a href={`mailto:${artisan.profiles.email}`} className="flex items-center gap-3 text-navy-700 hover:text-terra-600 no-underline transition-colors">
                    <div className="w-9 h-9 bg-cream-200 rounded-xl grid place-items-center">
                      <Mail size={16} />
                    </div>
                    {artisan.profiles.email}
                  </a>
                )}
                {artisan.siret && (
                  <div className="flex items-center gap-3 text-navy-500 text-sm">
                    <div className="w-9 h-9 bg-cream-200 rounded-xl grid place-items-center">
                      <Shield size={16} />
                    </div>
                    SIRET : {artisan.siret}
                  </div>
                )}
              </div>
            </div>

            {/* Avis */}
            {(avis?.length ?? 0) > 0 && (
              <div className="card p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Avis clients</h2>
                  {artisan.note_moyenne && (
                    <div className="flex items-center gap-2">
                      <span className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{artisan.note_moyenne.toFixed(1)}</span>
                      <div className="flex gap-0.5">
                        {[1,2,3,4,5].map(s => (
                          <Star key={s} size={14} className={s <= Math.round(artisan.note_moyenne!) ? 'text-yellow-400 fill-yellow-400' : 'text-cream-400'} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  {avis!.map(a => (
                    <div key={a.id} className="border-b border-cream-300 last:border-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-sm text-navy-800">{a.client_nom}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => <Star key={s} size={12} className={s <= a.note ? 'text-yellow-400 fill-yellow-400' : 'text-cream-400'} />)}
                        </div>
                      </div>
                      {a.commentaire && <p className="text-sm text-navy-600 leading-relaxed">{a.commentaire}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right col — Contact form */}
          <div id="contact" className="lg:sticky lg:top-20">
            <VitrineContactForm artisanId={artisan.id} artisanName={name} />
          </div>
        </div>
      </div>

      {/* Footer mini */}
      <footer className="border-t border-cream-300 mt-16 py-8 text-center text-sm text-navy-400">
        <a href="/" className="no-underline">
          Vitrine propulsée par <span className="font-bold text-navy-600">Worklin</span>
        </a>
        {' · '}
        <a href="/register" className="text-terra-600 font-semibold no-underline hover:underline">Créer votre vitrine gratuite</a>
      </footer>
    </div>
  )
}
