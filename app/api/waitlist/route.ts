import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { email, prenom } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email requis' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('waitlist').upsert({ email, prenom }, { onConflict: 'email' })
  if (error && !error.message.includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (process.env.BREVO_API_KEY) {
    try {
      await fetch('https://api.brevo.com/v3/contacts', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          attributes: { PRENOM: prenom },
          listIds: [parseInt(process.env.BREVO_WAITLIST_LIST_ID || '2')],
          updateEnabled: true,
        }),
      })
    } catch (e) {
      console.warn('[waitlist] Brevo error:', e)
    }
  }

  return NextResponse.json({ ok: true })
}
