'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Reservation, Devis } from '@/types'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface KPIData {
  ca_mois: number
  devis_en_attente: number
  rdv_semaine: number
  clients_total: number
  ca_prev: number
}

export default function ArtisanDashboardPage() {
  const [kpis, setKpis] = useState<KPIData>({ ca_mois: 0, devis_en_attente: 0, rdv_semaine: 0, clients_total: 0, ca_prev: 0 })
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [recentDevis, setRecentDevis] = useState<Devis[]>([])
  const [loading, setLoading] = useState(true)
  const [artisanId, setArtisanId] = useState<string | null>(null)
  const [prenom, setPrenom] = useState('Artisan')
  const [online, setOnline] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('profiles').select('prenom').eq('id', user.id).single()
      setPrenom(profile?.prenom || 'Artisan')

      const { data: artisan } = await supabase.from('artisans').select('id').eq('profile_id', user.id).single()
      if (!artisan) { setLoading(false); return }
      setArtisanId(artisan.id)

      const now = new Date()
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const prevFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0]
      const prevLast = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0]
      const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1)
      const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)

      const [factures, facturesPrev, devisAttente, rdvWeek, clients] = await Promise.all([
        supabase.from('factures').select('total_ttc').eq('artisan_id', artisan.id).eq('statut', 'payee').gte('date_emission', firstDay),
        supabase.from('factures').select('total_ttc').eq('artisan_id', artisan.id).eq('statut', 'payee').gte('date_emission', prevFirst).lte('date_emission', prevLast),
        supabase.from('devis').select('*', { count: 'exact', head: true }).eq('artisan_id', artisan.id).eq('statut', 'envoye'),
        supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('artisan_id', artisan.id).gte('date', weekStart.toISOString().split('T')[0]).lte('date', weekEnd.toISOString().split('T')[0]),
        supabase.from('clients_artisan').select('*', { count: 'exact', head: true }).eq('artisan_id', artisan.id),
      ])

      const ca = (factures.data || []).reduce((s, f) => s + (f.total_ttc || 0), 0)
      const caPrev = (facturesPrev.data || []).reduce((s, f) => s + (f.total_ttc || 0), 0)
      setKpis({ ca_mois: ca, ca_prev: caPrev, devis_en_attente: devisAttente.count || 0, rdv_semaine: rdvWeek.count || 0, clients_total: clients.count || 0 })

      const [{ data: rdvs }, { data: dvs }] = await Promise.all([
        supabase.from('reservations').select('*, profiles(prenom, nom)').eq('artisan_id', artisan.id).gte('date', now.toISOString().split('T')[0]).order('date').order('heure').limit(5),
        supabase.from('devis').select('*, clients_artisan(nom, prenom)').eq('artisan_id', artisan.id).order('created_at', { ascending: false }).limit(4),
      ])
      setReservations(rdvs || [])
      setRecentDevis(dvs || [])
      setLoading(false)
    }
    load()
  }, [])

  const caVariation = kpis.ca_prev > 0 ? ((kpis.ca_mois - kpis.ca_prev) / kpis.ca_prev) * 100 : 0

  if (loading) return <div style={{ textAlign: 'center', padding: 64, color: 'var(--c-text-muted)' }}>Chargement…</div>

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 'var(--fs-3xl)', marginBottom: 4, letterSpacing: '-0.025em' }}>
            Bonjour <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'normal' }}>{prenom}</span> 👋
          </h1>
          <div style={{ color: 'var(--c-text-soft)', fontSize: 'var(--fs-md)' }}>
            {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', position: 'relative' }}>
          <button
            onClick={() => setOnline(o => !o)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-pill)', fontSize: 'var(--fs-sm)', fontWeight: 600, cursor: 'pointer', transition: 'all var(--transition-fast)', fontFamily: 'var(--font-head)' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: online ? 'var(--c-success)' : 'var(--c-text-muted)', position: 'relative' }}></span>
            {online ? 'En ligne' : 'Hors ligne'}
          </button>
          <Link href="/dashboard/artisan/devis" className="btn btn-primary btn-sm">
            + Nouveau devis
          </Link>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'CA ce mois',
            value: kpis.ca_mois.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }),
            trend: caVariation !== 0 ? `${caVariation > 0 ? '+' : ''}${caVariation.toFixed(0)} %` : null,
            trendUp: caVariation >= 0,
            icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>,
            color: 'var(--c-accent)',
          },
          {
            label: 'Devis en attente',
            value: kpis.devis_en_attente,
            trend: null,
            icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>,
            color: 'var(--c-primary)',
          },
          {
            label: 'RDV cette semaine',
            value: kpis.rdv_semaine,
            trend: null,
            icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
            color: 'var(--c-success)',
          },
          {
            label: 'Clients totaux',
            value: kpis.clients_total,
            trend: null,
            icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>,
            color: 'var(--c-primary)',
          },
        ].map((kpi, i) => (
          <div key={i} style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: 20, position: 'relative', overflow: 'hidden', transition: 'all var(--transition-fast)', cursor: 'default' }}>
            <div style={{ position: 'absolute', top: 16, right: 16, width: 38, height: 38, borderRadius: 'var(--r-sm)', background: `${kpi.color}1a`, color: kpi.color, display: 'grid', placeItems: 'center' }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 18, height: 18 }}>{kpi.icon}</svg>
            </div>
            <div style={{ fontSize: 12, color: 'var(--c-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 700, marginBottom: 8, fontFamily: 'var(--font-head)' }}>{kpi.label}</div>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, fontSize: 'var(--fs-3xl)', color: 'var(--c-text)', lineHeight: 1.1, letterSpacing: '-0.03em' }}>{kpi.value}</div>
            {kpi.trend && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 700, padding: '3px 10px', borderRadius: 'var(--r-pill)', fontFamily: 'var(--font-head)', background: kpi.trendUp ? 'var(--c-success-soft)' : 'rgba(184,58,42,0.1)', color: kpi.trendUp ? 'var(--c-success)' : 'var(--c-danger)' }}>
                {kpi.trendUp ? '↑' : '↓'} {kpi.trend} vs mois dernier
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        {/* Agenda du jour */}
        <div>
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: 22, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--c-border)' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'var(--fs-lg)', display: 'flex', alignItems: 'center', gap: 10 }}>
                Prochains RDV
                {reservations.length > 0 && <span style={{ background: 'var(--c-accent)', color: 'white', padding: '2px 10px', fontSize: 12, fontWeight: 700, borderRadius: 'var(--r-pill)' }}>{reservations.length}</span>}
              </div>
              <Link href="/dashboard/artisan/agenda" className="btn btn-ghost btn-sm">Voir l&apos;agenda</Link>
            </div>
            {reservations.length === 0 ? (
              <p style={{ color: 'var(--c-text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 'var(--fs-sm)' }}>Aucun RDV à venir. <Link href="/dashboard/artisan/agenda" style={{ color: 'var(--c-accent)' }}>Gérer les disponibilités →</Link></p>
            ) : reservations.map(r => (
              <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '86px 4px 1fr auto', gap: 16, alignItems: 'center', padding: '14px 0', borderBottom: '1px solid var(--c-border)' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-head)', fontWeight: 800, color: 'var(--c-text)', fontSize: 'var(--fs-md)', letterSpacing: '-0.02em' }}>{r.heure}</div>
                  <small style={{ display: 'block', fontSize: 11, color: 'var(--c-text-muted)', fontWeight: 500 }}>{format(new Date(r.date), 'dd MMM', { locale: fr })}</small>
                </div>
                <div style={{ width: 4, background: r.statut === 'en_attente' ? 'var(--c-accent)' : 'var(--c-primary)', borderRadius: 2, height: 44 }}></div>
                <div>
                  <strong style={{ display: 'block', fontFamily: 'var(--font-head)', fontSize: 'var(--fs-md)' }}>{r.profiles?.prenom} {r.profiles?.nom}</strong>
                  <span style={{ color: 'var(--c-text-soft)', fontSize: 'var(--fs-sm)' }}>{r.description_travaux || 'Prestation'}</span>
                  <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                    <span className={`status-badge ${r.statut}`}>{r.statut.replace('_', ' ')}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Link href="/dashboard/artisan/agenda" style={{ width: 34, height: 34, borderRadius: 'var(--r-sm)', background: 'var(--c-bg)', color: 'var(--c-text-soft)', display: 'grid', placeItems: 'center', border: '1px solid transparent', transition: 'all var(--transition-fast)' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Devis récents */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--c-border)' }}>
              <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'var(--fs-lg)' }}>Devis récents</div>
              <Link href="/dashboard/artisan/devis" className="btn btn-ghost btn-sm">Tous les devis</Link>
            </div>
            {recentDevis.length === 0 ? (
              <p style={{ color: 'var(--c-text-muted)', textAlign: 'center', padding: '24px 0', fontSize: 'var(--fs-sm)' }}>
                Aucun devis. <Link href="/dashboard/artisan/devis" style={{ color: 'var(--c-accent)' }}>Créer un devis →</Link>
              </p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ fontSize: 'var(--fs-xs)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--c-text-muted)', fontFamily: 'var(--font-head)' }}>
                    <th style={{ textAlign: 'left', padding: '0 0 12px', fontWeight: 700 }}>N°</th>
                    <th style={{ textAlign: 'left', padding: '0 0 12px', fontWeight: 700 }}>Client</th>
                    <th style={{ textAlign: 'left', padding: '0 0 12px', fontWeight: 700 }}>Statut</th>
                    <th style={{ textAlign: 'right', padding: '0 0 12px', fontWeight: 700 }}>Montant</th>
                  </tr>
                </thead>
                <tbody>
                  {recentDevis.map(d => (
                    <tr key={d.id} style={{ borderTop: '1px solid var(--c-border)', fontSize: 'var(--fs-sm)' }}>
                      <td style={{ padding: '12px 0', fontFamily: 'var(--font-head)', fontWeight: 600 }}>{d.numero}</td>
                      <td style={{ padding: '12px 0', color: 'var(--c-text-soft)' }}>{d.clients_artisan?.prenom} {d.clients_artisan?.nom}</td>
                      <td style={{ padding: '12px 0' }}><span className={`status-badge ${d.statut}`}>{d.statut}</span></td>
                      <td style={{ padding: '12px 0', textAlign: 'right', fontFamily: 'var(--font-head)', fontWeight: 700 }}>{d.total_ttc.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Droite */}
        <div>
          {/* Actions rapides */}
          <div style={{ background: 'var(--c-surface)', border: '1px solid var(--c-border)', borderRadius: 'var(--r-lg)', padding: 22, marginBottom: 24 }}>
            <div style={{ fontFamily: 'var(--font-head)', fontWeight: 700, fontSize: 'var(--fs-lg)', marginBottom: 18, paddingBottom: 16, borderBottom: '1px solid var(--c-border)' }}>Actions rapides</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {[
                { href: '/dashboard/artisan/devis', icon: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></>, t: 'Nouveau devis', s: 'Créer & envoyer' },
                { href: '/dashboard/artisan/factures', icon: <><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></>, t: 'Nouvelle facture', s: 'Facturer client' },
                { href: '/dashboard/artisan/clients', icon: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></>, t: 'Ajouter client', s: 'Base de données' },
                { href: '/dashboard/artisan/agenda', icon: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>, t: 'Gérer l\'agenda', s: 'Disponibilités' },
              ].map((a, i) => (
                <Link key={i} href={a.href} style={{ padding: 16, border: '1px solid var(--c-border)', borderRadius: 'var(--r-md)', background: 'var(--c-surface)', cursor: 'pointer', transition: 'all var(--transition-fast)', textAlign: 'left', textDecoration: 'none', color: 'inherit', display: 'block' }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 22, height: 22, color: 'var(--c-primary)', marginBottom: 8 }}>{a.icon}</svg>
                  <strong style={{ display: 'block', fontSize: 'var(--fs-sm)', marginBottom: 2, fontFamily: 'var(--font-head)', color: 'var(--c-text)' }}>{a.t}</strong>
                  <span style={{ color: 'var(--c-text-muted)', fontSize: 12 }}>{a.s}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Lien vers paramètres */}
          <div style={{ background: 'var(--c-primary)', borderRadius: 'var(--r-lg)', padding: 22, color: 'white' }}>
            <h4 style={{ color: 'white', fontSize: 'var(--fs-md)', marginBottom: 8 }}>Complétez votre profil</h4>
            <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 'var(--fs-sm)', marginBottom: 16 }}>Ajoutez votre SIRET, TVA, certifications pour apparaître dans les résultats.</p>
            <Link href="/dashboard/artisan/parametres" className="btn btn-sm" style={{ background: 'white', color: 'var(--c-primary)', fontFamily: 'var(--font-head)', fontWeight: 700 }}>
              Compléter mon profil →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
