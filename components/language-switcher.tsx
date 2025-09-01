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
  const t = useTranslations('languages')

  // Map of locale codes to display names
  const localeNames: Record<Locale, string> = {
    en: t('en'),
    fr: t('fr'),
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="w-8 h-8">
          <Globe className="h-4 w-4" />
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
      </DropdownMenuContent>
    </DropdownMenu>
  )
}