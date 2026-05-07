'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Eye, EyeOff } from 'lucide-react'
import { Suspense } from 'react'

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
      const dest = profile?.role === 'artisan' ? (redirectTo.includes('artisan') ? redirectTo : '/dashboard/artisan') : '/dashboard/client'
      router.push(dest)
    }
  }

  return (
    <div className="min-h-screen bg-cream-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 no-underline mb-8 transition-colors">
          <ArrowLeft size={16} /> Retour à l&apos;accueil
        </Link>
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-navy-800 rounded-2xl grid place-items-center mx-auto mb-4">
              <span className="text-white font-black text-lg" style={{ fontFamily: 'var(--font-manrope)' }}>W</span>
            </div>
            <h1 className="text-2xl font-black text-navy-800 mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>Connexion</h1>
            <p className="text-sm text-navy-400">Bienvenue sur Worklin</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="form-label">Email</label>
              <input type="email" className="form-input" placeholder="vous@email.fr" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="form-label">Mot de passe</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} className="form-input pr-10" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-navy-400 hover:text-navy-700">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary w-full">
              {loading && <span className="spinner" />}
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
          <div className="mt-6 text-center text-sm text-navy-500">
            Pas encore de compte ?{' '}
            <Link href="/register" className="text-terra-600 font-semibold hover:text-terra-700 no-underline">Créer un compte</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <Suspense><LoginForm /></Suspense>
}
