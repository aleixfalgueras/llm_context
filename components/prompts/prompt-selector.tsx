'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {ChevronDown, FileText, Search, Star, TrendingUp} from 'lucide-react'
import {cn} from '@/lib/utils/general'
import {Prompt} from "@prisma/client"
import {getPrompts, trackPromptUsage} from '@/app/actions/prompt-action'
import {PROMPT_CATEGORIES} from '@/lib/types/prompt-types'

interface PromptSelectorProps {
  onPromptSelect: (prompt: Prompt) => void
  className?: string
}

export function PromptSelector({ onPromptSelect, className }: PromptSelectorProps) {
  const [open, setOpen] = useState(false)
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const data = await getPrompts({
        isActive: true,
        includeContent: true
      })
      setPrompts(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      void fetchPrompts()
    }
  }, [open])

  const filteredPrompts = (prompts || []).filter((prompt) => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Use predefined categories instead of dynamic generation
  const popularPrompts = (prompts || []).filter(p => p.usageCount > 0).slice(0, 3)
  const recentPrompts = (prompts || []).slice(0, 3)

  const handlePromptSelect = async (prompt: Prompt) => {
    try {
      // Track usage
      await trackPromptUsage(prompt.id)
      
      onPromptSelect(prompt)
      setOpen(false)
    } catch (error) {
      console.error('Error tracking prompt usage:', error)
      // Still select the prompt even if tracking fails
      onPromptSelect(prompt)
      setOpen(false)
    }
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn("justify-between", className)}
        >
          <FileText className="w-4 h-4 mr-2" />
          Use Prompt ✨
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-96 p-0 overflow-hidden flex flex-col"
        align="start"
        sideOffset={5}
        side="top"
      >
        <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center space-x-2">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(50vh-150px)] pointer-events-auto">
          {loading ? (
            <div className="p-4 text-center text-muted-foreground">
              Loading prompts...
            </div>
          ) : filteredPrompts.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              {searchTerm ? 'No prompts match your search.' : 'No prompts available.'}
            </div>
          ) : (
            <div className="p-2">
                {/* Quick Access Sections - only show when no filters applied */}
                {!searchTerm && selectedCategory === 'all' && (
                  <div className="mb-4">
                    {popularPrompts.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          Most Used
                        </div>
                        {popularPrompts.map((prompt) => (
                          <PromptItem
                            key={`popular-${prompt.id}`}
                            prompt={prompt}
                            onSelect={handlePromptSelect}
                          />
                        ))}
                      </div>
                    )}
                    
                    {recentPrompts.length > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground">
                          <Star className="w-3 h-3" />
                          Recent
                        </div>
                        {recentPrompts.map((prompt) => (
                          <PromptItem
                            key={`recent-${prompt.id}`}
                            prompt={prompt}
                            onSelect={handlePromptSelect}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Filtered Results - show when search or category filter is applied */}
                {(searchTerm || selectedCategory !== 'all') && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground mb-2 capitalize">
                      <FileText className="w-3 h-3" />
                      {searchTerm ? 'Search Results' : `${selectedCategory} Prompts`}
                    </div>
                    {filteredPrompts.map((prompt) => (
                      <PromptItem
                        key={`filtered-${prompt.id}`}
                        prompt={prompt}
                        onSelect={handlePromptSelect}
                      />
                    ))}
                  </div>
                )}

                {/* All Prompts - show when no filters applied, after quick access sections */}
                {!searchTerm && selectedCategory === 'all' && filteredPrompts.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-muted-foreground mb-2">
                      <FileText className="w-3 h-3" />
                      All Prompts
                    </div>
                    {filteredPrompts.map((prompt) => (
                      <PromptItem
                        key={`all-${prompt.id}`}
                        prompt={prompt}
                        onSelect={handlePromptSelect}
                      />
                    ))}
                  </div>
                )}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

interface PromptItemProps {
  prompt: Prompt
  onSelect: (prompt: Prompt) => void
}

function PromptItem({ prompt, onSelect }: PromptItemProps) {
  return (
    <div
      className="flex items-start gap-3 p-2 rounded-md hover:bg-muted cursor-pointer group"
      onClick={() => onSelect(prompt)}
    >
      <FileText className="w-4 h-4 mt-0.5 text-muted-foreground group-hover:text-foreground" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{prompt.name}</p>
          <Badge variant="secondary" className="text-xs capitalize">
            {prompt.category}
          </Badge>
          {prompt.usageCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {prompt.usageCount}
            </span>
          )}
        </div>
        {prompt.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
            {prompt.description.substring(0, 30)}...
          </p>
        )}
      </div>
    </div>
  )
} 