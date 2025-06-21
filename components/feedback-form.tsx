'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Badge } from '@/components/ui/badge'

const feedbackTypes = [
  { value: 'feature', label: 'Feature Request', description: 'Suggest a new feature or improvement' },
  { value: 'bug', label: 'Bug Report', description: 'Report a problem or error' },
  { value: 'complaint', label: 'General Feedback', description: 'Share your thoughts or concerns' },
]

const priorities = [
  { value: 'low', label: 'Low Priority - Minor issue' },
  { value: 'medium', label: 'Medium Priority - Moderate impact' },
  { value: 'high', label: 'High Priority - Major issue' },
]

export function FeedbackForm() {
  const [formData, setFormData] = useState({
    type: '',
    title: '',
    description: '',
    priority: '',
    useCase: '',
    stepsToReproduce: ''
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
        const typeLabel = feedbackTypes.find(t => t.value === formData.type)?.label || 'Feedback'
        toast({
          title: `${typeLabel} Submitted`,
          description: 'Thank you for your feedback! We\'ll review it carefully.',
        })
        // Reset form
        setFormData({
          type: '',
          title: '',
          description: '',
          priority: '',
          useCase: '',
          stepsToReproduce: ''
        })
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to submit feedback',
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

  const selectedType = feedbackTypes.find(t => t.value === formData.type)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Share Your Feedback</CardTitle>
        <CardDescription>
          Choose the type of feedback you'd like to provide
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="type">Feedback Type *</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue placeholder="What type of feedback are you providing?">
                  {selectedType ? selectedType.label : "What type of feedback are you providing?"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {feedbackTypes.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-sm text-muted-foreground">{type.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {formData.type === 'feature' ? 'Feature Title' : 
               formData.type === 'bug' ? 'Bug Title' : 
               'Feedback Title'} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={
                formData.type === 'feature' ? 'Brief, descriptive title for your feature request' :
                formData.type === 'bug' ? 'Brief description of the bug or issue' :
                'Brief title for your feedback'
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {formData.type === 'feature' ? 'Feature Description' : 
               formData.type === 'bug' ? 'Bug Description' : 
               'Feedback Description'} *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={
                formData.type === 'feature' ? 'What should it do? How should it work?' :
                formData.type === 'bug' ? 'What happened? What did you expect to happen?' :
                'Please provide details about your feedback'
              }
              rows={5}
              required
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level *</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger>
                <SelectValue placeholder={
                  formData.type === 'feature' ? 'How important is this feature to you?' :
                  formData.type === 'bug' ? 'How severe is this bug?' :
                  'How important is this feedback?'
                } />
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

          {/* Steps to Reproduce (Bug Reports Only) */}
          {formData.type === 'bug' && (
            <div className="space-y-2">
              <Label htmlFor="stepsToReproduce">Steps to Reproduce</Label>
              <Textarea
                id="stepsToReproduce"
                value={formData.stepsToReproduce}
                onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
                placeholder="Please provide step-by-step instructions to reproduce the bug:&#10;1. Go to...&#10;2. Click on...&#10;3. See error..."
                rows={4}
              />
            </div>
          )}

          {/* Use Case (Feature Requests Only) */}
          {formData.type === 'feature' && (
            <div className="space-y-2">
              <Label htmlFor="useCase">Use Case</Label>
              <Textarea
                id="useCase"
                value={formData.useCase}
                onChange={(e) => handleInputChange('useCase', e.target.value)}
                placeholder="Describe when and how you would use this feature. What problem does it solve?"
                rows={3}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
            disabled={isSubmitting || !formData.type || !formData.title || !formData.description || !formData.priority}
          >
            {isSubmitting ? 'Submitting...' : 
             formData.type === 'feature' ? 'Submit Feature Request' :
             formData.type === 'bug' ? 'Submit Bug Report' :
             'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 