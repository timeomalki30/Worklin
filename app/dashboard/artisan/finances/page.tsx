'use client'
import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle, Send } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']

function CaTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: '#0B2440', color: 'white', padding: '8px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700 }}>
      <div>{label}</div>
      <div style={{ color: '#E2835A' }}>{formatCurrency(payload[0].value)}</div>
    </div>
  )
}

export default function FinancesPage() {
  const [loading, setLoading] = useState(true)
  const [factures, setFactures] = useState<any[]>([])
  const [stats, setStats] = useState({ ca_annuel: 0, ca_mois: 0, en_attente: 0, en_retard: 0, tva_collectee: 0 })
  const [monthlyData, setMonthlyData] = useState<{ label: string; ca: number }[]>([])
  const [sendingRelance, setSendingRelance] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { data: a } = await supabase.from('artisans').select('id').eq('profile_id', user.id).single()
    if (!a) return

    const year = new Date().getFullYear()
    const { data: fList } = await supabase
      .from('factures')
      .select('*, clients(nom, prenom, email)')
      .eq('artisan_id', a.id)
      .gte('date_emission', `${year}-01-01`)
      .order('date_emission', { ascending: false })

    const all = fList || []
    setFactures(all)

    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const ca_annuel = all.filter(f => f.statut === 'payee').reduce((s: number, f: any) => s + f.total_ttc, 0)
    const ca_mois = all.filter(f => f.statut === 'payee' && f.date_emission >= startOfMonth).reduce((s: number, f: any) => s + f.total_ttc, 0)
    const en_attente = all.filter(f => f.statut === 'envoyee').reduce((s: number, f: any) => s + f.total_ttc, 0)
    const today = new Date().toISOString().split('T')[0]
    const en_retard = all.filter(f => f.statut === 'envoyee' && f.date_echeance && f.date_echeance < today).reduce((s: number, f: any) => s + f.total_ttc, 0)
    const tva_collectee = all.filter(f => f.statut === 'payee').reduce((s: number, f: any) => s + f.tva, 0)
    setStats({ ca_annuel, ca_mois, en_attente, en_retard, tva_collectee })

    const monthly = MONTHS.map((label, i) => {
      const m = String(i + 1).padStart(2, '0')
      const ca = all.filter(f => f.statut === 'payee' && f.date_emission.startsWith(`${year}-${m}`)).reduce((s: number, f: any) => s + f.total_ttc, 0)
      return { label, ca }
    })
    setMonthlyData(monthly)
    setLoading(false)
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleRelance = async (factureId: string, clientEmail: string, facture: any) => {
    setSendingRelance(factureId)
    await fetch('/api/send-email', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'relance', clientEmail, factureId, facture }),
    })
    setSendingRelance(null)
  }

  const today = new Date().toISOString().split('T')[0]
  const unpaid = factures.filter(f => f.statut === 'envoyee')
  const late = factures.filter(f => f.statut === 'envoyee' && f.date_echeance && f.date_echeance < today)
  const currentMonth = new Date().getMonth()

  const tva_q = [0, 1, 2, 3].map(q => {
    const start = `${new Date().getFullYear()}-${String(q * 3 + 1).padStart(2, '0')}-01`
    const end = `${new Date().getFullYear()}-${String((q + 1) * 3).padStart(2, '0')}-31`
    const tva = factures.filter(f => f.statut === 'payee' && f.date_emission >= start && f.date_emission <= end).reduce((s: number, f: any) => s + f.tva, 0)
    return { label: `T${q + 1} ${new Date().getFullYear()}`, tva }
  })

  if (loading) return <div style={{ padding: 64, textAlign: 'center', color: 'var(--c-text-muted)' }}>Chargement…</div>

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Finances</h1>
        <p className="text-navy-400 mt-1">Année {new Date().getFullYear()}</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: 'CA annuel (payé)', value: formatCurrency(stats.ca_annuel), icon: <TrendingUp size={18} />, color: 'bg-green-500' },
          { label: 'CA ce mois', value: formatCurrency(stats.ca_mois), icon: <TrendingUp size={18} />, color: 'bg-terra-500' },
          { label: 'En attente', value: formatCurrency(stats.en_attente), icon: <AlertCircle size={18} />, color: 'bg-navy-600' },
          { label: 'En retard', value: formatCurrency(stats.en_retard), icon: <TrendingDown size={18} />, color: 'bg-red-500' },
          { label: 'TVA collectée', value: formatCurrency(stats.tva_collectee), icon: <CheckCircle size={18} />, color: 'bg-purple-500' },
        ].map((k, i) => (
          <div key={i} className="kpi-card">
            <div className={`w-9 h-9 ${k.color} rounded-xl grid place-items-center text-white mb-2`}>{k.icon}</div>
            <div className="text-xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{k.value}</div>
            <div className="text-xs font-semibold text-navy-400 uppercase tracking-wide">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Recharts BarChart */}
      <div className="card p-6">
        <h2 className="font-bold text-navy-800 mb-6" style={{ fontFamily: 'var(--font-manrope)' }}>
          CA mensuel {new Date().getFullYear()}
        </h2>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} barCategoryGap="30%">
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: '#8B8074', fontWeight: 600 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip content={<CaTooltip />} cursor={{ fill: 'rgba(11,36,64,0.05)', radius: 4 }} />
            <Bar dataKey="ca" radius={[6, 6, 0, 0]} maxBarSize={48}>
              {monthlyData.map((_, i) => (
                <Cell
                  key={i}
                  fill={i === currentMonth ? '#E2835A' : '#0B2440'}
                  opacity={i === currentMonth ? 1 : 0.25}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center gap-4 mt-3 justify-end text-xs text-navy-400">
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-terra-500" /> Mois en cours</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 rounded-sm bg-navy-800 opacity-25" /> Autres mois</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* TVA par trimestre */}
        <div className="card p-6">
          <h2 className="font-bold text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>TVA collectée par trimestre</h2>
          <div className="space-y-3">
            {tva_q.map((q, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-cream-300 last:border-0">
                <span className="font-semibold text-sm text-navy-700">{q.label}</span>
                <span className={`font-bold ${q.tva > 0 ? 'text-navy-800' : 'text-navy-300'}`}>{formatCurrency(q.tva)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2">
              <span className="font-bold text-navy-800">Total annuel</span>
              <span className="font-black text-navy-800 text-lg">{formatCurrency(stats.tva_collectee)}</span>
            </div>
          </div>
        </div>

        {/* Impayés */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-cream-300">
            <h2 className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>Factures impayées</h2>
            {late.length > 0 && <span className="badge badge-red">{late.length} en retard</span>}
          </div>
          {unpaid.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle size={32} className="mx-auto mb-3 text-green-500" />
              <p className="text-sm text-navy-500">Aucune facture impayée 🎉</p>
            </div>
          ) : (
            <div className="divide-y divide-cream-300 max-h-80 overflow-y-auto">
              {unpaid.map(f => {
                const isLate = f.date_echeance && f.date_echeance < today
                const client = f.clients
                return (
                  <div key={f.id} className="p-4 flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-navy-800">{f.numero}</span>
                        {isLate && <span className="badge badge-red text-xs">Retard</span>}
                      </div>
                      {client && <div className="text-xs text-navy-400">{client.prenom} {client.nom}</div>}
                      <div className="text-xs text-navy-400 mt-0.5">
                        {formatCurrency(f.total_ttc)}{f.date_echeance && ` · échéance ${new Date(f.date_echeance).toLocaleDateString('fr-FR')}`}
                      </div>
                    </div>
                    {client?.email && (
                      <button onClick={() => handleRelance(f.id, client.email, f)} disabled={sendingRelance === f.id} className="btn btn-sm btn-ghost flex-shrink-0">
                        {sendingRelance === f.id ? <span className="spinner" style={{ width: 13, height: 13, borderWidth: 2 }} /> : <Send size={13} />}
                        Relancer
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
