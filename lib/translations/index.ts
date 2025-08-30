// Translation system configuration and type definitions
import enMessages from '@/messages/en.json'
import frMessages from '@/messages/fr.json'


export type Locale = 'en' | 'fr'
export const defaultLocale: Locale = 'en'
export const locales: Locale[] = ['en', 'fr']

export type Messages = typeof enMessages

// Map of locale to messages
export const messages: Record<Locale, Messages> = {
  en: enMessages,
  fr: frMessages,
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

// Server-side translation function for use in server actions
export async function getTranslations(namespace?: string): Promise<TranslationFunction> {
   // For now, always use default locale on server
  const currentMessages = messages[defaultLocale]
  
  return (key: string, params?: Record<string, any>) => {
    // If namespace is provided, prepend it to the key
    const fullKey = namespace ? 
      (key.startsWith(namespace + '.') ? key : `${namespace}.${key}`) : 
      key
    
    const translation = getNestedTranslation(currentMessages, fullKey, key)
    return interpolate(translation, params)
  }
}