
export const LANGUAGES = {
  'en': { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  'es': { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇪🇸' },
  'fr': { code: 'fr', label: 'French', nativeLabel: 'Français', flag: '🇫🇷' },
  'de': { code: 'de', label: 'German', nativeLabel: 'Deutsch', flag: '🇩🇪' },
  'it': { code: 'it', label: 'Italian', nativeLabel: 'Italiano', flag: '🇮🇹' },
  'pt': { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇵🇹' },
  'nl': { code: 'nl', label: 'Dutch', nativeLabel: 'Nederlands', flag: '🇳🇱' },
  'pl': { code: 'pl', label: 'Polish', nativeLabel: 'Polski', flag: '🇵🇱' },
  'ru': { code: 'ru', label: 'Russian', nativeLabel: 'Русский', flag: '🇷🇺' },
  'ca': { code: 'ca', label: 'Catalan', nativeLabel: 'Català', flag: '🏴󠁥󠁳󠁣󠁴󠁿󠁥󠁳󠁣󠁴󠁿' }
} as const
export type LanguageCode = keyof typeof LANGUAGES

export interface LanguageInfo {
  code: string
  label: string
  nativeLabel: string
  flag: string
}

// Helper function to get language options for forms
export function getLanguageOptions(): Array<{ value: string; label: string; flag: string }> {
  return Object.entries(LANGUAGES).map(([code, info]) => ({
    value: code,
    label: `${info.label} (${info.nativeLabel})`,
    flag: info.flag
  }))
}

// Helper function to get language info by code
export function getLanguageInfo(code: string): LanguageInfo {
  const normalizedCode = code?.toLowerCase()
  return LANGUAGES[normalizedCode as LanguageCode] || {
    code: normalizedCode || 'unknown',
    label: code || 'Unknown',
    nativeLabel: code || 'Unknown',
    flag: '🌐'
  }
}

