import Link from 'next/link'
import {
  FileText, Receipt, Users, Calendar, Sparkles, BarChart3,
  ArrowRight, CheckCircle2, Star, Zap, Shield, Globe
} from 'lucide-react'

const MODULES = [
  { icon: <Sparkles size={24} />, title: 'Devis IA', desc: 'Générez un devis professionnel en 30 secondes à partir d\'une description ou d\'une photo de chantier.', color: 'from-terra-500 to-terra-600', badge: 'IA' },
  { icon: <Receipt size={24} />, title: 'Factures', desc: 'Transformez un devis en facture en 1 clic. Conformité 2027, numérotation auto, envoi PDF par email.', color: 'from-navy-700 to-navy-800' },
  { icon: <Users size={24} />, title: 'CRM Client', desc: 'Historique complet par client, devis, factures, chantiers, photos. Tout au même endroit.', color: 'from-navy-600 to-navy-700' },
  { icon: <Calendar size={24} />, title: 'Agenda', desc: 'Gérez vos disponibilités, confirmez des RDV, recevez des rappels automatiques.', color: 'from-navy-700 to-navy-800' },
  { icon: <Globe size={24} />, title: 'Vitrine publique', desc: 'Votre page personnelle sur worklin.fr/votre-nom. Formulaire de demande devis intégré.', color: 'from-navy-600 to-navy-700' },
  { icon: <BarChart3 size={24} />, title: 'Finances & TVA', desc: 'CA mensuel, suivi des impayés, relances automatiques, synthèse TVA par trimestre.', color: 'from-navy-800 to-navy-900' },
]

const PRICING = [
  {
    name: 'Starter',
    price: 'Gratuit',
    period: '',
    desc: 'Pour démarrer et tester',
    features: ['3 devis/mois', '3 factures/mois', 'Vitrine publique', 'CRM 50 clients', 'Support email'],
    cta: 'Démarrer gratuitement',
    href: '/register',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '29€',
    period: '/mois',
    desc: 'Pour les artisans actifs',
    features: ['Devis illimités', 'Factures illimitées', 'Devis IA (50/mois)', 'CRM illimité', 'Chantiers & photos', 'Rappels SMS/email', 'Support prioritaire'],
    cta: 'Essai 14 jours gratuit',
    href: '/register?plan=pro',
    highlight: true,
  },
  {
    name: 'Business',
    price: '59€',
    period: '/mois',
    desc: 'Pour les artisans en croissance',
    features: ['Tout Pro', 'Devis IA illimité', 'Multi-artisan', 'API & intégrations', 'Comptable accès', 'SLA 4h', 'Onboarding dédié'],
    cta: 'Contacter les ventes',
    href: '/register?plan=business',
    highlight: false,
  },
]

