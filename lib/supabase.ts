import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_KEY! // Service role key for server-side operations

// Client for server-side operations (with service role key)
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)

// Client for client-side operations (with anon key)
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_KEY!
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey) 