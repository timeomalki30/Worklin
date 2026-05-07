'use client'
import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Eye, EyeOff, Sparkles } from 'lucide-react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') || '/dashboard/artisan'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError('Email ou mot de passe incorrect.'); setLoading(false); return }
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

      // If role is explicitly 'artisan' → artisan dashboard
      // If role is explicitly 'client' → client dashboard
      // If profile missing (shouldn't happen) → check artisans table as fallback
      let dest = '/dashboard/artisan' // safe default: artisan is primary user type
      if (profile?.role === 'client') {
        dest = '/dashboard/client'
      } else if (profile?.role === 'artisan') {
        dest = redirectTo.includes('artisan') ? redirectTo : '/dashboard/artisan'
      } else {
        // Fallback: check if an artisan row exists for this user
        const { data: artisan } = await supabase.from('artisans').select('id').eq('profile_id', user.id).single()
        dest = artisan ? '/dashboard/artisan' : '/dashboard/client'
      }
      router.push(dest)
    }
  }

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#F5F1E8' }}>

      {/* Left decorative panel — visible md+ */}
      <div className="hidden md:flex md:w-[45%] bg-navy-800 relative overflow-hidden flex-col items-center justify-center p-14">
        {/* Orb */}
        <div className="animate-orb-1 absolute -top-20 -left-20 w-96 h-96 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(221,90,42,0.25) 0%, transparent 70%)', filter: 'blur(60px)' }} />
        <div className="animate-orb-2 absolute -bottom-20 -right-10 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.07) 0%, transparent 70%)', filter: 'blur(60px)' }} />

        <div className="relative z-10 max-w-xs text-center">
          <div className="w-16 h-16 bg-terra-500 rounded-2xl grid place-items-center mx-auto mb-8 shadow-glow">
            <span className="text-white font-black text-2xl" style={{ fontFamily: 'var(--font-manrope)' }}>W</span>
          </div>
          <h2 className="text-3xl font-black text-white mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>
            Bon retour parmi nous
          </h2>
          <p className="text-white/55 text-sm leading-relaxed">
            Gérez vos devis, factures et clients depuis votre espace artisan.
          </p>
          <div className="mt-10 space-y-3">
            {[
              '⚡ Devis IA en 30 secondes',
              '📄 Factures conformes 2027',
              '🌐 Vitrine publique incluse',
            ].map(item => (
              <div key={item} className="bg-white/8 border border-white/12 rounded-xl px-4 py-2.5 text-sm text-white/70 text-left">
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
            <ArrowLeft size={15} /> Retour à l&apos;accueil
          </Link>

          <div className="mb-10">
            <h1 className="text-3xl font-black text-navy-800 mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>
              Connexion
            </h1>
            <p className="text-navy-500 text-sm">Bienvenue sur Worklin — l&apos;OS des artisans solos.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Adresse email</label>
              <input
                type="email"
                className="form-input"
                placeholder="vous@email.fr"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="form-label mb-0">Mot de passe</label>
                <a href="#" className="text-xs text-terra-600 hover:text-terra-700 font-semibold no-underline">
                  Mot de passe oublié ?
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  className="form-input pr-11"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700 transition-colors"
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn btn-terra w-full py-3 text-base">
              {loading && <span className="spinner" />}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-navy-500">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-terra-600 font-semibold hover:text-terra-700 no-underline">
              Créer un compte gratuit
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
