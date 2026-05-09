import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Uses the service-role key to bypass RLS — this overwrites whatever
// the handle_new_user trigger inserted with the correct values.
const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(request: Request) {
  try {
    const { userId, role, prenom, nom, phone } = await request.json()

    if (!userId || !role) {
      return NextResponse.json({ error: 'Missing userId or role' }, { status: 400 })
    }

    // Force-update the profile — overwrites the trigger's hardcoded 'client'
    const { error: profileErr } = await adminSupabase
      .from('profiles')
      .upsert({ id: userId, role, prenom, nom, phone }, { onConflict: 'id' })

    if (profileErr) {
      console.error('Profile upsert error:', profileErr)
      return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    // If artisan, create the artisans row too
    if (role === 'artisan') {
      const slug = `${prenom}-${nom}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')

      const { error: artisanErr } = await adminSupabase
        .from('artisans')
        .upsert({ profile_id: userId, slug, metier: '', ville: '', actif: false }, { onConflict: 'profile_id' })

      if (artisanErr) {
        console.error('Artisan upsert error:', artisanErr)
        return NextResponse.json({ error: artisanErr.message }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
