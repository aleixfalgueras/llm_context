'use client'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Edit2, Eye, EyeOff} from 'lucide-react'
import {cn} from '@/lib/utils/general'
import {Prompt} from '@prisma/client'
import {PromptDialog} from '@/components/prompts/prompt-dialog'
import {DeletePromptDialog} from '@/components/prompts/delete-prompt-dialog'

interface PromptCardProps {
  prompt: Prompt
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
  onViewPrompt: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onEdit, onDelete, onToggleStatus, onViewPrompt }: PromptCardProps) {
  return (
    <Card 
      className={cn(
        'h-[240px] hover:shadow-lg transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-blue-100 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/5 flex flex-col cursor-pointer', 
        !prompt.isActive && 'opacity-60'
      )}
      onClick={() => onViewPrompt(prompt)}
    >
      <CardHeader className="pb-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="truncate">{prompt.name}</span>
              {!prompt.isActive && (
                <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </CardTitle>
            <div className="h-12 flex items-start">
              {prompt.description && (
                <CardDescription className="mt-1 text-sm leading-relaxed break-words overflow-hidden">
                  {prompt.description.length > 80 
                    ? `${prompt.description.substring(0, 80)}...` 
                    : prompt.description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-auto">
          <Badge variant="secondary" className="text-xs capitalize">
            {prompt.category}
          </Badge>
          {prompt.usageCount > 0 && (
            <Badge variant="outline" className="text-xs">
              Used {prompt.usageCount}x
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-1">
            <PromptDialog 
              prompt={prompt} 
              onSuccess={onEdit}
              trigger={
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Edit2 className="h-4 w-4" />
                </Button>
              }
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onToggleStatus()
              }}
            >
              {prompt.isActive ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            
            <DeletePromptDialog onDelete={onDelete} promptName={prompt.name} />
          </div>
          
          <div className="text-xs text-muted-foreground">
            {new Date(prompt.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 