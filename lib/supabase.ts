import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_KEY! // Service role key for server-side operations

// Client for server-side operations (with service role key)
// This is the only client needed since all operations are server-side with Clerk auth
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)