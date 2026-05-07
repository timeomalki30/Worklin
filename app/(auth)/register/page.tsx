'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Wrench, User } from 'lucide-react'
import { generateSlug } from '@/lib/utils'
import { Suspense } from 'react'

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

    const { data: authData, error: authErr } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }
    const user = authData.user
    if (!user) { setLoading(false); return }

    await supabase.from('profiles').upsert({
      id: user.id,
      email: form.email,
      prenom: form.prenom,
      nom: form.nom,
      role,
    })

    if (role === 'artisan') {
      const baseSlug = generateSlug(`${form.prenom}-${form.nom}`)
      const slug = `${baseSlug}-${Math.floor(Math.random() * 9000) + 1000}`
      await supabase.from('artisans').insert({
        profile_id: user.id,
        slug,
        metier: form.metier || 'Artisan',
        ville: form.ville,
      })
    }

    router.push(role === 'artisan' ? '/dashboard/artisan' : '/dashboard/client')
  }

  return (
    <div className="min-h-screen bg-cream-200 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-800 no-underline mb-8 transition-colors">
          <ArrowLeft size={16} /> Retour
        </Link>
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-navy-800 rounded-2xl grid place-items-center mx-auto mb-4">
              <span className="text-white font-black text-lg" style={{ fontFamily: 'var(--font-manrope)' }}>W</span>
            </div>
            <h1 className="text-2xl font-black text-navy-800 mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>Créer un compte</h1>
            <p className="text-sm text-navy-400">Essai gratuit · Sans carte bancaire</p>
          </div>

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {([['artisan', 'Artisan', <Wrench key="w" size={20} />, 'Gérez votre activité'] as const,
                  ['client', 'Client', <User key="u" size={20} />, 'Trouvez un artisan'] as const]).map(([val, label, icon, sub]) => (
                  <button key={val} type="button" onClick={() => setRole(val)}
                    className={`p-4 rounded-2xl border-2 text-left transition-all ${role === val ? 'border-navy-800 bg-navy-800/5' : 'border-cream-300 hover:border-navy-300'}`}>
                    <div className={`mb-2 ${role === val ? 'text-navy-800' : 'text-navy-400'}`}>{icon}</div>
                    <div className={`font-bold text-sm ${role === val ? 'text-navy-800' : 'text-navy-600'}`}>{label}</div>
                    <div className="text-xs text-navy-400">{sub}</div>
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
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="vous@email.fr" />
                </div>
                <div>
                  <label className="form-label">Mot de passe</label>
                  <input type="password" className="form-input" value={form.password} onChange={e => set('password', e.target.value)} required placeholder="Min 8 caractères" minLength={8} />
                </div>
                {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</div>}
                <button type="submit" disabled={loading} className="btn btn-terra w-full">
                  {role === 'artisan' ? 'Suivant →' : 'Créer mon compte'}
                </button>
              </form>
            </>
          )}

          {step === 2 && role === 'artisan' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-sm text-navy-500 bg-cream-200 rounded-xl p-3">Quelques infos pour personnaliser votre espace ✨</p>
              <div>
                <label className="form-label">Votre métier</label>
                <input className="form-input" value={form.metier} onChange={e => set('metier', e.target.value)} placeholder="Plombier, Électricien, Peintre…" required />
              </div>
              <div>
                <label className="form-label">Ville principale</label>
                <input className="form-input" value={form.ville} onChange={e => set('ville', e.target.value)} placeholder="Paris, Lyon, Bordeaux…" />
              </div>
              {error && <div className="text-sm text-red-600 bg-red-50 rounded-xl p-3">{error}</div>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)} className="btn btn-ghost flex-1">Retour</button>
                <button type="submit" disabled={loading} className="btn btn-terra flex-1">
                  {loading && <span className="spinner" />}
                  {loading ? 'Création…' : 'Créer mon compte'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-navy-500">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-terra-600 font-semibold hover:text-terra-700 no-underline">Se connecter</Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return <Suspense><RegisterForm /></Suspense>
}
