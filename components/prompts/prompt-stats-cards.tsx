'use client'

import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {FileText, TrendingUp} from 'lucide-react'
import {Prompt, PromptStats} from '@/lib/types/prompt-management-types'

interface PromptStatsCardsProps {
  stats: PromptStats
  prompts: Prompt[]
}

export function PromptStatsCards({ stats, prompts }: PromptStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
          <FileText className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            {stats.active} active
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Most Used</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.mostUsed?.usageCount || 0}</div>
          <p className="text-xs text-muted-foreground truncate">
            {stats.mostUsed?.name || 'No usage yet'}
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Categories</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {Array.from(new Set(prompts.map(p => p.category))).length}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1 mt-2">
            {Array.from(new Set(prompts.map(p => p.category))).slice(0, 3).map((category) => (
              <Badge key={category} variant="outline" className="text-xs capitalize">
                {category}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 