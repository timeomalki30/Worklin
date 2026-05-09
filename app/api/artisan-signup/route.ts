import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { prenom, nom, email, phone, metier, ville, siret, certifications } = body

  if (!email || !metier) return NextResponse.json({ error: 'Email et métier requis' }, { status: 400 })

  const supabase = createAdminClient()
  await supabase.from('artisan_pioneers').upsert({
    prenom, nom, email, phone, metier, ville, siret,
    certifications: certifications || {},
    created_at: new Date().toISOString(),
  }, { onConflict: 'email' })

  if (process.env.BREVO_API_KEY) {
    try {
      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          attributes: { PRENOM: prenom, NOM: nom, METIER: metier, VILLE: ville },
          listIds: [process.env.BREVO_ARTISAN_LIST_ID ? parseInt(process.env.BREVO_ARTISAN_LIST_ID) : 3],
          updateEnabled: true,
        }),
      })
    } catch {}
  }

  return NextResponse.json({ ok: true })
}
