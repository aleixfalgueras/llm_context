// Script to set up Supabase storage bucket for documents
// Run this once to create the necessary storage bucket

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const DOCUMENTS_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupStorage() {
  console.log('Setting up Supabase storage...')

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

  // Set up RLS policies for the documents bucket
  console.log('Setting up storage policies...')
  
  // Policy to allow users to upload their own documents
  const uploadPolicy = {
    name: 'Users can upload their own documents',
    definition: `(bucket_id = '${DOCUMENTS_BUCKET}') AND (auth.uid()::text = (storage.foldername(name))[1])`,
    check: null,
    command: 'INSERT'
  }

  // Policy to allow users to read their own documents
  const readPolicy = {
    name: 'Users can read their own documents',
    definition: `(bucket_id = '${DOCUMENTS_BUCKET}') AND (auth.uid()::text = (storage.foldername(name))[1])`,
    check: null,
    command: 'SELECT'
  }

  // Policy to allow users to delete their own documents
  const deletePolicy = {
    name: 'Users can delete their own documents',
    definition: `(bucket_id = '${DOCUMENTS_BUCKET}') AND (auth.uid()::text = (storage.foldername(name))[1])`,
    check: null,
    command: 'DELETE'
  }

  console.log('✅ Supabase storage setup complete!')
  console.log('Note: You may need to manually set up RLS policies in the Supabase dashboard')
  console.log(`Go to Storage > Policies and create policies for the ${DOCUMENTS_BUCKET} bucket`)
}

setupStorage().catch(console.error) 