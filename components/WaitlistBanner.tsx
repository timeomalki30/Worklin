'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'worklin_waitlist_banner_closed_v1'
const BREVO_LIST_ID = 3

export default function WaitlistBanner() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [formHidden, setFormHidden] = useState(false)
  const [fields, setFields] = useState({ firstName: '', lastName: '', email: '', phone: '', postal: '' })

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY) !== 'true') {
      setVisible(true)
      document.body.classList.add('has-banner')
    }
  }, [])

  const close = () => {
    setVisible(false)
    document.body.classList.remove('has-banner')
    localStorage.setItem(STORAGE_KEY, 'true')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage(null)
    if (!fields.firstName) return setMessage({ type: 'error', text: 'Prénom requis' })
    if (!fields.lastName) return setMessage({ type: 'error', text: 'Nom requis' })
    if (!fields.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/)) return setMessage({ type: 'error', text: 'Email invalide' })
    if (!fields.phone.replace(/[\s.\-()] /g, '').match(/^(0[1-9]\d{8}|\+33[1-9]\d{8})$/)) return setMessage({ type: 'error', text: 'Téléphone invalide' })
    if (!fields.postal.match(/^\d{5}$/)) return setMessage({ type: 'error', text: 'Code postal invalide' })

    setLoading(true)
    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fields),
      })
      if (res.ok) {
        setFormHidden(true)
        setMessage({ type: 'success', text: 'C\'est noté ! On vous prévient en premier dès le lancement.' })
      } else {
        const d = await res.json()
        setMessage({ type: 'error', text: d.error || 'Erreur, réessayez.' })
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur réseau, réessayez.' })
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div className="waitlist-banner" id="waitlistBanner" role="region" aria-label="Liste d'attente">
      <div className="waitlist-text">
        <span className="pulse-dot"></span>
        <span><strong>Lancement bientôt dans votre ville</strong> — Inscrivez-vous pour être prioritaire et accéder gratuitement à nos premiers artisans vérifiés</span>
      </div>

      {!formHidden && (
        <form className="waitlist-form" onSubmit={handleSubmit} noValidate>
          <input type="text" placeholder="Prénom" value={fields.firstName} onChange={e => setFields(p => ({ ...p, firstName: e.target.value }))} style={{ width: 105 }} />
          <input type="text" placeholder="Nom" value={fields.lastName} onChange={e => setFields(p => ({ ...p, lastName: e.target.value }))} style={{ width: 105 }} />
          <input type="email" placeholder="Email" value={fields.email} onChange={e => setFields(p => ({ ...p, email: e.target.value }))} style={{ width: 180 }} />
          <input type="tel" placeholder="Téléphone" value={fields.phone} onChange={e => setFields(p => ({ ...p, phone: e.target.value }))} style={{ width: 130 }} />
          <input type="text" placeholder="Code postal" value={fields.postal} onChange={e => setFields(p => ({ ...p, postal: e.target.value.replace(/\D/g, '').slice(0, 5) }))} style={{ width: 100 }} />
          <button type="submit" disabled={loading}>
            {loading ? <span className="waitlist-spinner"></span> : null}
            Je veux être prioritaire
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M13 5l7 7-7 7"/></svg>
          </button>
        </form>
      )}

      {message && (
        <div className={`waitlist-message show ${message.type}`}>
          {message.type === 'success'
            ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M5 13l4 4L19 7"/></svg>
            : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          }
          <span>{message.text}</span>
        </div>
      )}

      <button className="waitlist-close" onClick={close} aria-label="Fermer">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  )
}
