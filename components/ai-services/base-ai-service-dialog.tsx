'use client'

import {useState, useEffect} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Badge} from '@/components/ui/badge'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {Edit, Eye, FileText, RefreshCw, Save, X} from 'lucide-react'
import {useToast} from '@/hooks/use-toast'
import {MarkdownRenderer} from '@/components/global/markdown-renderer'
import {ClientCombobox} from '@/components/ui/client-combobox'
import {handleClientApiError} from '@/lib/api/api-toast'
import {getDefaultModel} from '@/lib/models-config'
import type {Client} from '@prisma/client'
import {ValidationResult} from '@/lib/types/api-types'
import {logger} from "@/lib/logger";
import {useTranslations} from '@/lib/translations/context'

/**
 * Base configuration for AI service dialogs
 */
interface BaseAIServiceDialogConfig<TFormData = any> {
  // Dialog appearance
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  themeColor: 'purple' | 'blue' | 'default'
  
  // API configuration
  generateEndpoint: string
  saveEndpoint: string
  
  // Data transformation
  buildGeneratePayload: (formData: TFormData, client?: Client) => any
  buildSavePayload: (formData: TFormData, content: string, client?: Client) => any
  
  // Validation
  validateGeneration: (formData: TFormData) => ValidationResult
  validateSave: (formData: TFormData, content: string) => ValidationResult
  
  // Document naming
  generateDefaultName?: (formData: TFormData, client?: Client) => string
  getDocumentNameField: (formData: TFormData) => string
  setDocumentNameField: (formData: TFormData, name: string) => TFormData
  
  // Success messages
  getSuccessMessage?: (client?: Client) => string
}

/**
 * Base props for AI service dialogs
 */
interface BaseAIServiceDialogProps<TFormData = any> {
  // Core props
  open: boolean
  onOpenChange: (open: boolean) => void
  clients: Client[]
  onDocumentCreated?: (clientId: string, documentId: string) => void
  
  // Configuration
  config: BaseAIServiceDialogConfig<TFormData>
  
  // Form data and handlers
  formData: TFormData
  onFormDataChange: (data: TFormData) => void
  getSelectedClient: (formData: TFormData) => Client | undefined
  onClientChange: (clientId: string) => void
  
  // Custom content slots
  renderClientContext?: () => React.ReactNode
  renderCustomFields?: () => React.ReactNode
  renderAdditionalActions?: () => React.ReactNode
  renderCustomContent?: () => React.ReactNode
  
  // Custom handlers (optional overrides)
  customGenerateHandler?: () => Promise<void>
  customSaveHandler?: () => Promise<void>
  customGeneratedContent?: string
  customIsGenerating?: boolean
  customIsSaving?: boolean
  customIsEditMode?: boolean
  onCustomEditModeChange?: (editMode: boolean) => void
}

/**
 * Base AI Service Dialog Component
 * 
 * Provides shared functionality for AI service dialogs including:
 * - Dialog structure and styling
 * - State management for generation and saving
 * - Error handling with consistent patterns
 * - Generated content display with edit modes
 * - Common button patterns and loading states
 */
