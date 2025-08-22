'use client'

import React from 'react'
import { useLocale, useSetLocale, useTranslations } from '@/lib/translations/context'
import { locales, type Locale } from '@/lib/translations'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Globe, Check } from 'lucide-react'

export function LanguageSwitcher() {
  const locale = useLocale()
  const setLocale = useSetLocale()
  const t = useTranslations('language')

  // Map of locale codes to display names
  const localeNames: Record<Locale, string> = {
    en: t('english'),
    // Future locales can be added here
    // es: t('spanish'),
    // fr: t('french'),
    // de: t('german'),
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 px-3">
          <Globe className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline-block">{localeNames[locale]}</span>
          <span className="sm:hidden">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {locales.map((loc) => (
          <DropdownMenuItem
            key={loc}
            onClick={() => setLocale(loc)}
            className="cursor-pointer"
          >
            <div className="flex items-center justify-between w-full">
              <span>{localeNames[loc]}</span>
              {locale === loc && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        {/* Placeholder for future languages - commented out for now */}
        {/* 
        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
          <div className="flex items-center justify-between w-full">
            <span>Español (Coming Soon)</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed">
          <div className="flex items-center justify-between w-full">
            <span>Français (Coming Soon)</span>
          </div>
        </DropdownMenuItem>
        */}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}