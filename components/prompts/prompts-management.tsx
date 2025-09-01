'use client'

import {useTranslations} from '@/lib/translations/context'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {PromptDialog} from '@/components/prompts/prompt-dialog'
import {DeletePromptDialog} from '@/components/prompts/delete-prompt-dialog'
import {FileText, Lightbulb, Plus} from 'lucide-react'
import {PromptStatsCards} from '@/components/prompts/prompt-stats-cards'
import {PromptFiltersBar} from '@/components/prompts/prompt-filters-bar'
import {PromptCard} from '@/components/prompts/prompt-card'
import {SamplePromptCard} from '@/components/prompts/sample-prompt-card'
import {PromptEmptyState} from '@/components/prompts/prompt-empty-state'
import {usePromptManagement} from '@/hooks/use-prompt-management'

export function PromptsManagement() {
  const t = useTranslations('prompts')
  const tCommon = useTranslations('common')
  
  const {
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
  } = usePromptManagement()

  const useAsTemplate = () => {
    // This will be handled by the PromptDialog component
    // We'll pass the sample prompt data to pre-fill the form
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('description')}
          </p>
        </div>
        <Button 
          variant="blue"
          onClick={handleNewPrompt}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t('newPrompt')}
        </Button>
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
            <h2 className="text-xl font-semibold">{t('examplePrompts')}</h2>
            <Badge variant="outline" className="text-xs">{t('showTemplates')}</Badge>
          </div>
          
          <p className="text-muted-foreground mb-6">
            {t('templatesDescription')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {samplePromptsLoading ? (
              // Loading skeleton for sample prompts
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-[240px] bg-gray-100 animate-pulse rounded-lg" />
              ))
            ) : (
              filteredSamplePrompts.map((samplePrompt) => (
                <SamplePromptCard
                  key={samplePrompt.id}
                  prompt={samplePrompt}
                  onUseAsTemplate={() => useAsTemplate()}
                  onSuccess={fetchPrompts}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* User's Prompts Section */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <FileText className="h-5 w-5" />
          <h2 className="text-xl font-semibold">{t('myPrompts')}</h2>
          {prompts.length > 0 && (
            <Badge variant="outline" className="text-xs">{prompts.length}</Badge>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">{tCommon('loading')}</p>
          </div>
        ) : filteredAndSortedPrompts.length === 0 ? (
          <PromptEmptyState 
            searchTerm={filters.searchTerm}
            selectedCategory={filters.selectedCategory}
            onRefresh={fetchPrompts}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedPrompts.map((prompt) => (
              <PromptCard
                key={prompt.id}
                prompt={prompt}
                onEdit={() => fetchPrompts()}
                onEditPrompt={handleEditPrompt}
                onDelete={() => deletePrompt(prompt.id)}
                onDeletePrompt={handleDeletePrompt}
                onToggleStatus={() => togglePromptStatus(prompt)}
                onViewPrompt={handleViewPrompt}
              />
            ))}
          </div>
        )}
      </div>

      {/* Prompt Creation Dialog */}
      <PromptDialog 
        open={showPromptDialog}
        onOpenChange={setShowPromptDialog}
        onSuccess={() => {
          setShowPromptDialog(false)
          void fetchPrompts()
        }}
      />

      {/* Prompt View Dialog */}
      <PromptDialog 
        prompt={viewingPrompt}
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        viewMode={true}
      />

      {/* Prompt Edit Dialog */}
      <PromptDialog 
        prompt={editingPrompt}
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onSuccess={() => {
          setIsEditDialogOpen(false)
          void fetchPrompts()
        }}
      />

      {/* Prompt Delete Dialog */}
      <DeletePromptDialog 
        promptName={deletingPrompt?.name || ''}
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onDelete={() => {
          if (deletingPrompt) {
            void deletePrompt(deletingPrompt.id)
            setIsDeleteDialogOpen(false)
          }
        }}
      />

    </div>
  )
}