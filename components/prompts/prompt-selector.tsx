'use client'

import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Badge} from '@/components/ui/badge'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Popover, PopoverContent, PopoverTrigger} from '@/components/ui/popover'
import {ChevronDown, FileText, Search, Star, TrendingUp} from 'lucide-react'
import {cn} from '@/lib/utils/general'
import {Prompt} from '@/types/component-types'

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
      const response = await fetch('/api/prompts?active=true&includeContent=true')
      if (response.ok) {
        const data = await response.json()
        // Handle API response structure - API returns { data: { prompts: [...] } }
        const promptsData = data.data?.prompts || data.prompts || []
        setPrompts(Array.isArray(promptsData) ? promptsData : [])
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (open) {
      fetchPrompts()
    }
  }, [open])

  const filteredPrompts = (prompts || []).filter((prompt) => {
    const matchesSearch = prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || prompt.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const categories = Array.from(new Set((prompts || []).map(p => p.category)))
  const popularPrompts = (prompts || []).filter(p => p.usageCount > 0).slice(0, 3)
  const recentPrompts = (prompts || []).slice(0, 3)

  const handlePromptSelect = async (prompt: Prompt) => {
    try {
      // Track usage
      await fetch(`/api/prompts/${prompt.id}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
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
    <Popover open={open} onOpenChange={setOpen}>
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
      <PopoverContent className="w-96 p-0" align="start">
        <div className="p-4">
          <div className="flex items-center space-x-2 mb-4">
            <Search className="w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex flex-wrap gap-1 mb-4">
            <Badge
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              className="cursor-pointer text-xs"
              onClick={() => setSelectedCategory('all')}
            >
              All
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'outline'}
                className="cursor-pointer text-xs capitalize"
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Badge>
            ))}
          </div>
        </div>

        <ScrollArea className="max-h-80">
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
              {/* Quick Access Sections */}
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

              {/* All Prompts */}
              <div>
                {(searchTerm || selectedCategory !== 'all') && (
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground mb-2">
                    {filteredPrompts.length} prompt{filteredPrompts.length !== 1 ? 's' : ''}
                  </div>
                )}
                {filteredPrompts.map((prompt) => (
                  <PromptItem
                    key={prompt.id}
                    prompt={prompt}
                    onSelect={handlePromptSelect}
                  />
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
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
            {prompt.description}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          {prompt.content.substring(0, 80)}...
        </p>
      </div>
    </div>
  )
} 