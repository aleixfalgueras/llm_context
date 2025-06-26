// Script to set up Supabase storage bucket for documents
// Run this once to create the necessary storage bucket
// Usage: node scripts/setup-supabase-storage.js <env-file>
// Example: node scripts/setup-supabase-storage.js .env.development

const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Get the environment file from command line arguments
const envFile = process.argv[2]

if (!envFile) {
  console.error('❌ Error: Environment file parameter is required')
  console.log('Usage: node scripts/setup-supabase-storage.js <env-file>')
  console.log('Examples:')
  console.log('  node scripts/setup-supabase-storage.js .env.development')
  console.log('  node scripts/setup-supabase-storage.js .env.production')
  process.exit(1)
}

// Validate environment file parameter
if (envFile !== '.env.development' && envFile !== '.env.production') {
  console.error('❌ Error: Invalid environment file')
  console.log('Allowed values: .env.development or .env.production')
  console.log('Usage: node scripts/setup-supabase-storage.js <env-file>')
  process.exit(1)
}

// Load the specified environment file
require('dotenv').config({ path: path.resolve(process.cwd(), envFile) })

console.log(`🔧 Using environment file: ${envFile}`)

const DOCUMENTS_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(`❌ Missing Supabase environment variables in ${envFile}`)
  console.log('Required variables:')
  console.log('  - NEXT_PUBLIC_SUPABASE_URL')
  console.log('  - SUPABASE_KEY')
  console.log('  - SUPABASE_DOCUMENTS_BUCKET (optional, defaults to "documents")')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  console.log('Setting up Supabase storage...')
  console.log(`Target bucket: ${DOCUMENTS_BUCKET}`)

  // Create the documents bucket
  const { data: bucket, error: bucketError } = await supabase.storage.createBucket(DOCUMENTS_BUCKET, {
    public: false, // Private bucket - only authenticated users can access
    allowedMimeTypes: ['text/markdown', 'text/plain'],
    fileSizeLimit: 10485760, // 10MB limit
  })

  if (bucketError && bucketError.message !== 'The resource already exists') {
    console.error('Error creating bucket:', bucketError)
    return
  }

  if (bucket) {
    console.log(`✅ ${DOCUMENTS_BUCKET} bucket created successfully`)
  } else {
    console.log(`ℹ️ ${DOCUMENTS_BUCKET} bucket already exists`)
  }

}

setupStorage().catch(console.error) 