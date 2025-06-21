import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'

interface ClientVariablesTooltipProps {
  children?: React.ReactNode
}

export function ClientVariablesTooltip({ children }: ClientVariablesTooltipProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children || <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />}
      </TooltipTrigger>
      <TooltipContent 
        className="max-w-sm z-[9999]" 
        side="top" 
        align="start"
        avoidCollisions={true}
        collisionPadding={10}
      >
        <div className="space-y-2">
          <p className="font-medium">Available client variables:</p>
          <div className="space-y-1 text-xs">
            <p><code>{`{client_name}`}</code> → Client's name</p>
            <p><code>{`{medical_history}`}</code> → Medical History</p>
            <p><code>{`{goals}`}</code> → Goals</p>
            <p><code>{`{age}`}</code> → Age (calculated from date of birth)</p>
            <p><code>{`{height}`}</code> → Height (cm)</p>
            <p><code>{`{weight}`}</code> → Weight (kg)</p>
            <p><code>{`{country}`}</code> → Country</p>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            These variables will be automatically replaced with actual client data when you use the prompt.
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
  )
} 