'use client'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Edit2, Eye, EyeOff, Trash2} from 'lucide-react'
import {cn} from '@/lib/utils/general'
import {Prompt} from '@prisma/client'

interface PromptCardProps {
  prompt: Prompt
  onEdit: () => void
  onEditPrompt: (prompt: Prompt) => void
  onDelete: () => void
  onDeletePrompt: (prompt: Prompt) => void
  onToggleStatus: () => void
  onViewPrompt: (prompt: Prompt) => void
}

export function PromptCard({ prompt, onEdit, onEditPrompt, onDelete, onDeletePrompt, onToggleStatus, onViewPrompt }: PromptCardProps) {
  return (
    <Card 
      className={cn(
        'h-[240px] hover:shadow-lg transition-all duration-200 flex flex-col dark:hover:bg-blue-950/10 cursor-pointer',
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
            <Button 
              variant="ghost" 
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onEditPrompt(prompt)
              }}
              title="Edit Prompt"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            
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
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onDeletePrompt(prompt)
              }}
              title="Delete Prompt"
            >
              <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {new Date(prompt.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 