import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    _client = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://placeholder.supabase.co',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
    )
  }
  return _client
}

export const isSupabaseAvailable = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  return !!url && url !== 'placeholder' && url.startsWith('http')
}
