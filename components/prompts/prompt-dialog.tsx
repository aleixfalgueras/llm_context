'use client'

import {useEffect, useState} from 'react'
import {useTranslations} from '@/lib/translations/context'
import {Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {ClientContextVariablesTooltip} from '@/components/ui/client-context-variables-tooltip'
import {Edit2, Loader2, Plus} from 'lucide-react'
import {useToast} from '@/hooks/use-toast'
import {useFormState} from '@/hooks/use-form-state'
import {handleClientApiError} from '@/lib/api/api-toast'
import {validatePromptForm} from '@/lib/utils/validation'
import {PromptInput} from '@/lib/types/prompt-types'
import {Prompt} from "@prisma/client"
import {createPrompt, updatePrompt} from '@/app/actions/prompt-action'

interface PromptDialogProps {
  prompt?: Prompt | PromptInput | null
  trigger?: React.ReactNode
  onSuccess?: () => void
  isTemplate?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  viewMode?: boolean
}

const getCategoriesWithLabels = (t: any) => [
  { value: 'general', label: t('categories.general') },
  { value: 'marketing', label: t('categories.marketing') },
  { value: 'content', label: t('categories.content') },
  { value: 'analysis', label: t('categories.analysis') },
]

interface PromptFormData {
  name: string
  description: string
  content: string
  category: string
}

const getValidationRules = (t: any) => ({
  name: (value: string) => {
    if (!value || value.trim().length === 0) {
      return t('validation.nameRequired')
    }
    if (value.trim().length < 3) {
      return t('validation.nameMinLength')
    }
    return null
  },
  content: (value: string) => {
    if (!value || value.trim().length === 0) {
      return t('validation.contentRequired')
    }
    if (value.trim().length < 10) {
      return t('validation.contentMinLength')
    }
    return null
  },
})

export function PromptDialog({ prompt, trigger, onSuccess, isTemplate = false, open: externalOpen, onOpenChange: externalOnOpenChange, viewMode = false }: PromptDialogProps) {
  const t = useTranslations('prompts')
  const tCommon = useTranslations('common')
  const [internalOpen, setInternalOpen] = useState(false)
  
  // Use external state if provided, otherwise use internal state
  const open = externalOpen !== undefined ? externalOpen : internalOpen
  const setOpen = externalOnOpenChange || setInternalOpen
  const [loading, setLoading] = useState(false)
  
  // Initialize form data
  const initialFormData: PromptFormData = {
    name: prompt?.name || '',
    description: prompt?.description || '',
    content: prompt?.content || '',
    category: prompt?.category || 'general',
  }
  
  const {
    formData,
    errors,
    isValid,
    isDirty,
    updateField,
    updateFormData,
    validateForm,
    resetForm,
    setFormData,
  } = useFormState({
    initialData: initialFormData,
    validationRules: getValidationRules(t),
  })
  
  const { toast } = useToast()
  
  // Update form data when prompt changes (for editing or template usage)
  useEffect(() => {
    if (prompt) {
      setFormData({
        name: prompt.name || '',
        description: prompt.description || '',
        content: prompt.content || '',
        category: prompt.category || 'general',
      })
    }
  }, [prompt, setFormData])

  const isEditing = Boolean(prompt) && !isTemplate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Don't submit in view mode
    if (viewMode) {
      return
    }
    
    // Use centralized validation
    const validation = validatePromptForm(formData)
    if (!validation.isValid) {
      // Show validation error toast
      if (validation.firstError) {
        toast({
          title: t('validation.error'),
          description: validation.firstError,
          variant: 'destructive'
        })
      }
      return
    }
    
    setLoading(true)

    try {
      if (isEditing) {
        await updatePrompt(prompt!.id, formData)
      } else {
        await createPrompt(formData)
      }

      toast({
        title: isEditing ? t('messages.promptUpdated') : isTemplate ? t('messages.promptCreatedFromTemplate') : t('messages.promptCreated'),
        description: t(isEditing ? 'messages.promptUpdatedDesc' : 'messages.promptCreatedDesc', { name: formData.name }),
      })

      setOpen(false)
      onSuccess?.()
      
      // Reset form if creating new prompt (but not from template)
      if (!isEditing && !isTemplate) {
        resetForm()
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('errors.failedToSave')
      handleClientApiError(errorMessage, t('errors.failedToSave'))
    } finally {
      setLoading(false)
    }
  }

  const defaultTrigger = (
    <Button 
      variant={isEditing ? "outline" : "default"}
      size="sm"
      className={isEditing ? "" : "bg-blue-600 hover:bg-blue-700 text-white"}
    >
      {isEditing ? (
        <>
          <Edit2 className="w-4 h-4 mr-2" />
          {t('actions.edit')}
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          {t('actions.newPrompt')}
        </>
      )}
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger !== undefined && (
        <DialogTrigger asChild>
          {trigger || defaultTrigger}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {viewMode ? t('dialog.viewTitle') : isEditing ? t('dialog.editTitle') : isTemplate ? t('dialog.createFromTemplateTitle') : t('dialog.createTitle')}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t('form.name')} {!viewMode && t('form.required')}</Label>
              {viewMode ? (
                <div className="p-2 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[40px] flex items-center">
                  <span className="text-sm">{formData.name || '-'}</span>
                </div>
              ) : (
                <>
                  <Input
                    id="name"
                    placeholder={t('form.namePlaceholder')}
                    value={formData.name}
                    onChange={(e) => updateField('name', e.target.value)}
                    className={errors.name ? 'border-red-500' : ''}
                    required
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">{t('form.category')}</Label>
              {viewMode ? (
                <div className="p-2 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[40px] flex items-center">
                  <span className="text-sm capitalize">{formData.category || '-'}</span>
                </div>
              ) : (
                <Select
                  value={formData.category}
                  onValueChange={(value) => updateField('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getCategoriesWithLabels(t).map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">{t('form.description')}</Label>
            {viewMode ? (
              <div className="p-2 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[40px] flex items-center">
                <span className="text-sm">{formData.description || '-'}</span>
              </div>
            ) : (
              <>
                <Input
                  id="description"
                  placeholder={t('form.descriptionPlaceholder')}
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500">{errors.description}</p>
                )}
              </>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="content">{t('form.content')} {!viewMode && t('form.required')}</Label>
              {!viewMode && <ClientContextVariablesTooltip />}
            </div>
            {viewMode ? (
              <div className="p-3 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[200px] max-h-[300px] overflow-y-auto">
                <span className="text-sm whitespace-pre-wrap">{formData.content || '-'}</span>
              </div>
            ) : (
              <>
                <Textarea
                  id="content"
                  placeholder={t('form.contentPlaceholder')}
                  value={formData.content}
                  onChange={(e) => updateField('content', e.target.value)}
                  className={`min-h-[200px] ${errors.content ? 'border-red-500' : ''}`}
                  required
                />
                {errors.content && (
                  <p className="text-sm text-red-500">{errors.content}</p>
                )}
              </>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            {viewMode ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {tCommon('close')}
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  disabled={loading}
                >
                  {tCommon('cancel')}
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading || !isValid}
                  className={isTemplate ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
                >
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {isEditing ? t('actions.update') : isTemplate ? t('actions.createFromTemplate') : t('actions.create')} {t('form.prompt')}
                </Button>
              </>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 