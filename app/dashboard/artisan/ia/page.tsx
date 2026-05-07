'use client'
import { Sparkles, Camera, MessageSquare, Mail, ShieldCheck, Lock, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const MODULES = [
  {
    icon: Camera,
    title: 'Devis depuis photo',
    desc: 'Prenez une photo d\'un chantier ou d\'un plan. L\'IA génère automatiquement un devis détaillé avec lignes, quantités et prix.',
    badge: 'IA Vision',
    color: 'from-terra-500 to-terra-700',
  },
  {
    icon: MessageSquare,
    title: 'Réponse leads automatique',
    desc: 'Dès qu\'un client soumet une demande via votre vitrine, l\'IA qualifie le lead et rédige une réponse personnalisée en votre nom.',
    badge: 'IA Leads',
    color: 'from-navy-600 to-navy-800',
  },
  {
    icon: Mail,
    title: 'Rédaction email pro',
    desc: 'Relances clients, confirmations de RDV, suivis de chantier — l\'IA rédige des emails professionnels en 10 secondes.',
    badge: 'IA Texte',
    color: 'from-navy-700 to-navy-900',
  },
  {
    icon: ShieldCheck,
    title: 'Vérification TVA & conformité',
    desc: 'Décrivez la prestation, l\'IA vérifie le taux de TVA applicable (5,5 / 10 / 20%) et les mentions légales obligatoires 2027.',
    badge: 'IA Légal',
    color: 'from-navy-500 to-navy-700',
  },
]

export default function IAPage() {
  return (
    <div className="space-y-8 max-w-3xl">

      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-terra-500 to-terra-600 rounded-2xl grid place-items-center">
            <Sparkles size={20} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>
            Assistant IA
          </h1>
        </div>
        <p className="text-navy-400">Propulsé par Claude AI · Adapté aux artisans français</p>
      </div>

      {/* Coming soon banner */}
      <div className="rounded-2xl overflow-hidden border border-terra-200"
           style={{ background: 'linear-gradient(135deg, #0B2440 0%, #1A4A8A 100%)' }}>
        <div className="p-8 relative overflow-hidden">
          {/* Decorative orb */}
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
               style={{ background: 'radial-gradient(circle, rgba(221,90,42,0.2) 0%, transparent 65%)', filter: 'blur(40px)', transform: 'translate(30%, -30%)' }} />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-1.5 mb-6">
              <Lock size={13} className="text-terra-400" />
              <span className="text-white/80 text-sm font-semibold">Module IA disponible après financement</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-3" style={{ fontFamily: 'var(--font-manrope)' }}>
              Bientôt disponible — Rejoignez la liste d&apos;attente
            </h2>
            <p className="text-white/60 mb-6 leading-relaxed max-w-lg">
              Ces 4 modules IA sont en développement actif. Ils seront disponibles dans la prochaine version de Worklin,
              financée par la communauté d&apos;artisans pionniers.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="inline-flex items-center gap-2 bg-terra-500 hover:bg-terra-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors no-underline">
                <Sparkles size={15} />
                Rejoindre les pionniers
                <ArrowRight size={14} />
              </Link>
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 text-white/70 px-5 py-2.5 rounded-xl text-sm">
                Notification à la sortie
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 feature cards — disabled */}
      <div>
        <p className="text-sm font-semibold text-navy-400 uppercase tracking-wider mb-4">Ce qui vous attend</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon
            return (
              <div key={mod.title}
                   className="card p-6 flex flex-col gap-4 relative overflow-hidden opacity-80 select-none">
                {/* Disabled overlay */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-cream-200 border border-cream-400 rounded-full px-2.5 py-1">
                  <Lock size={10} className="text-navy-400" />
                  <span className="text-[10px] font-bold text-navy-400 uppercase tracking-wide">Bientôt</span>
                </div>

                {/* Icon */}
                <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${mod.color} grid place-items-center flex-shrink-0`}>
                  <Icon size={20} className="text-white" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{mod.title}</h3>
                    <span className="text-[9px] font-black bg-terra-100 text-terra-600 px-1.5 py-0.5 rounded-md tracking-wide">
                      {mod.badge}
                    </span>
                  </div>
                  <p className="text-sm text-navy-500 leading-relaxed">{mod.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Roadmap timeline */}
      <div className="card p-6">
        <h3 className="font-bold text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Roadmap</h3>
        <div className="space-y-3">
          {[
            { phase: 'v1.0 — Actuel', items: 'Devis, Factures, CRM, Agenda, Vitrine, Finances', done: true },
            { phase: 'v1.5 — Q3 2026', items: 'Assistant IA (4 modules), Devis depuis photo', done: false },
            { phase: 'v2.0 — Q1 2027', items: 'Multi-artisan, API, Intégrations comptables', done: false },
          ].map((row) => (
            <div key={row.phase} className={`flex items-start gap-4 p-4 rounded-xl border ${row.done ? 'border-green-200 bg-green-50/50' : 'border-cream-300'}`}>
              <div className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${row.done ? 'bg-green-500' : 'bg-cream-400'}`} />
              <div>
                <div className={`font-bold text-sm ${row.done ? 'text-green-800' : 'text-navy-700'}`}>{row.phase}</div>
                <div className="text-xs text-navy-400 mt-0.5">{row.items}</div>
              </div>
              {row.done && <span className="ml-auto badge badge-green text-[10px]">Disponible</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