const TESTIMONIALS = [
  { name: 'Marc D.', metier: 'Plombier, Lyon', note: 5, text: 'J\'ai gagné 3h par semaine sur l\'admin. Les devis IA sont bluffants de précision.' },
  { name: 'Sophie R.', metier: 'Électricienne, Paris', note: 5, text: 'Ma vitrine publique m\'a ramené 4 nouveaux clients ce mois. Impensable avant.' },
  { name: 'Karim B.', metier: 'Peintre, Bordeaux', note: 5, text: 'Le suivi des impayés m\'a fait récupérer 2 800 € que j\'aurais perdus.' },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-cream-200">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-cream-200/90 backdrop-blur-md border-b border-cream-300">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 no-underline">
            <div className="w-8 h-8 bg-navy-800 rounded-lg grid place-items-center">
              <span className="text-white font-black text-sm" style={{ fontFamily: 'var(--font-manrope)' }}>W</span>
            </div>
            <span className="font-black text-navy-800 text-lg" style={{ fontFamily: 'var(--font-manrope)' }}>Worklin</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            {['Fonctionnalités', 'Tarifs', 'Vitrine'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-navy-600 hover:text-navy-800 no-underline transition-colors">{item}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn btn-ghost btn-sm hidden md:inline-flex">Connexion</Link>
            <Link href="/register" className="btn btn-terra btn-sm">Essai gratuit</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 bg-terra-50 text-terra-700 border border-terra-200 rounded-full px-4 py-1.5 text-sm font-semibold mb-8">
          <Zap size={14} />
          L&apos;OS complet pour artisans solos en France
        </div>
        <h1 className="text-5xl md:text-7xl font-black text-navy-800 leading-tight mb-6" style={{ fontFamily: 'var(--font-manrope)', letterSpacing: '-0.03em' }}>
          Gérez tout.
          <br />
          <span className="text-terra-500">Perdez rien.</span>
        </h1>
        <p className="text-xl text-navy-500 max-w-2xl mx-auto mb-10 leading-relaxed">
          Devis IA, factures conformes 2027, CRM clients, agenda, vitrine publique et assistant IA.
          Tout ce dont un artisan solo a besoin, dans une seule app.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
          <Link href="/register" className="btn btn-terra btn-lg">
            Démarrer gratuitement
            <ArrowRight size={20} />
          </Link>
          <Link href="/demo" className="btn btn-ghost btn-lg">
            Voir une démo →
          </Link>
        </div>
        {/* Stats */}
        <div className="grid grid-cols-3 gap-8 max-w-lg mx-auto">
          {[['2 min', 'pour créer un devis'], ['0€', 'pour commencer'], ['2027', 'conformité garantie']].map(([val, label]) => (
            <div key={val} className="text-center">
              <div className="text-3xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{val}</div>
              <div className="text-xs text-navy-400 mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Modules */}
      <section id="fonctionnalités" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Un OS complet pour votre activité</h2>
          <p className="text-navy-500 text-lg">Plus besoin de jongler entre 6 outils différents</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODULES.map((m, i) => (
            <div key={i} className="card p-6 hover:shadow-md transition-shadow group">
              <div className={`w-12 h-12 bg-gradient-to-br ${m.color} rounded-2xl grid place-items-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {m.icon}
              </div>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-lg font-bold text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{m.title}</h3>
                {m.badge && <span className="badge badge-terra text-xs">{m.badge}</span>}
              </div>
              <p className="text-sm text-navy-500 leading-relaxed">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* AI Feature Banner */}
      <section className="max-w-6xl mx-auto px-6 py-8 mb-12">
        <div className="ai-gradient rounded-3xl p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <Sparkles size={14} />
              Propulsé par Claude AI
            </div>
            <h2 className="text-3xl font-black mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>
              Décrivez le chantier. Le devis se génère tout seul.
            </h2>
            <p className="text-white/80 mb-8 leading-relaxed">
              &ldquo;Rénovation complète salle de bain 8m², remplacement baignoire, faïence, robinetterie&rdquo;
              → Devis professionnel en 30 secondes avec lignes détaillées et TVA auto.
            </p>
            <Link href="/register" className="inline-flex items-center gap-2 bg-white text-navy-800 px-6 py-3 rounded-2xl font-bold text-sm hover:bg-cream-200 transition-colors no-underline">
              Générer mon premier devis IA
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="tarifs" className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Tarifs simples, sans surprise</h2>
          <p className="text-navy-500 text-lg">Commencez gratuitement. Passez Pro quand vous êtes prêt.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {PRICING.map((plan) => (
            <div key={plan.name} className={`card p-8 flex flex-col relative ${plan.highlight ? 'ring-2 ring-terra-500 shadow-xl scale-105' : ''}`}>
              {plan.highlight && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-terra-500 text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  Le plus populaire
                </div>
              )}
              <div className="mb-6">
                <div className="text-sm font-bold text-navy-400 mb-2 uppercase tracking-wider">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-navy-800" style={{ fontFamily: 'var(--font-manrope)' }}>{plan.price}</span>
                  {plan.period && <span className="text-navy-400">{plan.period}</span>}
                </div>
                <p className="text-sm text-navy-500">{plan.desc}</p>
              </div>
              <ul className="flex-1 space-y-3 mb-8">
                {plan.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-navy-700">
                    <CheckCircle2 size={16} className="text-terra-500 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link href={plan.href} className={`btn btn-lg w-full justify-center no-underline text-center ${plan.highlight ? 'btn-terra' : 'btn-secondary'}`}>
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-black text-navy-800 mb-4" style={{ fontFamily: 'var(--font-manrope)' }}>Ils ont adopté Worklin</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="card p-6">
              <div className="flex gap-0.5 mb-4">
                {[...Array(t.note)].map((_, j) => <Star key={j} size={16} className="text-yellow-400 fill-yellow-400" />)}
              </div>
              <p className="text-navy-700 text-sm leading-relaxed mb-4">&ldquo;{t.text}&rdquo;</p>
              <div>
                <div className="font-bold text-navy-800 text-sm">{t.name}</div>
                <div className="text-xs text-navy-400">{t.metier}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Conformité */}
      <section className="max-w-6xl mx-auto px-6 py-12 mb-16">
        <div className="card p-8 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 bg-green-100 rounded-2xl grid place-items-center flex-shrink-0">
            <Shield size={32} className="text-green-700" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-navy-800 mb-2" style={{ fontFamily: 'var(--font-manrope)' }}>Conformité réforme facturation électronique 2027</h3>
            <p className="text-navy-500 text-sm leading-relaxed">
              Numérotation séquentielle automatique, mentions légales obligatoires, SIRET/TVA intracommunautaire,
              conservation 10 ans, export PPF/PDP. Worklin prépare votre conformité dès aujourd&apos;hui.
            </p>
          </div>
          <Link href="/register" className="btn btn-primary btn-lg whitespace-nowrap no-underline">
            Démarrer maintenant
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-navy-800 text-white">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-white/10 rounded-lg grid place-items-center">
                  <span className="font-black text-sm">W</span>
                </div>
                <span className="font-black text-lg">Worklin</span>
              </div>
              <p className="text-white/50 text-sm">L&apos;OS des artisans solos en France.</p>
            </div>
            {[
              { title: 'Produit', items: ['Fonctionnalités', 'Tarifs', 'Vitrine publique', 'API'] },
              { title: 'Support', items: ['Documentation', 'Centre d\'aide', 'Contact', 'Status'] },
              { title: 'Légal', items: ['CGU', 'Confidentialité', 'Mentions légales', 'RGPD'] },
            ].map(col => (
              <div key={col.title}>
                <div className="font-bold text-white/90 mb-4 text-sm uppercase tracking-wider">{col.title}</div>
                <ul className="space-y-2">
                  {col.items.map(item => (
                    <li key={item}><a href="#" className="text-white/50 hover:text-white text-sm transition-colors no-underline">{item}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-sm">© 2025 Worklin. Tous droits réservés.</p>
            <p className="text-white/40 text-xs">Conforme réforme facturation électronique 2027 · Données hébergées en France</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
