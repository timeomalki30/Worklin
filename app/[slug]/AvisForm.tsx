'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Star, CheckCircle } from 'lucide-react'

export default function AvisForm({ artisanId }: { artisanId: string }) {
  const [form, setForm] = useState({ client_nom: '', note: 0, commentaire: '' })
  const [hover, setHover] = useState(0)
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const set = (k: string, v: any) => setForm(p => ({ ...p, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.client_nom.trim()) { setError('Votre nom est requis.'); return }
    if (form.note === 0) { setError('Veuillez sélectionner une note.'); return }
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('avis').insert({
      artisan_id: artisanId,
      client_nom: form.client_nom.trim(),
      note: form.note,
      commentaire: form.commentaire.trim() || null,
      source: 'vitrine',
    })
    if (err) {
      setError('Une erreur est survenue. Réessayez.')
      setLoading(false)
      return
    }
    // Update artisan note_moyenne
    const { data: allAvis } = await supabase.from('avis').select('note').eq('artisan_id', artisanId)
    if (allAvis && allAvis.length > 0) {
      const avg = allAvis.reduce((s: number, a: any) => s + a.note, 0) / allAvis.length
      await supabase.from('artisans').update({ note_moyenne: Math.round(avg * 10) / 10, nb_avis: allAvis.length }).eq('id', artisanId)
    }
    setSent(true)
    setLoading(false)
  }

  if (sent) return (
    <div className="card p-6 text-center">
      <div className="w-14 h-14 bg-green-100 rounded-2xl grid place-items-center mx-auto mb-3">
        <CheckCircle size={28} className="text-green-600" />
      </div>
      <h3 className="font-bold text-navy-800 mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>Merci pour votre avis !</h3>
      <p className="text-sm text-navy-500">Votre avis a été publié.</p>
    </div>
  )

  return (
    <div className="card p-6">
      <h3 className="text-lg font-bold text-navy-800 mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>Laisser un avis</h3>
      <p className="text-sm text-navy-400 mb-5">Partagez votre expérience avec cet artisan</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
        )}

        <div>
          <label className="form-label">Votre nom *</label>
          <input className="form-input" value={form.client_nom} onChange={e => set('client_nom', e.target.value)} placeholder="Jean Dupont" required />
        </div>

        <div>
          <label className="form-label">Note *</label>
          <div className="flex gap-1 mt-1">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => set('note', star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, lineHeight: 0, minWidth: 44, minHeight: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <Star
                  size={28}
                  className={star <= (hover || form.note) ? 'text-yellow-400 fill-yellow-400' : 'text-cream-400'}
                  style={{ transition: 'all 0.1s' }}
                />
              </button>
            ))}
            {form.note > 0 && (
              <span className="text-sm font-semibold text-navy-600 flex items-center ml-2">
                {['', 'Mauvais', 'Passable', 'Bien', 'Très bien', 'Excellent'][form.note]}
              </span>
            )}
          </div>
        </div>

        <div>
          <label className="form-label">Commentaire (optionnel)</label>
          <textarea className="form-textarea" rows={3} value={form.commentaire} onChange={e => set('commentaire', e.target.value)} placeholder="Décrivez votre expérience…" />
        </div>

        <button type="submit" disabled={loading} className="btn btn-terra w-full">
          {loading ? <span className="spinner" /> : null}
          {loading ? 'Publication…' : 'Publier mon avis'}
        </button>
      </form>
    </div>
  )
}
