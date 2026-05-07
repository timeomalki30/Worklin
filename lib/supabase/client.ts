import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback values prevent build-time throws when env vars aren't set yet;
  // actual requests will fail gracefully until real values are provided.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder-anon-key'
  return createBrowserClient(url, key)
}
