'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Wrench, User, CheckCircle2 } from 'lucide-react'
import { generateSlug } from '@/lib/utils'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [role, setRole] = useState<'artisan' | 'client'>('artisan')
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ prenom: '', nom: '', email: '', password: '', metier: '', ville: '' })

  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (step === 1 && role === 'artisan') { setStep(2); return }
    setError('')
    setLoading(true)
    const supabase = createClient()

    // 1. Sign up
    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { role, prenom: form.prenom, nom: form.nom } },
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    const user = authData.user
    if (!user) { setLoading(false); return }

    // 2. If email confirmation required, session won't exist yet — sign in explicitly
    if (!authData.session) {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: form.email,
        password: form.password,
      })
      if (signInErr) {
        // Email confirmation required — show friendly message
        setError('Inscription réussie ! Vérifiez votre email pour confirmer votre compte, puis connectez-vous.')
        setLoading(false)
        return
      }
    }

    // 3. Create / update profile with explicit role (lowercase, always 'artisan' or 'client')
    const profileRole: 'artisan' | 'client' = role  // typed to prevent accidental casing
    const { error: profileErr } = await supabase
      .from('profiles')
      .upsert({ id: user.id, email: form.email, prenom: form.prenom, nom: form.nom, role: profileRole })
    if (profileErr) console.error('Profile upsert error:', profileErr)

    // 4. Create artisan row
    if (profileRole === 'artisan') {
      const baseSlug = generateSlug(`${form.prenom}-${form.nom}`)
      const slug = `${baseSlug}-${Math.floor(Math.random() * 9000) + 1000}`
      const { error: artisanErr } = await supabase
        .from('artisans')
        .insert({ profile_id: user.id, slug, metier: form.metier || 'Artisan', ville: form.ville })
      if (artisanErr) console.error('Artisan insert error:', artisanErr)
    }

    // 5. Redirect based on the role chosen in the form (not from DB — avoids race condition)
    router.push(profileRole === 'artisan' ? '/dashboard/artisan' : '/dashboard/client')
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5F1E8' }}>

      {/* Left panel */}
      <div className="hidden md:flex md:w-[45%] bg-navy-800 relative overflow-hidden flex-col items-center justify-center p-14">
        <div className="animate-orb-1 absolute -top-20 -left-20 w-96 h-96 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(221,90,42,0.22) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="animate-orb-2 absolute -bottom-20 -right-10 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative z-10 max-w-xs text-center">
          <div className="w-16 h-16 bg-terra-500 rounded-2xl grid place-items-center mx-auto mb-8 shadow-glow">
            <span className="text-white font-black text-2xl" style={{ fontFamily: 'var(--font-manrope)' }}>W</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>
            Rejoignez 2 400+ artisans
          </h2>
          <p className="text-white/55 text-sm leading-relaxed mb-10">
            Gratuit pour démarrer. Aucune carte bancaire requise.
          </p>
          <div className="space-y-3 text-left">
            {[
              'Devis IA en 30 secondes',
              'Factures conformes 2027',
              'Vitrine publique incluse',
              'CRM clients intégré',
            ].map(item => (
              <div key={item} className="flex items-center gap-3 text-sm text-white/70">
                <CheckCircle2 size={16} className="text-terra-400 flex-shrink-0" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 no-underline mb-10 transition-colors">
            <ArrowLeft size={15} /> Retour
          </Link>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-navy-800 mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>
              {step === 1 ? 'Créer un compte' : 'Votre activité'}
            </h1>
            <p className="text-navy-500 text-sm">
              {step === 1 ? 'Essai gratuit · Sans carte bancaire' : 'Quelques infos pour personnaliser votre espace ✨'}
            </p>
          </div>

          {/* Step indicator */}
          {role === 'artisan' && (
            <div className="flex items-center gap-2 mb-8">
              {[1, 2].map(s => (
                <div key={s} className="flex items-center gap-2">
                  <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold transition-all ${
                    step >= s ? 'bg-terra-500 text-white' : 'bg-cream-300 text-navy-400'
                  }`}>{s}</div>
                  {s < 2 && <div className={`h-px w-8 transition-all ${step >= 2 ? 'bg-terra-500' : 'bg-cream-300'}`} />}
                </div>
              ))}
              <span className="text-xs text-navy-400 ml-2">{step === 1 ? 'Votre compte' : 'Votre métier'}</span>
            </div>
          )}

          {step === 1 && (
            <>
              {/* Role selector */}
              <div className="grid grid-cols-2 gap-3 mb-7">
                {([
                  ['artisan', 'Artisan', Wrench, 'Gérez votre activité'],
                  ['client',  'Client',  User,   'Trouvez un artisan'],
                ] as const).map(([val, label, Icon, sub]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRole(val as 'artisan' | 'client')}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${
                      role === val
                        ? 'border-navy-800 bg-navy-800/5 shadow-sm'
                        : 'border-cream-300 hover:border-navy-300 bg-white'
                    }`}
                  >
                    <div className={`mb-2 ${role === val ? 'text-navy-800' : 'text-navy-400'}`}>
                      <Icon size={20} />
                    </div>
                    <div className={`font-bold text-sm ${role === val ? 'text-navy-800' : 'text-navy-600'}`}>{label}</div>
                    <div className="text-xs text-navy-400 mt-0.5">{sub}</div>
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="form-label">Prénom</label>
                    <input className="form-input" value={form.prenom} onChange={e => set('prenom', e.target.value)} required placeholder="Jean" />
                  </div>
                  <div>
                    <label className="form-label">Nom</label>
                    <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} required placeholder="Dupont" />
                  </div>
                </div>
                <div>
                  <label className="form-label">Adresse email</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="vous@email.fr" />
                </div>
                <div>
                  <label className="form-label">Mot de passe</label>
                  <input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="8 caractères minimum" minLength={8} />
                </div>
                {error && (
                  <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
                )}
                <button type="submit" disabled={loading} className="btn btn-terra w-full py-3 text-base mt-2">
                  {role === 'artisan' ? 'Continuer →' : 'Créer mon compte'}
                </button>
              </form>
            </>
          )}

          {step === 2 && role === 'artisan' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="form-label">Votre métier</label>
                <input className="form-input" value={form.metier} onChange={e => set('metier', e.target.value)} placeholder="Plombier, Électricien, Peintre…" required />
              </div>
              <div>
                <label className="form-label">Ville principale</label>
                <input className="form-input" value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Paris, Lyon, Bordeaux…" />
              </div>
              {error && (
                <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">{error}</div>
              )}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)} className="btn btn-ghost flex-1">← Retour</button>
                <button type="submit" disabled={loading} className="btn btn-terra flex-1 py-3">
                  {loading && <span className="spinner" />}
                  {loading ? 'Création…' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-sm text-navy-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-terra-600 font-semibold hover:text-terra-700 no-underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
