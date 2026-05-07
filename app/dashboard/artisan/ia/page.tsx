'use client'
import { useState } from 'react'
import { Sparkles, Send, Copy, FileText, Mail, AlertTriangle, Wand2 } from 'lucide-react'

type Mode = 'devis' | 'email' | 'qualification' | 'tva'

const MODES: { id: Mode; label: string; icon: any; desc: string; placeholder: string }[] = [
  {
    id: 'devis',
    label: 'Générer un devis',
    icon: FileText,
    desc: 'Décrivez le chantier en quelques mots. L\'IA génère les lignes, quantités et prix.',
    placeholder: 'Ex: Rénovation complète salle de bain 8m², dépose et repose baignoire, remplacement faïence, nouvelle robinetterie, forfait déplacement 20km...',
  },
  {
    id: 'email',
    label: 'Rédiger un email pro',
    icon: Mail,
    desc: 'Décrivez la situation. L\'IA rédige un email professionnel en votre nom.',
    placeholder: 'Ex: Relancer un client qui ne répond pas depuis 2 semaines pour un devis de 3500€ de plomberie...',
  },
  {
    id: 'qualification',
    label: 'Qualifier un lead',
    icon: Sparkles,
    desc: 'Collez la demande client. L\'IA l\'analyse et vous donne une réponse qualifiée.',
    placeholder: 'Ex: "Bonjour, j\'ai une fuite au niveau de mon lavabo depuis hier, ça coule sous le meuble, j\'habite au 3ème étage, est-ce que vous pouvez venir?"...',
  },
  {
    id: 'tva',
    label: 'Vérifier TVA / devis',
    icon: AlertTriangle,
    desc: 'Collez votre devis ou décrivez la prestation. L\'IA vérifie la TVA applicable.',
    placeholder: 'Ex: Pose de fenêtres dans une maison principale construite en 2005, client particulier, montant HT 4200€...',
  },
]

