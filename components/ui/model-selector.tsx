'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { ChevronDown, Cpu } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AVAILABLE_MODELS } from '@/lib/models-config'

interface ModelSelectorProps {
  selectedModel: string
  onModelSelect: (modelId: string) => void
  className?: string
}

export function ModelSelector({ selectedModel, onModelSelect, className }: ModelSelectorProps) {
  const [open, setOpen] = useState(false)

  const currentModel = AVAILABLE_MODELS.find(model => model.id === selectedModel)

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
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models..." />
          <CommandList>
            <CommandEmpty>No models found.</CommandEmpty>
            <CommandGroup heading="OpenAI Models">
              {AVAILABLE_MODELS.map((model) => (
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
                  <div className="flex flex-col gap-1">
                    <div className="font-medium">{model.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {model.description}
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