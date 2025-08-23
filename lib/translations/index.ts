// Translation system configuration and type definitions
import enMessages from '@/messages/en.json'


export type Locale = 'en'
export const defaultLocale: Locale = 'en'
export const locales: Locale[] = ['en']

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