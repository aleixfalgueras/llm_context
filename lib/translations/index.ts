// Translation system configuration and type definitions
import enMessages from '@/messages/en.json'

// Define available locales
export type Locale = 'en' // Can be extended with 'es' | 'fr' | 'de' etc.

// Default locale
export const defaultLocale: Locale = 'en'

// Available locales array
export const locales: Locale[] = ['en']

// Messages type derived from the English messages structure
export type Messages = typeof enMessages

// Map of locale to messages
export const messages: Record<Locale, Messages> = {
  en: enMessages,
}

// Helper function to get nested translation value
export function getNestedTranslation(
  obj: any,
  path: string,
  fallback?: string
): string {
  const keys = path.split('.')
  let current = obj

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key]
    } else {
      return fallback || path
    }
  }

  return typeof current === 'string' ? current : fallback || path
}

// Type for translation function
export type TranslationFunction = (key: string, params?: Record<string, any>) => string

// Helper to interpolate variables in translations
export function interpolate(text: string, params?: Record<string, any>): string {
  if (!params) return text
  
  let result = text
  Object.keys(params).forEach(key => {
    const regex = new RegExp(`{{${key}}}`, 'g')
    result = result.replace(regex, String(params[key]))
  })
  
  return result
}