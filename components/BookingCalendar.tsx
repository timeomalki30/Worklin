'use client'
import { useState, useEffect } from 'react'
import Calendar from 'react-calendar'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Props {
  artisanId: string
  artisanName: string
}

type ValuePiece = Date | null
type Value = ValuePiece | [ValuePiece, ValuePiece]

export default function BookingCalendar({ artisanId, artisanName }: Props) {
  const router = useRouter()
  const [date, setDate] = useState<Date | null>(null)
  const [slots, setSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadDispo = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('disponibilites')
        .select('date')
        .eq('artisan_id', artisanId)
        .eq('disponible', true)
        .gte('date', new Date().toISOString().split('T')[0])
      setAvailableDates(new Set((data || []).map(d => d.date)))
    }
    loadDispo()
  }, [artisanId])

  useEffect(() => {
    if (!date) return
    const dateStr = date.toISOString().split('T')[0]
    const loadSlots = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('disponibilites')
        .select('heure_debut, heure_fin')
        .eq('artisan_id', artisanId)
        .eq('date', dateStr)
        .eq('disponible', true)

      const generatedSlots: string[] = []
      for (const dispo of data || []) {
        const [sh, sm] = dispo.heure_debut.split(':').map(Number)
        const [eh, em] = dispo.heure_fin.split(':').map(Number)
        let h = sh, m = sm
        while (h * 60 + m + 60 <= eh * 60 + em) {
          generatedSlots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
          m += 60
          if (m >= 60) { h++; m -= 60 }
        }
      }
      setSlots(generatedSlots)
      setSelectedSlot(null)
    }
    loadSlots()
  }, [date, artisanId])

  const handleBook = async () => {
    if (!date || !selectedSlot) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.push('/login'); return }

    setLoading(true)
    const { error } = await supabase.from('reservations').insert({
      client_id: user.id,
      artisan_id: artisanId,
      date: date.toISOString().split('T')[0],
      heure: selectedSlot,
      statut: 'en_attente',
      description_travaux: description,
    })
    if (!error) {
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reservation_confirmation',
          userId: user.id,
          artisanId,
          date: date.toISOString().split('T')[0],
          heure: selectedSlot,
        }),
      })
      setSuccess(true)
    }
    setLoading(false)
  }

  const tileDisabled = ({ date: d, view }: { date: Date; view: string }) => {
    if (view !== 'month') return false
    if (d < new Date(new Date().setHours(0, 0, 0, 0))) return true
    const str = d.toISOString().split('T')[0]
    return !availableDates.has(str)
  }

  const tileClassName = ({ date: d, view }: { date: Date; view: string }) => {
    if (view !== 'month') return null
    const str = d.toISOString().split('T')[0]
    return availableDates.has(str) ? 'has-slots' : null
  }

  if (success) return (
    <div className="booking-widget" style={{ textAlign: 'center', padding: 32 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--c-success)', color: 'white', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ width: 32, height: 32 }}><path d="M5 13l4 4L19 7"/></svg>
      </div>
      <h3 style={{ marginBottom: 8 }}>Demande envoyée !</h3>
      <p>Votre demande de RDV le {date?.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })} à {selectedSlot} a été transmise à {artisanName}. Vous recevrez une confirmation par email.</p>
    </div>
  )

  return (
    <div className="booking-widget">
      <h3>Réserver un créneau</h3>
      <p style={{ color: 'var(--c-text-muted)', fontSize: 'var(--fs-sm)', marginBottom: 16 }}>Choisissez une date disponible (en vert)</p>

      <style>{`
        .has-slots { background: var(--c-success-soft) !important; color: var(--c-success) !important; font-weight: 700 !important; }
        .react-calendar { font-family: var(--font-body) !important; }
        .react-calendar__navigation button { color: var(--c-primary) !important; font-family: var(--font-head) !important; font-weight: 700 !important; }
        .react-calendar__tile { border-radius: var(--r-sm) !important; }
        .react-calendar__tile--active { background: var(--c-accent) !important; color: white !important; }
        .react-calendar__tile--now:not(.react-calendar__tile--active) { background: var(--c-accent-soft) !important; color: var(--c-accent) !important; }
        .react-calendar__tile:disabled { opacity: 0.3; }
        .react-calendar__month-view__weekdays__weekday abbr { text-decoration: none !important; }
      `}</style>

      <Calendar
        onChange={(v) => setDate(v as Date)}
        value={date}
        tileDisabled={tileDisabled}
        tileClassName={tileClassName}
        minDate={new Date()}
        locale="fr-FR"
      />

      {date && slots.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 700, fontSize: 'var(--fs-sm)', fontFamily: 'var(--font-head)', marginBottom: 12 }}>
            Créneaux disponibles · {date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="booking-slots">
            {slots.map(slot => (
              <button key={slot} className={`time-slot${selectedSlot === slot ? ' selected' : ''}`} onClick={() => setSelectedSlot(slot)}>
                {slot}
              </button>
            ))}
          </div>
        </div>
      )}

      {date && slots.length === 0 && (
        <p style={{ textAlign: 'center', color: 'var(--c-text-muted)', padding: 16, fontSize: 'var(--fs-sm)' }}>Aucun créneau disponible ce jour.</p>
      )}

      {selectedSlot && (
        <div style={{ marginTop: 20 }}>
          <div className="form-group">
            <label style={{ fontWeight: 600, fontSize: 'var(--fs-sm)', color: 'var(--c-text)', fontFamily: 'var(--font-head)', display: 'block', marginBottom: 6 }}>
              Description des travaux
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Décrivez votre besoin (ex: fuite sous l'évier, remplacement robinetterie…)"
              rows={3}
              style={{ width: '100%', padding: '12px 14px', border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', background: 'var(--c-surface)', fontSize: 'var(--fs-sm)', resize: 'vertical', outline: 'none' }}
            />
          </div>
          <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} onClick={handleBook} disabled={loading}>
            {loading ? <span className="waitlist-spinner"></span> : null}
            {loading ? 'Envoi…' : `Confirmer le ${date?.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} à ${selectedSlot}`}
          </button>
        </div>
      )}
    </div>
  )
}