export default function IAPage() {
  const [mode, setMode] = useState<Mode>('devis')
  const [input, setInput] = useState('')
  const [output, setOutput] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [history, setHistory] = useState<{ mode: Mode; input: string; output: string }[]>([])

  const currentMode = MODES.find(m => m.id === mode)!

  const handleGenerate = async () => {
    if (!input.trim()) return
    setLoading(true)
    setOutput('')

    const prompts: Record<Mode, string> = {
      devis: `Tu es un assistant spécialisé pour les artisans français. Génère des lignes de devis détaillées à partir de cette description de chantier.

Description: ${input}

Réponds avec un tableau JSON de lignes au format:
[{"description": "...", "quantite": X, "unite": "h|m²|forfait|u", "prix_unitaire": X, "tva_pct": X}]

Utilise les taux de TVA français corrects (5.5% pour travaux rénovation énergie, 10% pour travaux amélioration résidence principale >2 ans, 20% pour neuf ou pro).
Après le JSON, donne un résumé en 2-3 phrases des choix effectués.`,

      email: `Tu es un assistant pour artisans français. Rédige un email professionnel, chaleureux mais direct, en français.

Situation: ${input}

L'email doit être:
- Professionnel sans être froid
- Court et efficace (max 10 lignes)
- Avec formule de politesse adaptée
- Signé "Cordialement, [Votre nom]"`,

      qualification: `Tu es un assistant pour artisans français. Analyse cette demande client et fournis:
1. Qualification du lead (urgent/normal/low priority)
2. Estimation rapide de la complexité (simple/moyen/complexe)
3. Questions à poser au client
4. Suggestion de réponse rapide par SMS/email
5. Estimation de prix indicative si possible

Demande: ${input}`,

      tva: `Tu es un expert comptable spécialisé dans le BTP français. Analyse la TVA applicable.

Situation: ${input}

Réponds avec:
1. Taux de TVA applicable et pourquoi
2. Conditions à vérifier (ancienneté du bien, type de client, etc.)
3. Si plusieurs taux sont possibles, lequel privilégier et pourquoi
4. Mentions obligatoires à inclure dans le devis
5. ⚠️ Points de vigilance`,
    }

    try {
      const response = await fetch('/api/ia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompts[mode], mode }),
      })
      const data = await response.json()
      const result = data.result || data.error || 'Erreur lors de la génération'
      setOutput(result)
      setHistory(prev => [{ mode, input: input.slice(0, 100), output: result }, ...prev.slice(0, 4)])
    } catch {
      setOutput('Erreur de connexion. Vérifiez votre clé API Anthropic.')
    }
    setLoading(false)
  }

  const copyOutput = () => {
    navigator.clipboard.writeText(output)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-navy-800 flex items-center gap-3" style={{ fontFamily: 'var(--font-manrope)' }}>
          <span className="w-10 h-10 bg-gradient-to-br from-terra-500 to-terra-600 rounded-2xl grid place-items-center text-white flex-shrink-0">
            <Sparkles size={20} />
          </span>
          Assistant IA
        </h1>
        <p className="text-navy-400 mt-1">Propulsé par Claude AI · Adapté aux artisans français</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {MODES.map(m => {
          const Icon = m.icon
          const active = mode === m.id
          return (
            <button key={m.id} onClick={() => setMode(m.id)}
              className={`p-4 rounded-2xl border-2 text-left transition-all ${active ? 'border-terra-500 bg-terra-50' : 'border-cream-300 bg-white hover:border-navy-300'}`}>
              <Icon size={20} className={`mb-2 ${active ? 'text-terra-600' : 'text-navy-500'}`} />
              <div className={`font-bold text-sm ${active ? 'text-terra-700' : 'text-navy-700'}`}>{m.label}</div>
            </button>
          )
        })}
      </div>

      {/* Main input */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm font-semibold text-navy-600">{currentMode.desc}</span>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder={currentMode.placeholder}
          rows={5}
          className="form-textarea w-full mb-4"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-navy-400">{input.length} caractères</span>
          <button onClick={handleGenerate} disabled={loading || !input.trim()} className="btn btn-terra">
            {loading ? <span className="spinner" /> : <Wand2 size={16} />}
            {loading ? 'Génération en cours…' : 'Générer avec l\'IA'}
          </button>
        </div>
      </div>

      {/* Output */}
      {(output || loading) && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-terra-500 rounded-md grid place-items-center">
                <Sparkles size={13} className="text-white" />
              </div>
              <span className="font-semibold text-navy-800 text-sm">Résultat</span>
            </div>
            {output && (
              <button onClick={copyOutput} className="btn btn-ghost btn-sm">
                <Copy size={13} />
                {copied ? 'Copié !' : 'Copier'}
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex items-center gap-3 text-navy-400">
              <span className="spinner" />
              <span className="text-sm">Claude génère votre contenu…</span>
            </div>
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-navy-700 leading-relaxed font-sans bg-cream-50 rounded-xl p-4 max-h-[500px] overflow-y-auto">{output}</pre>
          )}
          {mode === 'devis' && output && output.includes('[') && (
            <div className="mt-4 p-3 bg-terra-50 rounded-xl border border-terra-100">
              <p className="text-xs text-terra-700 font-semibold">
                💡 Copiez le JSON et collez-le dans &quot;Créer un devis&quot; (section import JSON) pour pré-remplir les lignes automatiquement.
              </p>
            </div>
          )}
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="card p-6">
          <h2 className="font-bold text-navy-800 mb-4 text-sm" style={{ fontFamily: 'var(--font-manrope)' }}>Historique de session</h2>
          <div className="space-y-3">
            {history.map((h, i) => (
              <button key={i} onClick={() => { setMode(h.mode); setOutput(h.output) }}
                className="w-full text-left p-3 rounded-xl border border-cream-300 hover:bg-cream-50 transition-colors">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-terra-600 uppercase">{MODES.find(m => m.id === h.mode)?.label}</span>
                </div>
                <p className="text-xs text-navy-500 truncate">{h.input}…</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
