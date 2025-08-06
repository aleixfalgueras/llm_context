import { Info } from 'lucide-react'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { CLIENT_CONTEXT_VARIABLES, CLIENT_FIELD_LABELS } from '@/lib/types/client-types'
import {getAvailableClientContextVariables} from "@/services/client/client-context-service";

// Generate variable descriptions dynamically from CLIENT_CONTEXT_VARIABLES
const variableDescriptions: Record<string, string> = Object.entries(CLIENT_CONTEXT_VARIABLES).reduce(
  (acc, [field, variable]) => {
    const key = `{${variable}}`
    const description = CLIENT_FIELD_LABELS[field as keyof typeof CLIENT_FIELD_LABELS] || 'Client data'
    return { ...acc, [key]: description }
  },
  {} as Record<string, string>
)

export function ClientContextVariablesTooltip() {
  const availableVariables = getAvailableClientContextVariables()

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