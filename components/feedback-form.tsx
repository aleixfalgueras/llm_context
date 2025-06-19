'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'

const priorities = [
  { value: 'low', label: 'Low Priority - Nice to have' },
  { value: 'medium', label: 'Medium Priority - Would be helpful' },
  { value: 'high', label: 'High Priority - Really needed' },
]

export function FeedbackForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: '',
    useCase: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: 'Feature Request Submitted',
          description: 'Thank you for your suggestion! We\'ll review your feature request.',
        })
        // Reset form
        setFormData({
          title: '',
          description: '',
          priority: '',
          useCase: ''
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit feature request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Feature</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Feature Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder="Brief, descriptive title for your feature request"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Feature Description *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="What should it do? How should it work?"
              rows={5}
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level *</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder="How important is this feature to you?" />
              </SelectTrigger>
              <SelectContent>
                {priorities.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Use Case */}
          <div className="space-y-2">
            <Label htmlFor="useCase">Use Case (Optional)</Label>
            <Textarea
              id="useCase"
              value={formData.useCase}
              onChange={(e) => handleInputChange('useCase', e.target.value)}
              placeholder="Describe when and how you would use this feature. What problem does it solve?"
              rows={3}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !formData.title || !formData.description || !formData.priority}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Feature Request'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 