export function BaseAIServiceDialog<TFormData = any>({
  open,
  onOpenChange,
  clients,
  onDocumentCreated,
  config,
  formData,
  onFormDataChange,
  getSelectedClient,
  onClientChange,
  renderClientContext,
  renderCustomFields,
  renderAdditionalActions,
  renderCustomContent,
  customGenerateHandler,
  customSaveHandler,
  customGeneratedContent,
  customIsGenerating,
  customIsSaving,
  customIsEditMode,
  onCustomEditModeChange
}: BaseAIServiceDialogProps<TFormData>) {
  const t = useTranslations('aiServices')
  const tCommon = useTranslations('common')
  const { toast } = useToast()
  
  // State management (use custom state if provided, otherwise use internal state)
  const [internalGeneratedContent, setInternalGeneratedContent] = useState('')
  const [internalIsGenerating, setInternalIsGenerating] = useState(false)
  const [internalIsSaving, setInternalIsSaving] = useState(false)
  const [internalIsEditMode, setInternalIsEditMode] = useState(false)

  const generatedContent = customGeneratedContent ?? internalGeneratedContent
  const isGenerating = customIsGenerating ?? internalIsGenerating
  const isSaving = customIsSaving ?? internalIsSaving
  const isEditMode = customIsEditMode ?? internalIsEditMode

  // Reset internal state when dialog opens
  useEffect(() => {
    if (open) {
      setInternalGeneratedContent('')
      setInternalIsEditMode(false)
      setInternalIsGenerating(false)
      setInternalIsSaving(false)
    }
  }, [open])

  // Get theme colors
  const getThemeColors = () => {
    switch (config.themeColor) {
      case 'purple':
        return {
          primary: 'from-purple-500 to-purple-600',
          secondary: 'border-purple-200 bg-purple-50',
          badge: 'bg-purple-100 text-purple-800'
        }
      case 'blue':
        return {
          primary: 'from-blue-500 to-blue-600', 
          secondary: 'border-blue-200 bg-blue-50',
          badge: 'bg-blue-100 text-blue-800'
        }
      default:
        return {
          primary: 'from-gray-500 to-gray-600',
          secondary: 'border-gray-200 bg-gray-50', 
          badge: 'bg-gray-100 text-gray-800'
        }
    }
  }

  const themeColors = getThemeColors()
  const selectedClient = getSelectedClient(formData)
  const documentName = config.getDocumentNameField(formData)

  // Handle generation
  const handleGenerate = async () => {
    if (customGenerateHandler) {
      return await customGenerateHandler()
    }

    const validation = config.validateGeneration(formData)
    if (!validation.isValid) {
      toast({
        title: t('common.validationError'),
        description: validation.message,
        variant: 'destructive'
      })
      return
    }

    setInternalIsGenerating(true)
    try {
      const payload = config.buildGeneratePayload(formData, selectedClient)
      
      const response = await fetch(config.generateEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData?.error || `Request failed: ${response.status}`)
      }

      const data = await response.json()
      setInternalGeneratedContent(data.content || data.report || '')
      
      // Auto-generate document name if not provided
      if (!documentName && config.generateDefaultName) {
        const defaultName = config.generateDefaultName(formData, selectedClient)
        onFormDataChange(config.setDocumentNameField(formData, defaultName))
      }

    } catch (error) {
      const errorMessage = logger.handleError(error)
      handleClientApiError(errorMessage, t('common.generationFailed'))

    } finally {
      setInternalIsGenerating(false)
    }
  }

  // Handle regeneration
  const handleRegenerate = async () => {
    if (customGeneratedContent === undefined) {
      setInternalGeneratedContent('')
    }
    await handleGenerate()
  }

  // Handle save
  const handleSave = async () => {
    if (customSaveHandler) {
      return await customSaveHandler()
    }

    const validation = config.validateSave(formData, generatedContent)
    if (!validation.isValid) {
      toast({
        title: t('common.validationError'),
        description: validation.message,
        variant: 'destructive'
      })
      return
    }

    setInternalIsSaving(true)
    try {
      const payload = config.buildSavePayload(formData, generatedContent, selectedClient)
      
      const response = await fetch(config.saveEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || t('common.saveFailedDescription'))
      }

      const savedDocument = await response.json()
      
      const documentId = savedDocument.data?.documentId || savedDocument.id
      
      toast({
        title: t('common.documentSaved'),
        description: (
          <div>
            <p>{t('common.documentSavedDescription', { documentName })}</p>
            <button 
              onClick={() => {
                if (onDocumentCreated && documentId && selectedClient) {
                  onDocumentCreated(selectedClient.id, documentId)
                }
              }}
              className="text-blue-600 hover:text-blue-800 underline font-medium mt-1 block"
            >
              {t('common.viewDocument')}
            </button>
          </div>
        ),
        duration: 10000,
      })


      // Reset form and close dialog
      if (customGeneratedContent === undefined) {
        setInternalGeneratedContent('')
      }
      if (customIsEditMode === undefined) {
        setInternalIsEditMode(false)
      }
      onOpenChange(false)
    } catch (error) {
      console.error('Save error:', error)
      toast({
        title: t('common.saveFailed'),
        description: error instanceof Error ? error.message : t('common.saveFailedDescription'),
        variant: 'destructive'
      })
    } finally {
      setInternalIsSaving(false)
    }
  }

  // Handle dialog close
  const handleClose = () => {
    if (customGeneratedContent === undefined) {
      setInternalGeneratedContent('')
    }
    if (customIsEditMode === undefined) {
      setInternalIsEditMode(false)
    }
    onOpenChange(false)
  }

  // Handle edit mode toggle
  const handleEditModeToggle = () => {
    if (onCustomEditModeChange) {
      onCustomEditModeChange(!isEditMode)
    } else {
      setInternalIsEditMode(!isEditMode)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-visible flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <config.icon className="h-5 w-5" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="client-select">{t('common.selectClient')}</Label>
            <ClientCombobox
              clients={clients}
              value={selectedClient?.id || ''}
              onValueChange={onClientChange}
              placeholder={t('common.clientPlaceholder')}
            />
          </div>

          {/* Client Context */}
          {renderClientContext?.()}

          {/* Document Name */}
          <div className="space-y-2">
            <Label htmlFor="document-name">{t('common.documentName')}</Label>
            <Input
              id="document-name"
              value={documentName}
              onChange={(e) => {
                onFormDataChange(config.setDocumentNameField(formData, e.target.value))
              }}
              placeholder={t('common.documentNamePlaceholder')}
            />
          </div>

          {/* Custom Fields */}
          {renderCustomFields?.()}

          {/* Custom Content */}
          {renderCustomContent?.()}

          {/* Generated Content */}
          {generatedContent && (
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {t('common.generatedContent')}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={themeColors.badge}>
                      {getDefaultModel()}
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditModeToggle}
                    >
                      {isEditMode ? (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          {tCommon('common.preview')}
                        </>
                      ) : (
                        <>
                          <Edit className="h-4 w-4 mr-1" />
                          {tCommon('edit')}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isEditMode ? (
                  <Textarea
                    value={generatedContent}
                    onChange={(e) => {
                      if (customGeneratedContent === undefined) {
                        setInternalGeneratedContent(e.target.value)
                      }
                    }}
                    className="min-h-[400px] text-sm"
                    placeholder={t('common.contentPlaceholder')}
                    readOnly={customGeneratedContent !== undefined}
                  />
                ) : (
                  <div className="max-h-[400px] overflow-y-auto max-w-none">
                    <MarkdownRenderer content={generatedContent} />
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            {tCommon('cancel')}
          </Button>

          {renderAdditionalActions?.()}

          {!generatedContent ? (
            <Button 
              onClick={handleGenerate} 
              disabled={isGenerating}
              className={`bg-gradient-to-r ${themeColors.primary} hover:shadow-lg transition-all`}
            >
              {isGenerating ? (
                <LoadingSpinner size="sm" text={t('common.generating')} className="text-white" />
              ) : (
                <>
                  <config.icon className="h-4 w-4 mr-2" />
                  {t('common.generate')}
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRegenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <LoadingSpinner size="sm" text="" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {t('common.regenerate')}
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className={`bg-gradient-to-r ${themeColors.primary} hover:shadow-lg transition-all`}
              >
                {isSaving ? (
                  <LoadingSpinner size="sm" text={tCommon('saving')} className="text-white" />
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {t('common.saveDocument')}
                  </>
                )}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export type { BaseAIServiceDialogConfig, BaseAIServiceDialogProps, ValidationResult }