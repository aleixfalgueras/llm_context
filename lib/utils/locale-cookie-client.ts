'use client'

import { type Locale, locales } from '@/lib/translations'
import { LOCALE_CONFIG } from '@/lib/config'

/**
 * Client-side: Set locale in cookie
 * Used when user changes language preference
 */
export function setDocumentLocaleCookie(locale: Locale): void {
  // Set cookie with proper configuration
  document.cookie = `${LOCALE_CONFIG.COOKIE_NAME}=${locale}; path=/; max-age=${LOCALE_CONFIG.MAX_AGE}; samesite=lax${
    window.location.protocol === 'https:' ? '; secure' : ''
  }`
}

/**
 * Client-side: Get locale from cookie
 * Used in client components to read current locale
 */
export function getLocaleFromDocumentCookies(): Locale | null {
  if (typeof document === 'undefined') {
    return null
  }
  
  const cookies = document.cookie.split(';')
  
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === LOCALE_CONFIG.COOKIE_NAME) {
      // Validate that it's a valid locale
      if (locales.includes(value as Locale)) {
        return value as Locale
      }
    }
  }
  
  return null
}
