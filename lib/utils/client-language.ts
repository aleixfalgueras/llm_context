import { getTranslations, Locale } from '@/lib/translations'
import { messages } from '@/lib/translations'

// Available language codes
export const LANGUAGE_CODES = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'ca'] as const
export type LanguageCode = typeof LANGUAGE_CODES[number]

export interface LanguageInfo {
  code: string
  label: string
}

// Helper function to get language options for forms
export async function getLanguageOptionsServer(locale: Locale = 'en'): Promise<Array<{ value: string; label: string }>> {
  const t = await getTranslations('languages', locale)
  
  return LANGUAGE_CODES.map(code => ({
    value: code,
    label: t(code)
  }))
}

// Client-side version for components
export function getLanguageOptionsClient(locale: Locale = 'en'): Array<{ value: string; label: string }> {
  const currentMessages = messages[locale]
  
  return LANGUAGE_CODES.map(code => ({
    value: code,
    label: currentMessages.languages?.[code as keyof typeof currentMessages.languages]
  }))
}

// Helper function to get language info by code
export async function getLanguageInfoServer(code: string, locale: Locale = 'en'): Promise<LanguageInfo> {
  const t = await getTranslations('languages', locale)
  const normalizedCode = code?.toLowerCase()
  
  // Check if it's a valid language code
  if (LANGUAGE_CODES.includes(normalizedCode as LanguageCode)) {
    return {
      code: normalizedCode,
      label: t(normalizedCode)
    }
  }
  
  // Fallback for unknown languages
  return {
    code: normalizedCode || 'unknown',
    label: code || 'Unknown'
  }
}

// Client-side version for components
export function getLanguageInfoClient(code: string, locale: Locale = 'en'): LanguageInfo {
  const currentMessages = messages[locale]
  const normalizedCode = code?.toLowerCase()
  
  // Check if it's a valid language code
  if (LANGUAGE_CODES.includes(normalizedCode as LanguageCode)) {
    return {
      code: normalizedCode,
      label: currentMessages.languages?.[normalizedCode as keyof typeof currentMessages.languages] || code
    }
  }
  
  // Fallback for unknown languages
  return {
    code: normalizedCode || 'unknown',
    label: code || 'Unknown'
  }
}