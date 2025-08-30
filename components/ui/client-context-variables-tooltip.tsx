'use client'

import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { useTranslations } from '@/lib/translations/context'
import { getAvailableContextVariables } from '@/lib/utils/client-context-utils'
import * as Portal from '@radix-ui/react-portal'

export function ClientContextVariablesTooltip() {
  const t = useTranslations('clientContext')
  const availableVariables = getAvailableContextVariables(t)

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <Portal.Root>
          <TooltipContent side="bottom" className="max-w-xs z-[9999]" avoidCollisions={true} collisionPadding={10}>
            <div className="space-y-2">
              <p className="font-medium">{t('tooltip.title')}</p>
              <div className="text-sm space-y-1">
                {availableVariables.map(({ variable, description }) => (
                  <p key={variable}>
                    <code>{variable}</code> → {description}
                  </p>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t('tooltip.info')}
              </p>
            </div>
          </TooltipContent>
        </Portal.Root>
      </Tooltip>
    </TooltipProvider>
  )
}