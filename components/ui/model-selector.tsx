'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { ChevronDown, Cpu, Sparkles, TrendingUp, Zap } from 'lucide-react'
import { cn } from '@/lib/utils/general'
import { AVAILABLE_MODELS } from '@/lib/models-config'
import { ModelTierType } from '@/lib/types/subscription-types'
import { useTranslations } from '@/lib/translations/context'
import {isEssentialModel} from "@/lib/utils/model-utils";

interface ModelSelectorProps {
  selectedModel: string
  onModelSelect: (modelId: string) => void
  userTier?: ModelTierType // User's subscription tier (kept for compatibility)
  className?: string
}

export function ModelSelector({ selectedModel, onModelSelect, className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)
  const t = useTranslations('assistant.modelSelector')

  const currentModel = AVAILABLE_MODELS.find(model => model.id === selectedModel)
  
  // Separate models into essential and premium categories
  const essentialModels = AVAILABLE_MODELS.filter(model => isEssentialModel(model.id))
  const premiumModels = AVAILABLE_MODELS.filter(model => !isEssentialModel(model.id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("justify-between", className)}
        >
          <Cpu className="w-4 h-4 mr-2" />
          {currentModel?.name || 'Gemini 2.0 Flash'}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[390px] p-0" align="start">
        <Command>
          <CommandInput placeholder={t('searchPlaceholder')} />
          <CommandList>
            <CommandEmpty>{t('noModelsFound')}</CommandEmpty>
            
            {/* Essential Models */}
            <CommandGroup heading={
              <div className="flex items-center gap-2">
                <Zap className="w-3 h-3" />
                <span className="text-sm font-semibold">{t('essentialModels')}</span>
              </div>
            }>
              {essentialModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => {
                    onModelSelect(model.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "cursor-pointer p-3",
                    selectedModel === model.id && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {t(`models.${model.description}.description`)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            <CommandSeparator className="my-2" />
            
            {/* Premium Models */}
            <CommandGroup heading={
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3" />
                <span className="text-sm font-semibold">{t('premiumModels')}</span>
              </div>
            }>
              {/* Usage Warning for Premium Models */}
              <div className="px-2 mb-1">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription className="text-xs pt-1">
                    {t('premiumUsageWarning')}
                  </AlertDescription>
                </Alert>
              </div>
              {premiumModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => {
                    onModelSelect(model.id)
                    setOpen(false)
                  }}
                  className={cn(
                    "cursor-pointer p-3",
                    selectedModel === model.id && "bg-blue-50 dark:bg-blue-950/20"
                  )}
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {t(`models.${model.description}.description`)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
} 