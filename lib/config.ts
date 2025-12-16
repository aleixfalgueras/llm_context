// Configuration for the application

// Admin user emails
export const ADMIN_EMAILS = ['feina.aleix@gmail.com', 'a.nelson@dreamotion.io', 'stolwijkstefan@gmail.com']

// Storage configuration
export const STORAGE_CONFIG = {
  DOCUMENTS_BUCKET: process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents',
  DOCUMENTS_DEALS: process.env.SUPABASE_DEALS_BUCKET || 'deals',
} as const

// Locale configuration
export const LOCALE_CONFIG = {
  COOKIE_NAME: 'app-locale',
  MAX_AGE: 60 * 60 * 24 * 365 // 1 year
} as const 