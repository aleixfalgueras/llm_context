'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ClientVariablesTooltip } from '@/components/ui/client-variables-tooltip'
import { Plus, Edit2, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface Prompt {
  id: string
  name: string
  description?: string
  content: string
  category: string
  isActive: boolean
  usageCount: number
}

interface PromptDialogProps {
  prompt?: Prompt
  trigger?: React.ReactNode
  onSuccess?: () => void
  isTemplate?: boolean
}

const CATEGORIES = [
  { value: 'general', label: 'General' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'content', label: 'Content' },
  { value: 'analysis', label: 'Analysis' },
]

export function PromptDialog({ prompt, trigger, onSuccess, isTemplate = false }: PromptDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: prompt?.name || '',
    description: prompt?.description || '',
    content: prompt?.content || '',
    category: prompt?.category || 'general',
  })
  const { toast } = useToast()

  const isEditing = Boolean(prompt) && !isTemplate

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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
      
      // Reset form if creating new prompt
      if (!isEditing) {
        setFormData({
          name: '',
          description: '',
          content: '',
          category: 'general',
        })
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
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
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
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
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
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
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
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="min-h-[200px]"
              required
            />
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
              disabled={loading}
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