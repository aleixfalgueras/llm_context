'use client'

import {useTranslations} from '@/lib/translations/context'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {Copy, Lightbulb} from 'lucide-react'
import {PromptDialog} from '@/components/prompts/prompt-dialog'
import {SamplePrompt} from "@/lib/types/prompt-types";

interface SamplePromptCardProps {
  prompt: SamplePrompt
  onUseAsTemplate: () => void
  onSuccess: () => void
}


export function SamplePromptCard({ prompt, onSuccess }: SamplePromptCardProps) {
  const t = useTranslations('prompts')
  
  return (
    <Card className="h-[240px] hover:shadow-lg transition-all duration-200 flex flex-col">
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
          <Badge variant="outline" className="text-xs">
            {t('template.label')}
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
              <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700">
                <Copy className="h-3 w-3 mr-1" />
                {t('template.useTemplate')}
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  )
} 