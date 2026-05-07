import Link from 'next/link'
import {
  FileText, Receipt, Users, Calendar, Sparkles, BarChart3,
  ArrowRight, CheckCircle2, Star, Zap, Shield, Globe,
  Clock, Wrench, Hammer, Ruler, Settings2,
} from 'lucide-react'

/* ── Data ─────────────────────────────────────────────────────────── */

const MODULES = [
  {
    id: 'ai',
    icon: Sparkles,
    title: 'Devis IA',
    desc: 'Décrivez le chantier en une phrase. Le devis professionnel — lignes, TVA, total — est prêt en 30 secondes.',
    badge: 'IA',
    featured: true,
  },
  { id: 'crm',      icon: Users,    title: 'CRM Clients',     desc: 'Historique complet : devis, factures, chantiers, photos. Tout par client.' },
  { id: 'vitrine',  icon: Globe,    title: 'Vitrine publique', desc: 'Votre page sur worklin.fr/votre-nom. Formulaire de demande intégré, avis clients.' },
  { id: 'factures', icon: Receipt,  title: 'Factures',         desc: 'Convertissez un devis accepté en facture en 1 clic. Conformité 2027 native.' },
  { id: 'agenda',   icon: Calendar, title: 'Agenda',           desc: 'Planifiez vos RDV, gérez vos disponibilités, recevez des rappels.' },
  { id: 'finances', icon: BarChart3,title: 'Finances & TVA',   desc: 'CA mensuel, impayés, relances auto, synthèse TVA trimestrielle.' },
]

const PRICING = [
  {
    name: 'Starter', price: 'Gratuit', period: '', desc: 'Pour démarrer et tester',
    features: ['3 devis / mois', '3 factures / mois', 'Vitrine publique', 'CRM 50 clients', 'Support email'],
    cta: 'Démarrer gratuitement', href: '/register', highlight: false,
  },
  {
    name: 'Pro', price: '29€', period: '/mois', desc: 'Pour les artisans actifs',
    features: ['Devis illimités', 'Factures illimitées', 'Devis IA (50/mois)', 'CRM illimité', 'Chantiers & photos', 'Rappels SMS/email', 'Support prioritaire'],
    cta: 'Essai 14 jours gratuit', href: '/register?plan=pro', highlight: true,
  },
  {
    name: 'Business', price: '59€', period: '/mois', desc: 'Pour les artisans en croissance',
    features: ['Tout Pro', 'Devis IA illimité', 'Multi-artisan', 'API & intégrations', 'Accès comptable', 'SLA 4h', 'Onboarding dédié'],
    cta: 'Contacter les ventes', href: '/register?plan=business', highlight: false,
  },
]

const TESTIMONIALS = [
  { name: 'Marc D.',   metier: 'Plombier · Lyon',         note: 5, text: 'J\'ai gagné 3h par semaine sur l\'admin. Les devis IA sont bluffants de précision.' },
  { name: 'Sophie R.', metier: 'Électricienne · Paris',   note: 5, text: 'Ma vitrine publique m\'a ramené 4 nouveaux clients ce mois. Impensable avant.' },
  { name: 'Karim B.',  metier: 'Peintre · Bordeaux',      note: 5, text: 'Le suivi des impayés m\'a fait récupérer 2 800 € que j\'aurais perdus.' },
]

