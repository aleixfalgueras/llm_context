// Configuration for the application
export const STORAGE_CONFIG = {
  DOCUMENTS_BUCKET: process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents'
} as const 