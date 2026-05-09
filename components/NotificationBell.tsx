'use client'
import { useEffect, useRef, useState } from 'react'
import { Bell, X } from 'lucide-react'
import Link from 'next/link'

interface NotifItem {
  id: string
  type: 'demande' | 'devis_expire' | 'certif_expire'
  message: string
  href: string
  read: boolean
  created_at: string
}

export default function NotificationBell({ artisanId }: { artisanId: string }) {
  const [open, setOpen] = useState(false)
  const [notifs, setNotifs] = useState<NotifItem[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!artisanId) return
    buildNotifs()
  }, [artisanId])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const buildNotifs = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const items: NotifItem[] = []
    const today = new Date()

    // New demandes
    const { data: demandes } = await supabase
      .from('demandes')
      .select('id, nom, created_at')
      .eq('artisan_id', artisanId)
      .eq('statut', 'nouveau')
      .order('created_at', { ascending: false })
      .limit(5)

    ;(demandes || []).forEach(d => {
      items.push({
        id: `demande-${d.id}`,
        type: 'demande',
        message: `Nouvelle demande de ${d.nom}`,
        href: '/dashboard/artisan/vitrine',
        read: false,
        created_at: d.created_at,
      })
    })

    // Devis expiring soon (date_validite in next 7 days, status envoye)
    const in7 = new Date(today); in7.setDate(today.getDate() + 7)
    const { data: devisExpire } = await supabase
      .from('devis')
      .select('id, numero, date_validite')
      .eq('artisan_id', artisanId)
      .eq('statut', 'envoye')
      .lte('date_validite', in7.toISOString().split('T')[0])
      .gte('date_validite', today.toISOString().split('T')[0])
      .limit(3)

    ;(devisExpire || []).forEach(d => {
      items.push({
        id: `devis-${d.id}`,
        type: 'devis_expire',
        message: `Devis ${d.numero} expire le ${new Date(d.date_validite).toLocaleDateString('fr-FR')}`,
        href: '/dashboard/artisan/devis',
        read: false,
        created_at: today.toISOString(),
      })
    })

    // Certif alerts (from artisans.certifications with expires_at)
    const { data: artisan } = await supabase
      .from('artisans')
      .select('certifications')
      .eq('id', artisanId)
      .single()

    if (artisan?.certifications) {
      const certifs = artisan.certifications as Record<string, any>
      Object.entries(certifs).forEach(([name, val]) => {
        if (val && typeof val === 'object' && val.expires_at) {
          const expDate = new Date(val.expires_at)
          const daysLeft = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
          if (daysLeft <= 30) {
            items.push({
              id: `certif-${name}`,
              type: 'certif_expire',
              message: daysLeft <= 0
                ? `Certification ${name} expirée !`
                : `Certification ${name} expire dans ${daysLeft} jour${daysLeft > 1 ? 's' : ''}`,
              href: '/dashboard/artisan/parametres',
              read: false,
              created_at: today.toISOString(),
            })
          }
        }
      })
    }

    setNotifs(items.slice(0, 8))
  }

  const unread = notifs.filter(n => !n.read).length

  const markRead = (id: string) => {
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllRead = () => {
    setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  }

  const typeIcon = (type: NotifItem['type']) => {
    if (type === 'demande') return '📨'
    if (type === 'devis_expire') return '⏰'
    return '⚠️'
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', background: 'rgba(255,255,255,0.08)', border: 'none', cursor: 'pointer',
          width: 36, height: 36, borderRadius: 10, display: 'grid', placeItems: 'center', color: 'rgba(255,255,255,0.8)',
          transition: 'background 0.15s',
        }}
        title="Notifications"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4, background: 'var(--c-accent)', color: 'white',
            fontSize: 10, fontWeight: 700, width: 18, height: 18, borderRadius: '50%',
            display: 'grid', placeItems: 'center', fontFamily: 'var(--font-head)', border: '2px solid var(--c-text)',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 44, width: 320, background: 'white', borderRadius: 14,
          boxShadow: '0 8px 30px rgba(0,0,0,0.18)', zIndex: 999, overflow: 'hidden', border: '1px solid var(--c-border)',
        }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--c-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 14, color: 'var(--c-text)' }}>
              Notifications {unread > 0 && <span style={{ color: 'var(--c-accent)' }}>({unread})</span>}
            </span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unread > 0 && (
                <button onClick={markAllRead} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--c-accent)', fontWeight: 600, fontFamily: 'var(--font-head)' }}>
                  Tout marquer lu
                </button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--c-text-muted)', lineHeight: 0 }}>
                <X size={16} />
              </button>
            </div>
          </div>

          <div style={{ maxHeight: 360, overflowY: 'auto' }}>
            {notifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--c-text-muted)', fontSize: 13 }}>
                <Bell size={28} style={{ margin: '0 auto 8px', opacity: 0.3 }} />
                <p>Aucune notification</p>
              </div>
            ) : notifs.map(n => (
              <Link
                key={n.id}
                href={n.href}
                onClick={() => { markRead(n.id); setOpen(false) }}
                style={{
                  display: 'flex', gap: 12, padding: '12px 16px', textDecoration: 'none',
                  background: n.read ? 'white' : 'rgba(var(--c-accent-rgb, 180, 92, 60), 0.04)',
                  borderBottom: '1px solid var(--c-border)', transition: 'background 0.1s',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{typeIcon(n.type)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: 'var(--c-text)', fontWeight: n.read ? 400 : 600, lineHeight: 1.4 }}>{n.message}</div>
                  <div style={{ fontSize: 11, color: 'var(--c-text-muted)', marginTop: 2 }}>
                    {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                {!n.read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--c-accent)', flexShrink: 0, marginTop: 4 }} />}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
