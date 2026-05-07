import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { prompt, mode } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'Prompt requis' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Clé API Anthropic manquante. Configurez ANTHROPIC_API_KEY dans vos variables d\'environnement.' }, { status: 500 })

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: 'Tu es un assistant spécialisé pour les artisans français. Tu réponds en français, de façon concise et professionnelle. Tu connais parfaitement la réglementation française (TVA BTP, conformité 2027, mentions légales obligatoires, normes RGE).',
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      return NextResponse.json({ error: err.error?.message || 'Erreur API Anthropic' }, { status: response.status })
    }

    const data = await response.json()
    const result = data.content?.[0]?.text || ''
    return NextResponse.json({ result })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Erreur serveur' }, { status: 500 })
  }
}
