'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getSamplePromptsByCategory } from '@/lib/sample-prompts'
import { Prompt } from '@prisma/client'
import { 
  PromptStats, 
  PromptFilters, 
  PromptFilterActionHandlers
} from '@/lib/types/prompt-types'
import { handleClientApiError } from '@/lib/api/api-toast'

interface UsePromptManagementReturn {
  // State
  prompts: Prompt[]
  filteredAndSortedPrompts: Prompt[]
  filters: PromptFilters
  stats: PromptStats
  loading: boolean
  
  // Dialog states
  showPromptDialog: boolean
  
  // Actions
  fetchPrompts: () => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  togglePromptStatus: (prompt: Prompt) => Promise<void>
  handleNewPrompt: () => Promise<void>
  clearFilters: () => void
  setShowPromptDialog: (show: boolean) => void
  
  // Filter handlers
  filterActionHandlers: PromptFilterActionHandlers
  filteredSamplePrompts: any[]
}

export function usePromptManagement(): UsePromptManagementReturn {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<PromptFilters>({
    searchTerm: '',
    selectedCategory: 'all',
    sortBy: 'usage',
    showInactive: false,
    showTemplates: true
  })
  const [showPromptDialog, setShowPromptDialog] = useState(false)
  const { toast } = useToast()

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
      params.append('includeContent', 'true')

      const response = await fetch(`/api/prompts?${params.toString()}`)
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to load prompts' }))
        throw new Error(errorData.error)
      }
      const data = await response.json()
      setPrompts(data.data || [])
    } catch (error) {
      console.error('Error fetching prompts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load prompts'
      handleClientApiError(errorMessage, 'Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  // Load showTemplates preference from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('showTemplates')
    if (saved !== null) {
      setFilters(prev => ({ ...prev, showTemplates: JSON.parse(saved) }))
    }
  }, [])

  // Fetch prompts on mount and when filters change
  useEffect(() => {
    fetchPrompts()
  }, [filters.selectedCategory, filters.showInactive])

  const filteredAndSortedPrompts = (Array.isArray(prompts) ? prompts : [])
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete prompt' }))
        throw new Error(errorData.error)
      }
      toast({
        title: 'Prompt deleted',
        description: 'Prompt has been deleted successfully.',
      })
      fetchPrompts()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete prompt'
      handleClientApiError(errorMessage, 'Failed to delete prompt')
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to update prompt' }))
        throw new Error(errorData.error)
      }
      toast({
        title: prompt.isActive ? 'Prompt disabled' : 'Prompt enabled',
        description: `"${prompt.name}" has been ${prompt.isActive ? 'disabled' : 'enabled'}.`,
      })
      fetchPrompts()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update prompt status'
      handleClientApiError(errorMessage, 'Failed to update prompt status')
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

  const handleNewPrompt = async () => {
    setShowPromptDialog(true)
  }

  // Prepare data for child components
  const stats: PromptStats = {
    total: prompts.length,
    active: prompts.filter(p => p.isActive).length,
    mostUsed: prompts.reduce((max, p) => p.usageCount > (max?.usageCount || 0) ? p : max, prompts[0] || null),
  }

  const filterActionHandlers: PromptFilterActionHandlers = {
    onSearchChange: (search) => setFilters(prev => ({ ...prev, searchTerm: search })),
    onCategoryChange: (category) => setFilters(prev => ({ ...prev, selectedCategory: category })),
    onSortChange: (sort) => setFilters(prev => ({ ...prev, sortBy: sort })),
    onToggleInactive: () => setFilters(prev => ({ ...prev, showInactive: !prev.showInactive })),
    onToggleTemplates: toggleTemplates
  }

  const filteredSamplePrompts = getSamplePromptsByCategory(filters.selectedCategory)

  return {
    // State
    prompts,
    filteredAndSortedPrompts,
    filters,
    stats,
    loading,
    
    // Dialog states
    showPromptDialog,
    
    // Actions
    fetchPrompts,
    deletePrompt,
    togglePromptStatus,
    handleNewPrompt,
    clearFilters,
    setShowPromptDialog,
    
    // Filter handlers
    filterActionHandlers,
    filteredSamplePrompts,
  }
}