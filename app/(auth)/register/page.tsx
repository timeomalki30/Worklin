'use client'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<'client' | 'artisan'>('client')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fields, setFields] = useState({ email: '', password: '', prenom: '', nom: '', phone: '' })
  const [showPwd, setShowPwd] = useState(false)

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setFields(p => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!fields.prenom) return setError('Prénom requis')
    if (!fields.nom) return setError('Nom requis')
    if (role === 'artisan' && !fields.phone) return setError('Numéro de téléphone requis pour les artisans')
    if (fields.password.length < 8) return setError('Mot de passe trop court (8 caractères min)')

    setLoading(true)
    const supabase = createClient()

    const { error: authErr, data } = await supabase.auth.signUp({
      email: fields.email,
      password: fields.password,
      options: { data: { role, prenom: fields.prenom, nom: fields.nom } }
    })
    if (authErr) { setError(authErr.message); setLoading(false); return }

    if (data.user) {
      // Upsert so any auto-created profile (from a DB trigger) gets the
      // correct role instead of the trigger's default value.
      await supabase.from('profiles').upsert({
        id: data.user.id,
        role,
        prenom: fields.prenom,
        nom: fields.nom,
        phone: fields.phone,
      }, { onConflict: 'id' })

      if (role === 'artisan') {
        // Build a URL-safe slug from prenom + nom
        const slug = `${fields.prenom}-${fields.nom}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '')  // strip accents
          .replace(/[^a-z0-9-]/g, '-')      // non-alphanumeric → hyphen
          .replace(/-+/g, '-')              // collapse repeated hyphens
          .replace(/^-|-$/g, '')            // trim leading/trailing hyphens

        await supabase.from('artisans').insert({
          profile_id: data.user.id,
          metier: '',
          ville: '',
          slug,
          actif: false,
        })
      }

      // Sync to Brevo contacts
      try {
        await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'content-type': 'application/json',
            'api-key': process.env.NEXT_PUBLIC_BREVO_API_KEY || '',
          },
          body: JSON.stringify({
            email: fields.email,
            attributes: {
              PRENOM: fields.prenom || '',
              NOM: fields.nom || '',
              SMS: fields.phone || '',
              ROLE: role,
              METIER: '',
            },
            listIds: [3],
            updateEnabled: true,
          }),
        })
      } catch {
        // Non-blocking — registration succeeds even if Brevo sync fails
      }
    }
    const dest = role === 'artisan'
      ? `/dashboard/artisan?welcome=true&prenom=${encodeURIComponent(fields.prenom)}`
      : '/dashboard/client'
    window.location.href = dest
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <Link href="/" className="logo"><span className="logo-mark"><span>A</span></span>Worklin</Link>
        </div>
        <h1 className="auth-title">Créer un compte</h1>
        <p className="auth-subtitle">Rejoignez Worklin en 2 minutes.</p>

        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 'var(--r-md)', background: '#FEF2F2', color: '#B91C1C', marginBottom: 20, fontSize: 14 }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ width: 18, height: 18 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div>
            <p style={{ fontSize: 'var(--fs-sm)', fontWeight: 600, fontFamily: 'var(--font-head)', marginBottom: 12 }}>Je suis…</p>
            <div className="role-selector">
              <label className="role-option">
                <input type="radio" name="role" checked={role === 'client'} onChange={() => setRole('client')} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <strong>Particulier</strong>
                <span>Je cherche un artisan</span>
              </label>
              <label className="role-option">
                <input type="radio" name="role" checked={role === 'artisan'} onChange={() => setRole('artisan')} />
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>
                <strong>Artisan</strong>
                <span>Je propose mes services</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group"><label>Prénom *</label><input type="text" value={fields.prenom} onChange={set('prenom')} required /></div>
            <div className="form-group"><label>Nom *</label><input type="text" value={fields.nom} onChange={set('nom')} required /></div>
          </div>
          <div className="form-group">
            <label>Téléphone {role === 'artisan' ? '*' : <span style={{ fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 400 }}>(optionnel)</span>}</label>
            <input type="tel" value={fields.phone} onChange={set('phone')} placeholder="06 12 34 56 78" required={role === 'artisan'} />
          </div>
          <div className="form-group"><label>Email *</label><input type="email" value={fields.email} onChange={set('email')} required autoComplete="email" /></div>
          <div className="form-group">
            <label>Mot de passe *</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPwd ? 'text' : 'password'}
                value={fields.password}
                onChange={set('password')}
                required
                autoComplete="new-password"
                minLength={8}
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
            {loading ? 'Création…' : `Créer mon compte ${role === 'artisan' ? 'artisan' : ''}`}
          </button>
        </form>

        <p className="auth-footer">
          Déjà un compte ?{' '}
          <Link href="/login" style={{ color: 'var(--c-accent)', fontWeight: 600 }}>Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
