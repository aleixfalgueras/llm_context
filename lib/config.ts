// Configuration for the application

// Admin user emails
export const ADMIN_EMAILS = ['feina.aleix@gmail.com', 'a.nelson@dreamotion.io']

// Storage configuration
export const STORAGE_CONFIG = {
  DOCUMENTS_BUCKET: process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents'
} as const 