/* ── Page ──────────────────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div>

      {/* ═══════════════════════════════════════════════════════════
          HERO — dark full-screen
      ═══════════════════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen overflow-hidden flex flex-col"
        style={{ backgroundColor: '#0B2440' }}
      >

        {/* ── Blueprint grid ── */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)
            `,
            backgroundSize: '52px 52px',
          }}
        />

        {/* ── Ambient glow orbs ── */}
        <div
          className="animate-orb-1 absolute pointer-events-none"
          style={{
            top: '-15%', left: '-8%',
            width: '700px', height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(221,90,42,0.14) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="animate-orb-2 absolute pointer-events-none"
          style={{
            bottom: '5%', right: '-5%',
            width: '550px', height: '550px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(221,90,42,0.09) 0%, transparent 65%)',
            filter: 'blur(80px)',
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            top: '35%', left: '45%',
            width: '600px', height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(79,124,189,0.07) 0%, transparent 55%)',
            filter: 'blur(100px)',
            transform: 'translate(-50%, -50%)',
          }}
        />

        {/* ── Floating tool silhouettes ── */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden select-none" aria-hidden="true">
          <div style={{ position: 'absolute', top: '10%',  left:  '5%',  opacity: 0.065, animation: 'float-tool 15s ease-in-out infinite',          color: 'white' }}><Wrench    size={80} strokeWidth={1} /></div>
          <div style={{ position: 'absolute', top: '18%',  right: '6%',  opacity: 0.055, animation: 'float-tool 19s ease-in-out infinite reverse',    color: 'white' }}><Hammer    size={96} strokeWidth={1} /></div>
          <div style={{ position: 'absolute', bottom:'22%',left:  '3%',  opacity: 0.05,  animation: 'float-tool 23s ease-in-out infinite 4s',         color: 'white' }}><Ruler     size={72} strokeWidth={1} /></div>
          <div style={{ position: 'absolute', bottom:'28%',right: '4%',  opacity: 0.04,  animation: 'float-tool 17s ease-in-out infinite 7s reverse',  color: 'white' }}><Settings2 size={88} strokeWidth={1} /></div>
          <div style={{ position: 'absolute', top:  '50%', left: '10%',  opacity: 0.04,  animation: 'float-tool 21s ease-in-out infinite 10s',         color: 'white' }}><Sparkles  size={60} strokeWidth={1} /></div>
          <div style={{ position: 'absolute', top:  '7%',  right:'22%',  opacity: 0.035, animation: 'float-tool 25s ease-in-out infinite 5s reverse',  color: 'white' }}><FileText  size={64} strokeWidth={1} /></div>
          <div style={{ position: 'absolute', bottom:'12%',left: '32%',  opacity: 0.03,  animation: 'float-tool 28s ease-in-out infinite 2s',          color: 'white' }}><Wrench    size={48} strokeWidth={1} /></div>
        </div>

        {/* ── Nav ── */}
        <nav className="relative z-10 w-full border-b border-white/[0.06]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2.5 no-underline">
              <div className="w-8 h-8 bg-terra-500 rounded-lg grid place-items-center shadow-glow">
                <span className="text-white font-black text-sm" style={{ fontFamily: 'var(--font-manrope)' }}>W</span>
              </div>
              <span className="font-black text-white text-lg tracking-tight" style={{ fontFamily: 'var(--font-manrope)' }}>Worklin</span>
            </Link>

            <div className="hidden md:flex items-center gap-8">
              {[['#fonctionnalites','Fonctionnalités'],['#tarifs','Tarifs'],['#temoignages','Avis']].map(([href, label]) => (
                <a key={href} href={href}
                  className="text-sm font-medium text-white/55 hover:text-white no-underline transition-colors">
                  {label}
                </a>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <Link href="/login" className="hidden md:block text-white/55 hover:text-white text-sm font-medium no-underline transition-colors">
                Connexion
              </Link>
              <Link href="/register" className="btn btn-terra btn-sm no-underline">Essai gratuit</Link>
            </div>
          </div>
        </nav>

        {/* ── Hero content ── */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-20">

          {/* Badge */}
          <div className="inline-flex items-center gap-2.5 rounded-full px-4 py-1.5 mb-10 border border-white/12 text-white/60 text-sm font-medium"
               style={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(8px)' }}>
            <span className="w-1.5 h-1.5 rounded-full bg-terra-400 animate-pulse inline-block flex-shrink-0" />
            Bêta ouverte · Rejoignez les pionniers
          </div>

          {/* H1 — Worklin */}
          <h1
            className="text-white font-black leading-none mb-5"
            style={{
              fontFamily: 'var(--font-manrope)',
              fontSize: 'clamp(72px, 11vw, 128px)',
              letterSpacing: '-0.055em',
              lineHeight: 0.9,
            }}
          >
            Worklin
          </h1>

          {/* Terracotta subtitle */}
          <p
            className="font-bold mb-6"
            style={{
              fontFamily: 'var(--font-manrope)',
              fontSize: 'clamp(19px, 2.4vw, 26px)',
              color: '#DD5A2A',
              letterSpacing: '-0.02em',
            }}
          >
            L&apos;OS des artisans qui avancent
          </p>

          {/* Description */}
          <p className="text-white/45 max-w-lg mx-auto mb-10 leading-relaxed" style={{ fontSize: '17px' }}>
            Devis IA, factures conformes 2027, CRM clients, agenda et vitrine publique.
            Tout ce dont un artisan solo a besoin — dans une seule app.
          </p>

          {/* CTA bar */}
          <form action="/register" method="GET"
            className="flex flex-col sm:flex-row gap-2 w-full max-w-md mx-auto mb-4">
            <input
              type="email"
              name="email"
              placeholder="Votre email professionnel…"
              className="flex-1 px-5 py-3.5 rounded-xl text-white text-sm placeholder:text-white/35 outline-none transition-all"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.13)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <button type="submit" className="btn btn-terra px-5 py-3.5 whitespace-nowrap">
              Démarrer <ArrowRight size={15} />
            </button>
          </form>

          <p className="text-white/28 text-xs mb-14">
            Sans carte bancaire · Essai 14 jours gratuit sur le plan Pro
          </p>

          {/* Trust signals */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-white/38">
            {[
              { icon: Star,         label: '4.9 / 5 satisfaction' },
              { icon: Shield,       label: 'Données hébergées en France' },
              { icon: CheckCircle2, label: 'Conformité 2027 garantie' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <Icon size={13} style={{ color: 'rgba(221,90,42,0.6)' }} className="flex-shrink-0" />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ── Wave transition — blade/architectural cut → cream ── */}
        <div className="relative z-10 w-full" style={{ marginBottom: '-1px' }}>
          <svg
            viewBox="0 0 1440 88"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
            style={{ display: 'block', width: '100%', height: '88px' }}
          >
            {/* Two-facet blade shape: sharp asymmetric angular cut */}
            <path d="M0 88 L0 52 L420 14 L900 62 L1440 8 L1440 88 Z" fill="#F5F1E8" />
            {/* Subtle highlight edge */}
            <path d="M0 52 L420 14 L900 62 L1440 8" fill="none" stroke="rgba(221,90,42,0.18)" strokeWidth="1" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════
          REST OF PAGE — cream background
      ═══════════════════════════════════════════════════════════ */}
      <div style={{ backgroundColor: '#F5F1E8' }}>

        {/* ── Grain SVG overlay ── */}
        <svg
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 w-full h-full"
          style={{ opacity: 0.025, zIndex: 0 }}
        >
          <filter id="grain">
            <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="4" stitchTiles="stitch" />
          </filter>
          <rect width="100%" height="100%" filter="url(#grain)" />
        </svg>

        {/* ═══ BENTO GRID — Modules ═══ */}
        <section id="fonctionnalites" className="max-w-6xl mx-auto px-6 py-24 relative z-10">
          <div className="text-center mb-14">
            <div className="inline-flex items-center gap-2 bg-navy-800/8 text-navy-700 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest mb-5">
              <Zap size={13} /> 6 modules intégrés
            </div>
            <h2 className="font-black text-navy-800 mb-4"
                style={{ fontFamily: 'var(--font-manrope)', fontSize: 'clamp(28px, 4vw, 44px)' }}>
              Un OS complet pour votre activité
            </h2>
            <p className="text-navy-500 text-lg">Plus besoin de jongler entre 6 outils différents</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Devis IA — featured tall */}
            <div className="md:row-span-2 bg-gradient-to-br from-terra-500 to-terra-700 rounded-3xl p-8 flex flex-col justify-between relative overflow-hidden group"
                 style={{ minHeight: '340px' }}>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3 transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/3" />
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/15 rounded-2xl grid place-items-center backdrop-blur-sm">
                    <Sparkles size={22} className="text-white" />
                  </div>
                  <span className="bg-white text-terra-600 text-xs font-black px-3 py-1 rounded-full">IA</span>
                </div>
                <h3 className="text-2xl font-black text-white mb-3" style={{ fontFamily: 'var(--font-manrope)' }}>
                  Devis IA
                </h3>
                <p className="text-white/80 leading-relaxed text-sm">
                  Décrivez le chantier en une phrase. Le devis — lignes détaillées, TVA, totaux — est prêt en 30 secondes.
                  Propulsé par Claude AI.
                </p>
              </div>
              <div className="relative z-10 mt-8">
                <div className="bg-white/10 border border-white/20 rounded-2xl p-4 text-sm text-white/90 italic backdrop-blur-sm">
                  &ldquo;Rénovation SDB 8m², baignoire + faïence + robinetterie&rdquo;
                </div>
                <div className="flex items-center gap-2 mt-3 text-white/60 text-xs">
                  <Clock size={12} />
                  Devis généré en 28 secondes
                </div>
              </div>
            </div>

            {/* CRM */}
            <div className="card-hover p-7 flex flex-col gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-navy-700 to-navy-900 rounded-2xl grid place-items-center">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-800 mb-1.5" style={{ fontFamily: 'var(--font-manrope)' }}>CRM Clients</h3>
                <p className="text-sm text-navy-500 leading-relaxed">Historique complet : devis, factures, chantiers, photos. Tout par client.</p>
              </div>
            </div>

            {/* Vitrine */}
            <div className="card-hover p-7 flex flex-col gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-navy-600 to-navy-800 rounded-2xl grid place-items-center">
                <Globe size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-800 mb-1.5" style={{ fontFamily: 'var(--font-manrope)' }}>Vitrine publique</h3>
                <p className="text-sm text-navy-500 leading-relaxed">Votre page sur worklin.fr/votre-nom avec formulaire de demande intégré.</p>
              </div>
            </div>

            {/* Factures */}
            <div className="card-hover p-7 flex flex-col gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-navy-700 to-navy-800 rounded-2xl grid place-items-center">
                <Receipt size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-800 mb-1.5" style={{ fontFamily: 'var(--font-manrope)' }}>Factures</h3>
                <p className="text-sm text-navy-500 leading-relaxed">Convertissez un devis en facture en 1 clic. Conformité 2027 native.</p>
              </div>
            </div>

            {/* Agenda */}
            <div className="card-hover p-7 flex flex-col gap-4">
              <div className="w-11 h-11 bg-gradient-to-br from-navy-600 to-navy-700 rounded-2xl grid place-items-center">
                <Calendar size={20} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-navy-800 mb-1.5" style={{ fontFamily: 'var(--font-manrope)' }}>Agenda</h3>
                <p className="text-sm text-navy-500 leading-relaxed">Planifiez vos RDV, gérez vos disponibilités, recevez des rappels.</p>
              </div>
            </div>

            {/* Finances */}
            <div className="md:col-span-2 card-hover p-7 flex items-center gap-6">
              <div className="w-14 h-14 bg-gradient-to-br from-navy-800 to-navy-900 rounded-2xl grid place-items-center flex-shrink-0">
                <BarChart3 size={24} className="text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-navy-800 mb-1" style={{ fontFamily: 'var(--font-manrope)' }}>Finances & TVA</h3>
                <p className="text-sm text-navy-500 leading-relaxed">CA mensuel, suivi des impayés, relances automatiques, synthèse TVA par trimestre.</p>
              </div>
              <div className="hidden md:flex items-end gap-1 flex-shrink-0">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="w-3 rounded-t-sm bg-navy-200 hover:bg-terra-400 transition-colors"
                       style={{ height: `${h * 0.6}px` }} />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ═══ AI BANNER ═══ */}
        <section className="max-w-6xl mx-auto px-6 pb-20 relative z-10">
          <div className="ai-gradient rounded-3xl p-10 md:p-14 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="absolute bottom-0 left-1/2 w-64 h-64 bg-terra-400/10 rounded-full translate-y-1/2 pointer-events-none" />
            <div className="relative max-w-2xl">
              <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
                <Sparkles size={14} /> Propulsé par Claude AI
              </div>
              <h2 className="font-black mb-4 text-white"
                  style={{ fontFamily: 'var(--font-manrope)', fontSize: 'clamp(24px, 3.5vw, 36px)' }}>
                Décrivez le chantier.<br />Le devis se génère tout seul.
              </h2>
              <p className="text-white/75 mb-8 leading-relaxed">
                &ldquo;Rénovation complète salle de bain 8m², remplacement baignoire, faïence, robinetterie&rdquo;
                &nbsp;→ Devis professionnel avec 8 lignes de détail et TVA en 30 secondes.
              </p>
              <Link href="/register"
                className="inline-flex items-center gap-2 bg-white text-navy-800 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-cream-200 transition-colors no-underline shadow-md">
                Générer mon premier devis IA
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ═══ TESTIMONIALS ═══ */}
        <section id="temoignages" className="max-w-6xl mx-auto px-6 py-20 relative z-10">
          <div className="text-center mb-14">
            <h2 className="font-black text-navy-800 mb-3"
                style={{ fontFamily: 'var(--font-manrope)', fontSize: 'clamp(26px, 4vw, 42px)' }}>
              Ils ont adopté Worklin
            </h2>
            <p className="text-navy-500">Des artisans qui ont sauté le pas</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="card-hover p-7 flex flex-col gap-4">
                <div className="flex gap-0.5">
                  {[...Array(t.note)].map((_, j) => (
                    <Star key={j} size={15} className="text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
                <p className="text-navy-700 leading-relaxed flex-1">&ldquo;{t.text}&rdquo;</p>
                <div className="pt-2 border-t border-cream-300">
                  <div className="font-bold text-navy-800 text-sm">{t.name}</div>
                  <div className="text-xs text-navy-400 mt-0.5">{t.metier}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ PRICING ═══ */}
        <section id="tarifs" className="max-w-6xl mx-auto px-6 py-20 relative z-10">
          <div className="text-center mb-14">
            <h2 className="font-black text-navy-800 mb-3"
                style={{ fontFamily: 'var(--font-manrope)', fontSize: 'clamp(26px, 4vw, 42px)' }}>
              Tarifs simples, sans surprise
            </h2>
            <p className="text-navy-500">Commencez gratuitement. Passez Pro quand vous êtes prêt.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            {PRICING.map((plan) => (
              <div
                key={plan.name}
                className={`card p-8 flex flex-col relative transition-all duration-200 ${
                  plan.highlight
                    ? 'ring-2 ring-terra-500 md:scale-105 shadow-glow'
                    : 'hover:shadow-card-lg'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-terra-500 text-white text-xs font-black px-5 py-1.5 rounded-full shadow-sm whitespace-nowrap">
                    ⭐ Le plus populaire
                  </div>
                )}
                <div className="mb-6">
                  <div className="text-xs font-black text-navy-400 mb-3 uppercase tracking-widest">{plan.name}</div>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="font-black text-navy-800"
                          style={{ fontFamily: 'var(--font-manrope)', fontSize: '40px' }}>
                      {plan.price}
                    </span>
                    {plan.period && <span className="text-navy-400 text-lg">{plan.period}</span>}
                  </div>
                  <p className="text-sm text-navy-500">{plan.desc}</p>
                </div>
                <ul className="flex-1 space-y-3 mb-8">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2.5 text-sm text-navy-700">
                      <CheckCircle2 size={15} className="text-terra-500 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={plan.href}
                  className={`btn btn-lg w-full justify-center no-underline ${plan.highlight ? 'btn-terra' : 'btn-secondary'}`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ CONFORMITÉ ═══ */}
        <section className="max-w-6xl mx-auto px-6 pb-20 relative z-10">
          <div className="card p-8 md:p-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-16 h-16 bg-green-50 border border-green-200 rounded-2xl grid place-items-center flex-shrink-0">
              <Shield size={28} className="text-green-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h3 className="text-xl font-bold text-navy-800 mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>
                Conformité réforme facturation électronique 2027
              </h3>
              <p className="text-navy-500 text-sm leading-relaxed">
                Numérotation séquentielle, mentions légales obligatoires, SIRET/TVA intracommunautaire,
                conservation 10 ans, export PPF/PDP. Worklin prépare votre conformité dès aujourd&apos;hui.
              </p>
            </div>
            <Link href="/register" className="btn btn-primary btn-lg whitespace-nowrap no-underline flex-shrink-0">
              Démarrer maintenant
            </Link>
          </div>
        </section>

        {/* ═══ FOOTER ═══ */}
        <footer className="bg-navy-800 text-white relative z-10">
          <div className="max-w-6xl mx-auto px-6 py-16">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div>
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 bg-terra-500 rounded-lg grid place-items-center shadow-glow">
                    <span className="font-black text-sm text-white" style={{ fontFamily: 'var(--font-manrope)' }}>W</span>
                  </div>
                  <span className="font-black text-lg" style={{ fontFamily: 'var(--font-manrope)' }}>Worklin</span>
                </div>
                <p className="text-white/45 text-sm leading-relaxed">L&apos;OS des artisans solos en France.</p>
              </div>
              {[
                { title: 'Produit', items: ['Fonctionnalités', 'Tarifs', 'Vitrine publique', 'API'] },
                { title: 'Support', items: ['Documentation', 'Centre d\'aide', 'Contact', 'Status'] },
                { title: 'Légal',   items: ['CGU', 'Confidentialité', 'Mentions légales', 'RGPD'] },
              ].map(col => (
                <div key={col.title}>
                  <div className="font-bold text-white/90 mb-4 text-xs uppercase tracking-widest">{col.title}</div>
                  <ul className="space-y-2.5">
                    {col.items.map(item => (
                      <li key={item}>
                        <a href="#" className="text-white/45 hover:text-white text-sm transition-colors no-underline">{item}</a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-white/35 text-sm">© 2026 Worklin. Tous droits réservés.</p>
              <p className="text-white/35 text-xs">Conformité facturation électronique 2027 · Données hébergées en France</p>
            </div>
          </div>
        </footer>

      </div>{/* end cream wrapper */}
    </div>
  )
}
