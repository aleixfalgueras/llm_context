'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientVariablesTooltip } from '@/components/ui/client-variables-tooltip'
import { Plus, Edit2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useFormState } from '@/hooks/use-form-state'
import { Prompt, PromptBasic } from '@/types/component-types'

interface PromptDialogProps {
  prompt?: Prompt | PromptBasic
  trigger?: React.ReactNode
  onSuccess?: () => void
  isTemplate?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'content', label: 'Content' },
  { value: 'analysis', label: 'Analysis' },
]

interface PromptFormData {
  name: string
  description: string
  content: string
  category: string
}

const getValidationRules = () => ({
  name: (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Name is required'
    }
    if (value.trim().length < 3) {
      return 'Name must be at least 3 characters'
    }
    return null
  },
  content: (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Prompt content is required'
    }
    if (value.trim().length < 10) {
      return 'Prompt content must be at least 10 characters'
    }
    return null
  },
})

export function PromptDialog({ prompt, trigger, onSuccess, isTemplate = false, open: externalOpen, onOpenChange: externalOnOpenChange }: PromptDialogProps) {
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
    validationRules: getValidationRules(),
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
    
    // Validate form before submitting
    if (!validateForm()) {
      return
    }
    
    setLoading(true)

    try {
      const url = isEditing ? `/api/prompts/${prompt!.id}` : '/api/prompts'
      const method = isEditing ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        throw new Error('Failed to save prompt')
      }

      toast({
        title: isEditing ? 'Prompt updated' : isTemplate ? 'Prompt created from template' : 'Prompt created',
        description: `"${formData.name}" has been ${isEditing ? 'updated' : 'created'} successfully.`,
      })

      setOpen(false)
      onSuccess?.()
      
      // Reset form if creating new prompt (but not from template)
      if (!isEditing && !isTemplate) {
        resetForm()
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save prompt. Please try again.',
        variant: 'destructive',
      })
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
          Edit
        </>
      ) : (
        <>
          <Plus className="w-4 h-4 mr-2" />
          New Prompt
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
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Prompt' : isTemplate ? 'Create Prompt from Template' : 'Create New Prompt'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Generate Marketing Strategy Report"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                className={errors.name ? 'border-red-500' : ''}
                required
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => updateField('category', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              placeholder="Brief description of what this prompt does"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="content">Prompt Content *</Label>
              <ClientVariablesTooltip />
            </div>
            <Textarea
              id="content"
              placeholder="Enter your prompt template here."
              value={formData.content}
              onChange={(e) => updateField('content', e.target.value)}
              className={`min-h-[200px] ${errors.content ? 'border-red-500' : ''}`}
              required
            />
            {errors.content && (
              <p className="text-sm text-red-500">{errors.content}</p>
            )}
          </div>
          
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !isValid}
              className={isTemplate ? "bg-amber-600 hover:bg-amber-700 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}
            >
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {isEditing ? 'Update' : isTemplate ? 'Create from Template' : 'Create'} Prompt
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 