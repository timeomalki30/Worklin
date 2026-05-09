'use client'
import Link from 'next/link'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const supabase = createClient()

      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) {
        setError(authErr.message)
        setLoading(false)
        return
      }

      // Always go to artisan dashboard — hard redirect so cookies are
      // fully committed before the next request. Never follow ?redirectTo
      // which can be poisoned by stale server-side redirects.
      window.location.href = '/dashboard/artisan'
    } catch (err: any) {
      setError(err?.message || 'Une erreur est survenue. Réessayez.')
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link href="/" className="logo"><span className="logo-mark"><span>A</span></span>Worklin</Link>
        </div>
        <h1 className="auth-title">Connexion</h1>
        <p className="auth-subtitle">Bienvenue ! Entrez vos identifiants.</p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 'var(--r-md)', background: '#FEF2F2', color: '#B91C1C', marginBottom: 20, fontSize: 14 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
          </div>
          <div className="form-group">
            <label>Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPwd(v => !v)}
                tabIndex={-1}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', display: 'flex', padding: 0, lineHeight: 0 }}
                aria-label={showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={loading}>
            {loading ? <span className="waitlist-spinner"></span> : null}
            {loading ? 'Connexion…' : 'Se connecter'}
          </button>
        </form>

        <p className="auth-footer">
          Pas encore de compte ?{' '}
          <Link href="/register" style={{ color: 'var(--c-accent)', fontWeight: 600 }}>S&apos;inscrire</Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return <LoginForm />
}
