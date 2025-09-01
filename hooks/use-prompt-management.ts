'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'
import { getSamplePromptsByCategory } from '@/lib/sample-prompts'
import { useLocale } from '@/lib/translations/context'
import { Prompt } from '@prisma/client'
import {
  PromptStats,
  PromptFilters,
  PromptFilterActionHandlers, SamplePrompt
} from '@/lib/types/prompt-types'
import { handleClientApiError } from '@/lib/api/api-toast'
import { getPrompts, deletePrompt as deletePromptAction, updatePrompt } from '@/app/actions/prompt-action'
import { PromptListFilters } from '@/services/prompt-service'

interface UsePromptManagementReturn {
  // State
  prompts: Prompt[]
  filteredAndSortedPrompts: Prompt[]
  filters: PromptFilters
  stats: PromptStats
  loading: boolean
  
  // Dialog states
  showPromptDialog: boolean
  isViewDialogOpen: boolean
  isEditDialogOpen: boolean
  isDeleteDialogOpen: boolean
  viewingPrompt: Prompt | null
  editingPrompt: Prompt | null
  deletingPrompt: Prompt | null
  
  // Actions
  fetchPrompts: () => Promise<void>
  deletePrompt: (id: string) => Promise<void>
  togglePromptStatus: (prompt: Prompt) => Promise<void>
  handleNewPrompt: () => Promise<void>
  handleViewPrompt: (prompt: Prompt) => void
  handleEditPrompt: (prompt: Prompt) => void
  handleDeletePrompt: (prompt: Prompt) => void
  clearFilters: () => void
  setShowPromptDialog: (show: boolean) => void
  setIsViewDialogOpen: (open: boolean) => void
  setIsEditDialogOpen: (open: boolean) => void
  setIsDeleteDialogOpen: (open: boolean) => void
  
  // Filter handlers
  filterActionHandlers: PromptFilterActionHandlers
  filteredSamplePrompts: SamplePrompt[]
  samplePromptsLoading: boolean
}

export function usePromptManagement(): UsePromptManagementReturn {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredSamplePrompts, setFilteredSamplePrompts] = useState<SamplePrompt[]>([])
  const [samplePromptsLoading, setSamplePromptsLoading] = useState(true)
  const [filters, setFilters] = useState<PromptFilters>({
    searchTerm: '',
    selectedCategory: 'all',
    sortBy: 'usage',
    showInactive: false,
    showTemplates: true
  })
  const [showPromptDialog, setShowPromptDialog] = useState(false)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [viewingPrompt, setViewingPrompt] = useState<Prompt | null>(null)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [deletingPrompt, setDeletingPrompt] = useState<Prompt | null>(null)
  const { toast } = useToast()
  const locale = useLocale()

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const promptFilters: PromptListFilters = {
        category: filters.selectedCategory !== 'all' ? filters.selectedCategory : undefined,
        isActive: !filters.showInactive ? true : undefined,
        includeContent: true
      }

      const data = await getPrompts(promptFilters)
      setPrompts(data || [])
    } catch (error) {
      console.error('Error fetching prompts:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to load prompts'
      handleClientApiError(errorMessage, 'Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }

  const fetchSamplePrompts = async () => {
    setSamplePromptsLoading(true)
    try {
      const samplePrompts = await getSamplePromptsByCategory(filters.selectedCategory, locale)
      setFilteredSamplePrompts(samplePrompts)
    } catch (error) {
      console.error('Error fetching sample prompts:', error)
    } finally {
      setSamplePromptsLoading(false)
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
    void fetchPrompts()
  }, [filters.selectedCategory, filters.showInactive])

  // Fetch sample prompts when category or locale changes
  useEffect(() => {
    void fetchSamplePrompts()
  }, [filters.selectedCategory, locale])

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
      await deletePromptAction(promptId)
      toast({
        title: 'Prompt deleted',
        description: 'Prompt has been deleted successfully.',
      })
      await fetchPrompts()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete prompt'
      handleClientApiError(errorMessage, 'Failed to delete prompt')
    }
  }

  const togglePromptStatus = async (prompt: Prompt) => {
    try {
      await updatePrompt(prompt.id, {
        isActive: !prompt.isActive,
      })
      toast({
        title: prompt.isActive ? 'Prompt disabled' : 'Prompt enabled',
        description: `"${prompt.name}" has been ${prompt.isActive ? 'disabled' : 'enabled'}.`,
      })
      await fetchPrompts()
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

  const handleViewPrompt = (prompt: Prompt) => {
    setViewingPrompt(prompt)
    setIsViewDialogOpen(true)
  }

  const handleEditPrompt = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setIsEditDialogOpen(true)
  }

  const handleDeletePrompt = (prompt: Prompt) => {
    setDeletingPrompt(prompt)
    setIsDeleteDialogOpen(true)
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

  return {
    // State
    prompts,
    filteredAndSortedPrompts,
    filters,
    stats,
    loading,
    
    // Dialog states
    showPromptDialog,
    isViewDialogOpen,
    isEditDialogOpen,
    isDeleteDialogOpen,
    viewingPrompt,
    editingPrompt,
    deletingPrompt,
    
    // Actions
    fetchPrompts,
    deletePrompt,
    togglePromptStatus,
    handleNewPrompt,
    handleViewPrompt,
    handleEditPrompt,
    handleDeletePrompt,
    clearFilters,
    setShowPromptDialog,
    setIsViewDialogOpen,
    setIsEditDialogOpen,
    setIsDeleteDialogOpen,
    
    // Filter handlers
    filterActionHandlers,
    filteredSamplePrompts,
    samplePromptsLoading,
  }
}