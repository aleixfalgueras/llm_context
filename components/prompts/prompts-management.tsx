'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PromptDialog } from '@/components/prompts/prompt-dialog'
import { Plus, FileText, Lightbulb } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { samplePrompts, getSamplePromptsByCategory } from '@/lib/sample-prompts'
import { PromptStatsCards } from '@/components/prompts/prompt-stats-cards'
import { PromptFiltersBar } from '@/components/prompts/prompt-filters-bar'
import { PromptCard } from '@/components/prompts/prompt-card'
import { SamplePromptCard } from '@/components/prompts/sample-prompt-card'
import { PromptEmptyState } from '@/components/prompts/prompt-empty-state'
import { 
  Prompt, 
  PromptStats, 
  PromptFilters, 
  PromptActionHandlers, 
  FilterActionHandlers 
} from '@/types/prompt-management-types'

export function PromptsManagement() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<PromptFilters>({
    searchTerm: '',
    selectedCategory: 'all',
    sortBy: 'usage',
    showInactive: false,
    showTemplates: true
  })
  const { toast } = useToast()

  // Load showTemplates preference from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem('showTemplates')
    if (saved !== null) {
      setFilters(prev => ({ ...prev, showTemplates: JSON.parse(saved) }))
    }
  }, [])

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.selectedCategory !== 'all') {
        params.append('category', filters.selectedCategory)
      }
      if (!filters.showInactive) {
        params.append('active', 'true')
      }

      const response = await fetch(`/api/prompts?${params.toString()}`)
      if (response.ok) {
        const data = await response.json()
        setPrompts(data)
      }
    } catch (error) {
      console.error('Error fetching prompts:', error)
      toast({
        title: 'Error',
        description: 'Failed to load prompts.',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPrompts()
  }, [filters.selectedCategory, filters.showInactive])

  const filteredAndSortedPrompts = prompts
    .filter((prompt) => {
      return (
        prompt.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        prompt.content.toLowerCase().includes(filters.searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'usage':
          return b.usageCount - a.usageCount
        case 'recent':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'name':
          return a.name.localeCompare(b.name)
        case 'created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        default:
          return 0
      }
    })

  const deletePrompt = async (promptId: string) => {
    try {
      const response = await fetch(`/api/prompts/${promptId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast({
          title: 'Prompt deleted',
          description: 'Prompt has been deleted successfully.',
        })
        fetchPrompts()
      } else {
        throw new Error('Failed to delete prompt')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete prompt.',
        variant: 'destructive',
      })
    }
  }

  const togglePromptStatus = async (prompt: Prompt) => {
    try {
      const response = await fetch(`/api/prompts/${prompt.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...prompt,
          isActive: !prompt.isActive,
        }),
      })

      if (response.ok) {
        toast({
          title: prompt.isActive ? 'Prompt disabled' : 'Prompt enabled',
          description: `"${prompt.name}" has been ${prompt.isActive ? 'disabled' : 'enabled'}.`,
        })
        fetchPrompts()
      } else {
        throw new Error('Failed to update prompt')
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update prompt status.',
        variant: 'destructive',
      })
    }
  }

  const toggleTemplates = () => {
    const newValue = !filters.showTemplates
    setFilters(prev => ({ ...prev, showTemplates: newValue }))
    localStorage.setItem('showTemplates', JSON.stringify(newValue))
  }

  const clearFilters = () => {
    setFilters({
      searchTerm: '',
      selectedCategory: 'all',
      sortBy: 'usage',
      showInactive: false,
      showTemplates: filters.showTemplates
    })
  }

  // Prepare data for child components
  const stats: PromptStats = {
    total: prompts.length,
    active: prompts.filter(p => p.isActive).length,
    mostUsed: prompts.reduce((max, p) => p.usageCount > (max?.usageCount || 0) ? p : max, prompts[0] || null),
  }

  const promptActionHandlers: PromptActionHandlers = {
    onEdit: () => fetchPrompts(),
    onDelete: deletePrompt,
    onToggleStatus: togglePromptStatus
  }

  const filterActionHandlers: FilterActionHandlers = {
    onSearchChange: (search) => setFilters(prev => ({ ...prev, searchTerm: search })),
    onCategoryChange: (category) => setFilters(prev => ({ ...prev, selectedCategory: category })),
    onSortChange: (sort) => setFilters(prev => ({ ...prev, sortBy: sort })),
    onToggleInactive: () => setFilters(prev => ({ ...prev, showInactive: !prev.showInactive })),
    onToggleTemplates: toggleTemplates
  }

  const filteredSamplePrompts = getSamplePromptsByCategory(filters.selectedCategory)
  const useAsTemplate = (samplePrompt: typeof samplePrompts[0]) => {
    // This will be handled by the PromptDialog component
    // We'll pass the sample prompt data to pre-fill the form
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">Prompt Management</h1>
          <p className="text-muted-foreground mt-2">
            Create, edit, and organize your AI prompts for better conversations.
          </p>
        </div>
        <PromptDialog 
          onSuccess={fetchPrompts}
          trigger={
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              New Prompt
            </Button>
          }
        />
      </div>

      {/* Stats Cards */}
      <PromptStatsCards stats={stats} prompts={prompts} />

      {/* Filters and Search */}
      <PromptFiltersBar filters={filters} actionHandlers={filterActionHandlers} />

      {/* Example Prompts Section */}
      {!filters.searchTerm && (prompts.length === 0 || filters.selectedCategory === 'all') && filters.showTemplates && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Example Prompts</h2>
            <Badge variant="outline" className="text-xs">Templates</Badge>
          </div>
          
          <p className="text-muted-foreground mb-6">
            Professional prompt templates to get you started. Click "Use as Template" to create your own version.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {filteredSamplePrompts.map((samplePrompt) => (
              <SamplePromptCard
                key={samplePrompt.id}
                prompt={samplePrompt}
                onUseAsTemplate={() => useAsTemplate(samplePrompt)}
                onSuccess={fetchPrompts}
              />
            ))}
          </div>
        </div>
      )}

      {/* User's Prompts Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5" />
          <h2 className="text-xl font-semibold">My Prompts</h2>
          {prompts.length > 0 && (
            <Badge variant="outline" className="text-xs">{prompts.length}</Badge>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading prompts...</p>
          </div>
        ) : filteredAndSortedPrompts.length === 0 ? (
          <PromptEmptyState 
            searchTerm={filters.searchTerm}
            selectedCategory={filters.selectedCategory}
            onRefresh={clearFilters}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={() => fetchPrompts()}
                onDelete={() => deletePrompt(prompt.id)}
                onToggleStatus={() => togglePromptStatus(prompt)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
} 