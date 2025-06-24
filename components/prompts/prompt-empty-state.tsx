'use client'

import { Button } from '@/components/ui/button'
import { FileText } from 'lucide-react'
import { PromptDialog } from '@/components/prompts/prompt-dialog'

interface PromptEmptyStateProps {
  searchTerm: string
  selectedCategory: string
  onRefresh: () => void
}

export function PromptEmptyState({ searchTerm, selectedCategory, onRefresh }: PromptEmptyStateProps) {
  const hasFilters = searchTerm || selectedCategory !== 'all'
  
  return (
    <div className="text-center py-8">
      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
      <p className="text-muted-foreground mb-4">
        {hasFilters 
          ? 'Try adjusting your filters or search terms'
          : 'Get started by creating your first prompt or using a template above'
        }
      </p>
      {hasFilters ? (
        <Button variant="outline" onClick={onRefresh}>
          Clear Filters
        </Button>
      ) : (
        <PromptDialog 
          onSuccess={onRefresh}
          trigger={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              Create Your First Prompt
            </Button>
          }
        />
      )}
    </div>
  )
} 