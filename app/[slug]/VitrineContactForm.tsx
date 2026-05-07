'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Send, CheckCircle } from 'lucide-react'

export default function VitrineContactForm({ artisanId, artisanName }: { artisanId: string; artisanName: string }) {
  const [form, setForm] = useState({ nom: '', email: '', phone: '', description: '' })
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const set = (k: string, v: string) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('demandes').insert({
      artisan_id: artisanId,
      nom: form.nom,
      email: form.email,
      phone: form.phone,
      description: form.description,
      statut: 'nouveau',
      source: 'vitrine',
    })
    // Notify artisan via email
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'nouvelle_demande', artisanId, demande: form }),
    })
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className="card p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-2xl grid place-items-center mx-auto mb-4">
        <CheckCircle size={32} className="text-green-600" />
      </div>
      <h3 className="text-xl font-bold text-navy-800 mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>Demande envoyée !</h3>
      <p className="text-sm text-navy-500">{artisanName} a été notifié et vous contactera rapidement.</p>
    </div>
  )

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-navy-800 mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>Demander un devis gratuit</h3>
      <p className="text-sm text-navy-400 mb-6">Réponse sous 24h garantie</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="form-label">Nom complet *</label>
          <input className="form-input" value={form.nom} onChange={e => set('nom', e.target.value)} placeholder="Jean Dupont" required />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input type="email" className="form-input" value={form.email} onChange={e => set('email', e.target.value)} placeholder="jean@email.fr" />
        </div>
        <div>
          <label className="form-label">Téléphone</label>
          <input type="tel" className="form-input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="06 00 00 00 00" />
        </div>
        <div>
          <label className="form-label">Décrivez votre besoin *</label>
          <textarea className="form-textarea" rows={4} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Ex: Remplacement robinetterie cuisine, fuite sous l'évier…" required />
        </div>
        <button type="submit" disabled={loading} className="btn btn-terra w-full">
          {loading ? <span className="spinner" /> : <Send size={16} />}
          {loading ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
      </form>
      <p className="text-xs text-navy-400 mt-4 text-center">Gratuit et sans engagement</p>
    </div>
  )
}
