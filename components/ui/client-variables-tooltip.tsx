import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { getAvailableVariables } from '@/lib/ai/variable-replacement'

const variableDescriptions: Record<string, string> = {
  '{country}': "Client's country/location",
  '{general_context}': "Client's general context",
  '{specific_context_1}': "Client's specific context 1",
  '{specific_context_2}': "Client's specific context 2",
  '{specific_context_3}': "Client's specific context 3",
}

export function ClientVariablesTooltip() {
  const availableVariables = getAvailableVariables()

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
              {availableVariables.map((variable) => (
                <p key={variable}>
                  <code>{variable}</code> → {variableDescriptions[variable] || 'Client data'}
                </p>
              ))}
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