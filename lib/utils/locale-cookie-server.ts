import { cookies } from 'next/headers'
import { type Locale, defaultLocale, locales } from '@/lib/translations'
import { LOCALE_CONFIG } from '@/lib/config'

/**
 * Server-side: Get locale from cookies
 * Used in server components and server actions
 * This function can ONLY be used in Server Components
 */
export async function getLocaleFromCookies(): Promise<Locale> {
  const cookieStore = cookies()
  const localeCookie = cookieStore.get(LOCALE_CONFIG.COOKIE_NAME)
  
  if (localeCookie?.value) {
    if (locales.includes(localeCookie.value as Locale)) {
      return localeCookie.value as Locale
    }
  }

  return defaultLocale

}