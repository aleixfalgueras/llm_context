'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb, Copy } from 'lucide-react'
import { samplePrompts } from '@/lib/sample-prompts'
import { PromptDialog } from '@/components/prompts/prompt-dialog'

interface SamplePromptCardProps {
  prompt: typeof samplePrompts[0]
  onUseAsTemplate: () => void
  onSuccess: () => void
}

export function SamplePromptCard({ prompt, onUseAsTemplate, onSuccess }: SamplePromptCardProps) {
  return (
    <Card className="h-[240px] hover:shadow-lg transition-all duration-200 hover:border-amber-200 dark:hover:border-amber-800 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 border-amber-100 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/5 flex flex-col">
      <CardHeader className="pb-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span className="truncate">{prompt.name}</span>
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
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            Template
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex gap-2 pt-2 border-t">
          <PromptDialog 
            prompt={{
              id: '', // Will be generated when saved
              name: prompt.name,
              description: prompt.description,
              content: prompt.content,
              category: prompt.category,
              isActive: true,
              usageCount: 0
            }}
            isTemplate={true}
            onSuccess={onSuccess}
            trigger={
              <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                <Copy className="h-3 w-3 mr-1" />
                Use Template
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  )
} 