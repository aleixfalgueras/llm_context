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

// Context type definition
interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslationFunction
}

// Create the context
const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

// Provider props
interface TranslationProviderProps {
  children: ReactNode
  initialLocale?: Locale
}

// Storage key for persisting locale preference
const LOCALE_STORAGE_KEY = 'app-locale'

// Translation Provider Component
export function TranslationProvider({ 
  children, 
  initialLocale = defaultLocale 
}: TranslationProviderProps) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale)

  // Load saved locale from localStorage on mount
  useEffect(() => {
    try {
      const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY)
      if (savedLocale && messages[savedLocale as Locale]) {
        setLocaleState(savedLocale as Locale)
      }
    } catch (error) {
      // Handle localStorage errors gracefully
      console.warn('Failed to load locale from localStorage:', error)
    }
  }, [])

  // Set locale and save to localStorage
  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale)
    } catch (error) {
      console.warn('Failed to save locale to localStorage:', error)
    }
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