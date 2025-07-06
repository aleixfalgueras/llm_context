import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

export function ClientVariablesTooltip() {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs z-[60]" avoidCollisions={true} collisionPadding={10}>
          <div className="space-y-2">
            <p className="font-medium">Available Variables:</p>
            <div className="text-sm space-y-1">
              <p><code>{`{country}`}</code> → Client's country/location</p>
              <p><code>{`{general_context}`}</code> → Client's general context</p>
              <p><code>{`{specific_context_1}`}</code> → Client's specific context 1</p>
              <p><code>{`{specific_context_2}`}</code> → Client's specific context 2</p>
              <p><code>{`{specific_context_3}`}</code> → Client's specific context 3</p>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Variables will be automatically replaced with actual client data when used.
            </p>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 