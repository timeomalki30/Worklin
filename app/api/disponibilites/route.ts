import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// POST — insert a disponibilité or indisponibilité
export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { artisan_id, date, heure_debut, heure_fin, disponible, type_absence } = body

    if (!artisan_id || !date) {
      return NextResponse.json({ error: 'artisan_id and date are required' }, { status: 400 })
    }

    const payload: Record<string, unknown> = {
      artisan_id,
      date,
      heure_debut: heure_debut ?? '08:00',
      heure_fin: heure_fin ?? '18:00',
      disponible: disponible ?? true,
    }
    if (type_absence) payload.type_absence = type_absence

    const { data, error } = await admin
      .from('disponibilites')
      .insert(payload)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data)
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE — remove a slot by id
export async function DELETE(req: Request) {
  try {
    const { id } = await req.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const { error } = await admin.from('disponibilites').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
