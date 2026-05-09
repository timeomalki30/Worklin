'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    window.location.replace('/dashboard/artisan')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F5F1E8' }}>
      <div style={{ background: 'white', padding: '2rem', borderRadius: '16px', width: '100%', maxWidth: '400px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <h1 style={{ color: '#0B2440', fontWeight: 800, fontSize: '1.8rem', marginBottom: '1.5rem', textAlign: 'center' }}>Connexion</h1>
        {error && <p style={{ color: 'red', marginBottom: '1rem' }}>{error}</p>}
        <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }} />
        <input type="password" placeholder="Mot de passe" value={password} onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '0.75rem', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #ddd', fontSize: '1rem' }} />
        <button onClick={handleLogin} disabled={loading}
          style={{ width: '100%', padding: '0.85rem', background: '#DD5A2A', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
        <p style={{ textAlign: 'center', marginTop: '1rem', color: '#64748B' }}>
          Pas de compte ? <a href="/register" style={{ color: '#DD5A2A', fontWeight: 600 }}>S&apos;inscrire</a>
        </p>
      </div>
    </div>
  )
}
