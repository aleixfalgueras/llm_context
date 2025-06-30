'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronDown, Cpu, Crown, Zap, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AVAILABLE_MODELS, getModelsByTier } from '@/lib/models-config'
import { ModelTier, ModelTierType } from '@/types/subscription-types'

interface ModelSelectorProps {
  selectedModel: string
  onModelSelect: (modelId: string) => void
  userTier?: ModelTierType // User's subscription tier
  className?: string
}

export function ModelSelector({ selectedModel, onModelSelect, userTier = ModelTier.BASIC, className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)

  const currentModel = AVAILABLE_MODELS.find(model => model.id === selectedModel)
  const availableModels = getModelsByTier(userTier)
  const basicModels = AVAILABLE_MODELS.filter(model => model.tier === ModelTier.BASIC)
  const proModels = AVAILABLE_MODELS.filter(model => model.tier === ModelTier.PRO)

  const canAccessModel = (modelId: string) => {
    return availableModels.some(model => model.id === modelId)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("justify-between", className)}
        >
          <Cpu className="w-4 h-4 mr-2" />
          {currentModel?.name || 'Select Model'}
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            
            {/* Basic Tier Models */}
            <CommandGroup heading={
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                Cost-Effective Models
              </div>
            }>
              {basicModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => {
                    if (canAccessModel(model.id)) {
                      onModelSelect(model.id)
                      setOpen(false)
                    }
                  }}
                  className={cn(
                    "cursor-pointer p-3",
                    selectedModel === model.id && "bg-blue-50 dark:bg-blue-950/20",
                    !canAccessModel(model.id) && "opacity-50"
                  )}
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{model.name}</div>
                      {!canAccessModel(model.id) && (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {model.description}
                    </div>
                    {model.pricing && (
                      <div className="text-xs text-green-600 dark:text-green-400">
                        ~${((model.pricing.input + model.pricing.output) / 2).toFixed(4)}/1K tokens
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>

            {/* Pro Tier Models */}
            <CommandGroup heading={
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-500" />
                Premium Models {userTier === ModelTier.BASIC && "(Pro Plan)"}
              </div>
            }>
              {proModels.map((model) => (
                <CommandItem
                  key={model.id}
                  value={model.id}
                  onSelect={() => {
                    if (canAccessModel(model.id)) {
                      onModelSelect(model.id)
                      setOpen(false)
                    }
                  }}
                  className={cn(
                    "cursor-pointer p-3",
                    selectedModel === model.id && "bg-blue-50 dark:bg-blue-950/20",
                    !canAccessModel(model.id) && "opacity-50"
                  )}
                >
                  <div className="flex flex-col gap-1 flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{model.name}</div>
                      {!canAccessModel(model.id) && (
                        <Lock className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {model.description}
                    </div>
                    {model.pricing && (
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        ~${((model.pricing.input + model.pricing.output) / 2).toFixed(4)}/1K tokens
                      </div>
                    )}
                    {!canAccessModel(model.id) && (
                      <div className="text-xs text-amber-600 dark:text-amber-400">
                        Upgrade to Pro plan for access
                      </div>
                    )}
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