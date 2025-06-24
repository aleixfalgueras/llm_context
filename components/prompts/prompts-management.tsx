'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PromptDialog } from '@/components/prompts/prompt-dialog'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, FileText, Edit2, Trash2, Plus, TrendingUp, Eye, EyeOff, Lightbulb, Copy } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import { samplePrompts, getSamplePromptsByCategory } from '@/lib/sample-prompts'

interface Prompt {
  id: string
  name: string
  description?: string
  content: string
  category: string
  isActive: boolean
  usageCount: number
  createdAt: string
  updatedAt: string
}

const CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'content', label: 'Content' },
  { value: 'analysis', label: 'Analysis' },
]

const SORT_OPTIONS = [
  { value: 'usage', label: 'Most Used' },
  { value: 'recent', label: 'Recently Updated' },
  { value: 'name', label: 'Name A-Z' },
  { value: 'created', label: 'Recently Created' },
]

export function PromptsManagement() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [sortBy, setSortBy] = useState('usage')
  const [showInactive, setShowInactive] = useState(false)
  const [showTemplates, setShowTemplates] = useState(true)
  const { toast } = useToast()

  // Load showTemplates preference from localStorage after hydration
  useEffect(() => {
    const saved = localStorage.getItem('showTemplates')
    if (saved !== null) {
      setShowTemplates(JSON.parse(saved))
    }
  }, [])

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (selectedCategory !== 'all') {
        params.append('category', selectedCategory)
      }
      if (!showInactive) {
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
  }, [selectedCategory, showInactive])

  const filteredAndSortedPrompts = prompts
    .filter((prompt) => {
      return (
        prompt.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prompt.content.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    .sort((a, b) => {
      switch (sortBy) {
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

  const stats = {
    total: prompts.length,
    active: prompts.filter(p => p.isActive).length,
    mostUsed: prompts.reduce((max, p) => p.usageCount > max.usageCount ? p : max, prompts[0] || { usageCount: 0 }),
  }

  const filteredSamplePrompts = getSamplePromptsByCategory(selectedCategory)

  const useAsTemplate = (samplePrompt: typeof samplePrompts[0]) => {
    // This will be handled by the PromptDialog component
    // We'll pass the sample prompt data to pre-fill the form
  }

  const toggleTemplates = () => {
    const newValue = !showTemplates
    setShowTemplates(newValue)
    localStorage.setItem('showTemplates', JSON.stringify(newValue))
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prompts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.active} active
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Most Used</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mostUsed?.usageCount || 0}</div>
            <p className="text-xs text-muted-foreground truncate">
              {stats.mostUsed?.name || 'No usage yet'}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Badge variant="secondary" className="text-xs">
              {Array.from(new Set(prompts.map(p => p.category))).length}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1 mt-2">
              {Array.from(new Set(prompts.map(p => p.category))).slice(0, 3).map((category) => (
                <Badge key={category} variant="outline" className="text-xs capitalize">
                  {category}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search prompts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
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
        
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          variant="outline"
          onClick={() => setShowInactive(!showInactive)}
          className="w-full sm:w-auto"
        >
          {showInactive ? (
            <>
              <EyeOff className="w-4 h-4 mr-2" />
              Hide Inactive
            </>
          ) : (
            <>
              <Eye className="w-4 h-4 mr-2" />
              Show All
            </>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={toggleTemplates}
          className="w-full sm:w-auto"
        >
          {showTemplates ? (
            <>
              <Lightbulb className="w-4 h-4 mr-2" />
              Hide Templates
            </>
          ) : (
            <>
              <Lightbulb className="w-4 h-4 mr-2" />
              Show Templates
            </>
          )}
        </Button>
      </div>

            {/* Example Prompts Section */}
      {!searchTerm && (prompts.length === 0 || selectedCategory === 'all') && showTemplates && (
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
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No prompts found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters.' 
                : 'Create your first prompt to get started.'}
            </p>
            {!searchTerm && selectedCategory === 'all' && (
              <PromptDialog 
                onSuccess={fetchPrompts}
                trigger={
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4 mr-2" />
                    Create First Prompt
                  </Button>
                }
              />
            )}
          </div>
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

interface PromptCardProps {
  prompt: Prompt
  onEdit: () => void
  onDelete: () => void
  onToggleStatus: () => void
}

function PromptCard({ prompt, onEdit, onDelete, onToggleStatus }: PromptCardProps) {

  return (
    <Card className={cn('h-[240px] hover:shadow-lg transition-all duration-200 hover:border-blue-200 dark:hover:border-blue-800 hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-blue-100 dark:border-blue-900 bg-blue-50/20 dark:bg-blue-950/5 flex flex-col', !prompt.isActive && 'opacity-60')}>
      <CardHeader className="pb-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <span className="truncate">{prompt.name}</span>
              {!prompt.isActive && (
                <EyeOff className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </CardTitle>
            <div className="h-12 flex items-start">
              {prompt.description && (
                <CardDescription className="mt-1 text-sm leading-relaxed break-words overflow-hidden">
                  {prompt.description.length > 80 
                    ? `${prompt.description.substring(0, 80)}...` 
                    : prompt.description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-auto">
          <Badge variant="secondary" className="text-xs capitalize">
            {prompt.category}
          </Badge>
          {prompt.usageCount > 0 && (
            <Badge variant="outline" className="text-xs">
              Used {prompt.usageCount}x
            </Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex gap-1">
            <PromptDialog 
              prompt={prompt} 
              onSuccess={onEdit}
              trigger={
                <Button variant="ghost" size="sm">
                  <Edit2 className="h-4 w-4" />
                </Button>
              }
            />
            
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleStatus}
            >
              {prompt.isActive ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
            
            <DeletePromptDialog onDelete={onDelete} promptName={prompt.name} />
          </div>
          
          <div className="text-xs text-muted-foreground">
            {new Date(prompt.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

interface DeletePromptDialogProps {
  onDelete: () => void
  promptName: string
}

function DeletePromptDialog({ onDelete, promptName }: DeletePromptDialogProps) {
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    onDelete()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Prompt</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{promptName}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

interface SamplePromptCardProps {
  prompt: typeof samplePrompts[0]
  onUseAsTemplate: () => void
  onSuccess: () => void
}

function SamplePromptCard({ prompt, onUseAsTemplate, onSuccess }: SamplePromptCardProps) {
  return (
    <Card className="h-[240px] hover:shadow-lg transition-all duration-200 hover:border-amber-200 dark:hover:border-amber-800 hover:bg-amber-50/30 dark:hover:bg-amber-950/10 border-amber-100 dark:border-amber-900 bg-amber-50/20 dark:bg-amber-950/5 flex flex-col">
      <CardHeader className="pb-3 flex-1 flex flex-col">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0" />
              <span className="truncate">{prompt.name}</span>
            </CardTitle>
            <div className="h-12 flex items-start">
              {prompt.description && (
                <CardDescription className="mt-1 text-sm leading-relaxed break-words overflow-hidden">
                  {prompt.description.length > 80 
                    ? `${prompt.description.substring(0, 80)}...` 
                    : prompt.description}
                </CardDescription>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-auto">
          <Badge variant="secondary" className="text-xs capitalize">
            {prompt.category}
          </Badge>
          <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
            Template
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex gap-2 pt-2 border-t">
          <PromptDialog 
            prompt={{
              id: '', // Will be generated when saved
              name: prompt.name,
              description: prompt.description,
              content: prompt.content,
              category: prompt.category,
              isActive: true,
              usageCount: 0,
            }}
            isTemplate={true}
            onSuccess={onSuccess}
            trigger={
              <Button size="sm" className="flex-1 bg-amber-600 hover:bg-amber-700 text-white">
                <Copy className="h-3 w-3 mr-1" />
                Use Template
              </Button>
            }
          />
        </div>
      </CardContent>
    </Card>
  )
} 