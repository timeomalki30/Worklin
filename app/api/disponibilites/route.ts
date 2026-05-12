import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

type DispoPayload = {
  artisan_id: string
  date: string
  heure_debut?: string
  heure_fin?: string
  disponible?: boolean
  type_absence?: string
  note?: string
}

// POST — insert one or many dispo/indispo rows (service role bypasses RLS)
export async function POST(req: Request) {
  try {
    const body = await req.json()

    // Accept both a single object and an array
    const rows: DispoPayload[] = Array.isArray(body) ? body : [body]

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No rows to insert' }, { status: 400 })
    }

    // Basic validation
    for (const row of rows) {
      if (!row.artisan_id || !row.date) {
        return NextResponse.json({ error: 'Each row must have artisan_id and date' }, { status: 400 })
      }
    }

    // Normalise optional fields
    const clean = rows.map(r => ({
      artisan_id:  r.artisan_id,
      date:        r.date,
      heure_debut: r.heure_debut  ?? '08:00',
      heure_fin:   r.heure_fin    ?? '18:00',
      disponible:  r.disponible   ?? true,
      ...(r.type_absence ? { type_absence: r.type_absence } : {}),
      ...(r.note         ? { note: r.note }                 : {}),
    }))

    const { data, error } = await admin
      .from('disponibilites')
      .insert(clean)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json(data) // returns array
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE — remove a single slot by id
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
