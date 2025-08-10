'use client'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {FeedbackType} from '@/lib/types/enums'
import {useFeedbackForm} from '@/hooks/use-feedback-form'

export function FeedbackForm() {
  const {
    // Form state
    formData,
    errors,
    
    // Loading state
    isSubmitting,
    
    // Actions
    updateField,
    handleSubmit,
    
    // Static data
    feedbackTypes,
    priorities,
  } = useFeedbackForm()

  const handleInputChange = (field: string, value: string) => {
    updateField(field as keyof typeof formData, value)
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
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
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
            {errors.type && (
              <p className="text-sm text-red-500">{errors.type}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              {formData.type === FeedbackType.FEATURE ? 'Feature Title' : 
               formData.type === FeedbackType.BUG ? 'Bug Title' : 
               'Feedback Title'} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={
                formData.type === FeedbackType.FEATURE ? 'Brief, descriptive title for your feature request' :
                formData.type === FeedbackType.BUG ? 'Brief description of the bug or issue' :
                'Brief title for your feedback'
              }
              className={errors.title ? 'border-red-500' : ''}
              required
            />
            {errors.title && (
              <p className="text-sm text-red-500">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">
              {formData.type === FeedbackType.FEATURE ? 'Feature Description' : 
               formData.type === FeedbackType.BUG ? 'Bug Description' : 
               'Feedback Description'} *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={
                formData.type === FeedbackType.FEATURE ? 'What should it do? How should it work?' :
                formData.type === FeedbackType.BUG ? 'What happened? What did you expect to happen?' :
                'Please provide details about your feedback'
              }
              className={errors.description ? 'border-red-500' : ''}
              rows={5}
              required
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority">Priority Level *</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                <SelectValue placeholder={
                  formData.type === FeedbackType.FEATURE ? 'How important is this feature to you?' :
                  formData.type === FeedbackType.BUG ? 'How severe is this bug?' :
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
            {errors.priority && (
              <p className="text-sm text-red-500">{errors.priority}</p>
            )}
          </div>

          {/* Steps to Reproduce (Bug Reports Only) */}
          {formData.type === FeedbackType.BUG && (
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
          {formData.type === FeedbackType.FEATURE && (
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
            variant="blue"
            className="w-full"
            disabled={isSubmitting || !formData.type || !formData.title || !formData.description || !formData.priority}
          >
            {isSubmitting ? 'Submitting...' : 
             formData.type === FeedbackType.FEATURE ? 'Submit Feature Request' :
             formData.type === FeedbackType.BUG ? 'Submit Bug Report' :
             'Submit Feedback'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 