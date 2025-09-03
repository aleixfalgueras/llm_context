'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import { 
  Locale, 
  defaultLocale, 
  messages, 
  getNestedTranslation, 
  interpolate,
  TranslationFunction 
} from './index'
import { getLocaleFromDocumentCookies, setDocumentLocaleCookie } from '@/lib/utils/locale-cookie-client'

interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationFunction
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

interface TranslationProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

// Translation Provider Component
export function TranslationProvider({ 
  children, 
  initialLocale = defaultLocale 
}: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  useEffect(() => {
    // Load locale from cookie on mount
    const savedLocale = getLocaleFromDocumentCookies()
    if (savedLocale && messages[savedLocale]) {
      setLocaleState(savedLocale)
    }
  }, [])

  // Set locale and save to cookie
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    setDocumentLocaleCookie(newLocale)
  }, [])

  // Translation function
  const t = useCallback<TranslationFunction>((key: string, params?: Record<string, any>) => {
    const currentMessages = messages[locale]
    const translation = getNestedTranslation(currentMessages, key, key)
    return interpolate(translation, params)
  }, [locale])

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  )
}

// Hook to use translations with optional namespace
export function useTranslations(namespace?: string): TranslationFunction {
  const context = useContext(TranslationContext)
  
  if (!context) {
    throw new Error('useTranslations must be used within a TranslationProvider')
  }

  const { t } = context

  // If namespace is provided, prepend it to all keys
  if (namespace) {
    return useCallback((key: string, params?: Record<string, any>) => {
      // If the key already starts with the namespace, don't prepend
      const fullKey = key.startsWith(namespace + '.') ? key : `${namespace}.${key}`
      return t(fullKey, params)
    }, [t, namespace])
  }

  return t
}

// Hook to get current locale
export function useLocale(): Locale {
  const context = useContext(TranslationContext)
  
  if (!context) {
    throw new Error('useLocale must be used within a TranslationProvider')
  }

  return context.locale
}

// Hook to set locale
export function useSetLocale(): (locale: Locale) => void {
  const context = useContext(TranslationContext)
  
  if (!context) {
    throw new Error('useSetLocale must be used within a TranslationProvider')
  }

  return context.setLocale
}