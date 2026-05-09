import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const adminSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function GET(request: Request) {
  try {
    // Expect: Authorization: Bearer <access_token>
    const authHeader = request.headers.get('authorization') || ''
    const token = authHeader.replace('Bearer ', '').trim()

    if (!token) {
      return NextResponse.json({ role: 'artisan' }) // safe default
    }

    // Verify the token and get the user with the admin client
    const { data: { user }, error } = await adminSupabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ role: 'artisan' })
    }

    // Query profiles with service role — bypasses RLS
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    return NextResponse.json({ role: profile?.role || 'artisan' })
  } catch {
    return NextResponse.json({ role: 'artisan' })
  }
}
