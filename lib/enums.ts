
export enum ServiceStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable',
  COMING_SOON = 'coming_soon'
}

export enum ConsentAction {
  GRANTED = 'granted',
  WITHDRAWN = 'withdrawn',
  UPDATED = 'updated'
}

export enum ConsentType {
  DATA_PROCESSING = 'data_processing',
  ANALYTICS = 'analytics',
  MARKETING = 'marketing',
  COOKIES_ANALYTICS = 'cookies_analytics',
  COOKIES_MARKETING = 'cookies_marketing',
  COOKIES_FUNCTIONAL = 'cookies_functional'
}

// =============================================================================
// UI AND COMPONENT VARIANTS
// =============================================================================

export enum ToastVariant {
  DEFAULT = 'default',
  DESTRUCTIVE = 'destructive',
  SUCCESS = 'success'
}

export enum ButtonVariant {
  DEFAULT = 'default',
  DESTRUCTIVE = 'destructive',
  OUTLINE = 'outline',
  SECONDARY = 'secondary',
  GHOST = 'ghost',
  LINK = 'link'
}

export enum BadgeVariant {
  DEFAULT = 'default',
  SECONDARY = 'secondary',
  DESTRUCTIVE = 'destructive',
  OUTLINE = 'outline'
}

export enum ViewMode {
  GRID = 'grid',
  TABLE = 'table'
}

export enum ClientSortMode {
  CREATED = 'created',
  NAME = 'name'
}

// =============================================================================
// LANGUAGES
// =============================================================================

export enum Language {
  ENGLISH = 'english',
  SPANISH = 'spanish',
  FRENCH = 'french',
  GERMAN = 'german',
  ITALIAN = 'italian',
  PORTUGUESE = 'portuguese',
  DUTCH = 'dutch',
  POLISH = 'polish',
  RUSSIAN = 'russian',
  CATALAN = 'catalan'
}

// Language display information TODO: are we using that or values from translation files
export const LANGUAGE_INFO: Record<Language, { label: string; flag: string }> = {
  [Language.ENGLISH]: { label: 'English', flag: '🇺🇸' },
  [Language.SPANISH]: { label: 'Spanish (Español)', flag: '🇪🇸' },
  [Language.FRENCH]: { label: 'French (Français)', flag: '🇫🇷' },
  [Language.GERMAN]: { label: 'German (Deutsch)', flag: '🇩🇪' },
  [Language.ITALIAN]: { label: 'Italian (Italiano)', flag: '🇮🇹' },
  [Language.PORTUGUESE]: { label: 'Portuguese (Português)', flag: '🇵🇹' },
  [Language.DUTCH]: { label: 'Dutch (Nederlands)', flag: '🇳🇱' },
  [Language.POLISH]: { label: 'Polish (Polski)', flag: '🇵🇱' },
  [Language.RUSSIAN]: { label: 'Russian (Русский)', flag: '🇷🇺' },
  [Language.CATALAN]: { label: 'Catalan (Català)', flag: '🏴󠁥󠁳󠁣󠁴󠁿' }
}

// Helper function to get language options for forms
export function getLanguageOptions() {
  return Object.entries(LANGUAGE_INFO).map(([value, info]) => ({
    value,
    label: info.label,
    flag: info.flag
  }))
}
