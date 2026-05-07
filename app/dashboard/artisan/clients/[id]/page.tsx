'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import type { Client, Chantier, Devis, Facture } from '@/types'
import { formatCurrency } from '@/lib/utils'

export default function ClientDetailPage() {
  const router = useRouter()
  const params = useParams()
  const clientId = params?.id as string

  const [client, setClient] = useState<Client | null>(null)
  const [chantiers, setChantiers] = useState<Chantier[]>([])
  const [devis, setDevis] = useState<Devis[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const [{ data: c }, { data: ch }, { data: d }, { data: f }] = await Promise.all([
        supabase.from('clients').select('*').eq('id', clientId).single(),
        supabase.from('chantiers').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('devis').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
        supabase.from('factures').select('*').eq('client_id', clientId).order('created_at', { ascending: false }),
      ])

      setClient(c)
      setChantiers(ch || [])
      setDevis(d || [])
      setFactures(f || [])
      setLoading(false)
    }
    load()
  }, [router, clientId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="spinner w-8 h-8 border-navy-800" />
      </div>
    )
  }

  if (!client) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <p className="text-navy-500 font-semibold text-lg">Client introuvable.</p>
        <Link href="/dashboard/artisan/clients" className="btn btn-ghost btn-sm mt-4 no-underline">← Retour aux clients</Link>
      </div>
    )
  }

  const fullName = [client.prenom, client.nom].filter(Boolean).join(' ')

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/dashboard/artisan/clients" className="text-sm text-terra-600 font-semibold hover:text-terra-700 no-underline flex items-center gap-1">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        Retour aux clients
      </Link>

      {/* Header */}
      <div className="card p-6 flex items-start gap-5">
        <div
          className="w-16 h-16 rounded-full flex-shrink-0 grid place-items-center text-white font-bold text-2xl"
          style={{ background: 'var(--color-terra-500, #C0614A)' }}
        >
          {(client.prenom || '').charAt(0).toUpperCase()}{client.nom.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{fullName}</h1>
          <div className="flex flex-wrap gap-3 mt-2 text-sm text-navy-500">
            {client.email && <span>{client.email}</span>}
            {client.phone && <span>{client.phone}</span>}
            {client.adresse && <span className="truncate max-w-xs">{client.adresse}</span>}
          </div>
          {client.notes && <p className="text-sm text-navy-400 italic mt-2">{client.notes}</p>}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Chantiers', value: chantiers.length },
          { label: 'Devis', value: devis.length },
          { label: 'Factures', value: factures.length },
        ].map(s => (
          <div key={s.label} className="card px-4 py-3">
            <p className="text-2xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{s.value}</p>
            <p className="text-xs font-semibold text-navy-400 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Chantiers */}
      {chantiers.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-300 font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Chantiers</div>
          <table className="w-table">
            <thead><tr><th>Titre</th><th>Statut</th><th>Début</th><th>Fin</th></tr></thead>
            <tbody>
              {chantiers.map(c => (
                <tr key={c.id}>
                  <td className="font-semibold text-navy-700">{c.titre}</td>
                  <td><span className="badge badge-blue">{c.statut}</span></td>
                  <td className="text-navy-500">{c.date_debut ? new Date(c.date_debut).toLocaleDateString('fr-FR') : '—'}</td>
                  <td className="text-navy-500">{c.date_fin ? new Date(c.date_fin).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Devis */}
      {devis.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-300 font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Devis</div>
          <table className="w-table">
            <thead><tr><th>Numéro</th><th>Montant TTC</th><th>Statut</th><th>Date</th></tr></thead>
            <tbody>
              {devis.map(d => (
                <tr key={d.id}>
                  <td className="font-bold text-navy-700">{d.numero}</td>
                  <td className="font-semibold">{formatCurrency(d.total_ttc)}</td>
                  <td><span className="badge badge-gray">{d.statut}</span></td>
                  <td className="text-navy-500">{new Date(d.date_emission).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Factures */}
      {factures.length > 0 && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-300 font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Factures</div>
          <table className="w-table">
            <thead><tr><th>Numéro</th><th>Montant TTC</th><th>Statut</th><th>Date</th></tr></thead>
            <tbody>
              {factures.map(f => (
                <tr key={f.id}>
                  <td className="font-bold text-navy-700">{f.numero}</td>
                  <td className="font-semibold">{formatCurrency(f.total_ttc)}</td>
                  <td><span className="badge badge-gray">{f.statut}</span></td>
                  <td className="text-navy-500">{new Date(f.date_emission).toLocaleDateString('fr-FR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {chantiers.length === 0 && devis.length === 0 && factures.length === 0 && (
        <div className="card p-10 text-center text-navy-400">
          <p className="font-semibold">Aucun historique pour ce client.</p>
        </div>
      )}
    </div>
  )
}
