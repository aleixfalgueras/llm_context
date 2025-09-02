'use client'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {useFeedbackForm} from '@/hooks/use-feedback-form'
import {useTranslations} from '@/lib/translations/context'
import {FeedbackType} from "@/lib/types/feedback-types";

export function FeedbackForm() {
  const t = useTranslations('feedback')
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
        <CardTitle>{t('title')}</CardTitle>
        <CardDescription>
          {t('description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Feedback Type */}
          <div className="space-y-2">
            <Label htmlFor="type">{t('typeRequired')}</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger className={errors.type ? 'border-red-500' : ''}>
                <SelectValue placeholder={t('typePlaceholder')}>
                  {selectedType ? selectedType.label : t('typePlaceholder')}
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
              {formData.type === FeedbackType.feature ? t('titles.feature') : 
               formData.type === FeedbackType.bug ? t('titles.bug') : 
               t('titles.general')} *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              placeholder={
                formData.type === FeedbackType.feature ? t('placeholders.featureTitle') :
                formData.type === FeedbackType.bug ? t('placeholders.bugTitle') :
                t('placeholders.generalTitle')
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
              {formData.type === FeedbackType.feature ? t('descriptions.feature') : 
               formData.type === FeedbackType.bug ? t('descriptions.bug') : 
               t('descriptions.general')} *
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={
                formData.type === FeedbackType.feature ? t('placeholders.featureDescription') :
                formData.type === FeedbackType.bug ? t('placeholders.bugDescription') :
                t('placeholders.description')
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
            <Label htmlFor="priority">{t('priority')}</Label>
            <Select value={formData.priority} onValueChange={(value) => handleInputChange('priority', value)}>
              <SelectTrigger className={errors.priority ? 'border-red-500' : ''}>
                <SelectValue placeholder={
                  formData.type === FeedbackType.feature ? t('priorityPlaceholders.feature') :
                  formData.type === FeedbackType.bug ? t('priorityPlaceholders.bug') :
                  t('priorityPlaceholders.general')
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
          {formData.type === FeedbackType.bug && (
            <div className="space-y-2">
              <Label htmlFor="stepsToReproduce">{t('stepsToReproduce')}</Label>
              <Textarea
                id="stepsToReproduce"
                value={formData.stepsToReproduce}
                onChange={(e) => handleInputChange('stepsToReproduce', e.target.value)}
                placeholder={t('placeholders.stepsToReproduce')}
                rows={4}
              />
            </div>
          )}

          {/* Use Case (Feature Requests Only) */}
          {formData.type === FeedbackType.feature && (
            <div className="space-y-2">
              <Label htmlFor="useCase">{t('useCase')}</Label>
              <Textarea
                id="useCase"
                value={formData.useCase}
                onChange={(e) => handleInputChange('useCase', e.target.value)}
                placeholder={t('placeholders.useCase')}
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
            {isSubmitting ? t('submitting') : 
             formData.type === FeedbackType.feature ? t('submit.feature') :
             formData.type === FeedbackType.bug ? t('submit.bug') :
             t('submit.general')}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
} 