'use client'

import { useTranslations } from '@/lib/translations/context'
import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Deal } from '@prisma/client'
import { DealFormData } from '@/lib/types/deal-types'

interface DealFormDialogProps {
  deal: Deal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: DealFormData) => Promise<void>
  isSaving: boolean
}

export function DealFormDialog({
  deal,
  open,
  onOpenChange,
  onSubmit,
  isSaving
}: DealFormDialogProps) {
  const t = useTranslations('deals')
  const [formData, setFormData] = useState<DealFormData>({
    title: '',
    description: '',
    price: '',
    externalUrl: '',
    validFrom: null,
    validUntil: null,
    isActive: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Reset form when dialog opens or deal changes
  useEffect(() => {
    if (open) {
      if (deal) {
        setFormData({
          title: deal.title,
          description: deal.description,
          price: deal.price,
          externalUrl: deal.externalUrl,
          validFrom: deal.validFrom,
          validUntil: deal.validUntil,
          isActive: deal.isActive
        })
      } else {
        setFormData({
          title: '',
          description: '',
          price: '',
          externalUrl: '',
          validFrom: null,
          validUntil: null,
          isActive: true
        })
      }
      setErrors({})
    }
  }, [open, deal])

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title?.trim()) {
      newErrors.title = t('form.titleRequired')
    }
    if (!formData.description?.trim()) {
      newErrors.description = t('form.descriptionRequired')
    }
    if (!formData.price?.trim()) {
      newErrors.price = t('form.priceRequired')
    }
    if (!formData.externalUrl?.trim()) {
      newErrors.externalUrl = t('form.externalUrlRequired')
    }

    // Validate date range
    if (formData.validFrom && formData.validUntil) {
      const fromDate = new Date(formData.validFrom)
      const untilDate = new Date(formData.validUntil)
      if (fromDate >= untilDate) {
        newErrors.validFrom = t('form.dateRangeError')
        newErrors.validUntil = t('form.dateRangeError')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    await onSubmit(formData)
  }

  const formatDateForInput = (date: Date | string | null | undefined): string => {
    if (!date) return ''
    const d = new Date(date)
    return d.toISOString().split('T')[0]
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{deal ? t('editDeal') : t('createDeal')}</DialogTitle>
          <DialogDescription>
            {deal ? t('form.descriptionPlaceholder') : t('description')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">{t('form.title')} *</Label>
            <Input
              id="title"
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={t('form.titlePlaceholder')}
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">{t('form.description')} *</Label>
            <Textarea
              id="description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('form.descriptionPlaceholder')}
              rows={4}
              className={errors.description ? 'border-red-500' : ''}
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Price */}
          <div className="space-y-2">
            <Label htmlFor="price">{t('form.price')} *</Label>
            <Input
              id="price"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              placeholder={t('form.pricePlaceholder')}
              className={errors.price ? 'border-red-500' : ''}
            />
            {errors.price && <p className="text-sm text-red-500">{errors.price}</p>}
          </div>

          {/* External URL */}
          <div className="space-y-2">
            <Label htmlFor="externalUrl">{t('form.externalUrl')} *</Label>
            <Input
              id="externalUrl"
              type="url"
              value={formData.externalUrl || ''}
              onChange={(e) => setFormData({ ...formData, externalUrl: e.target.value })}
              placeholder={t('form.externalUrlPlaceholder')}
              className={errors.externalUrl ? 'border-red-500' : ''}
            />
            {errors.externalUrl && <p className="text-sm text-red-500">{errors.externalUrl}</p>}
          </div>

          {/* Valid From */}
          <div className="space-y-2">
            <Label htmlFor="validFrom">{t('form.validFrom')}</Label>
            <Input
              id="validFrom"
              type="date"
              value={formatDateForInput(formData.validFrom)}
              onChange={(e) => setFormData({ ...formData, validFrom: e.target.value ? new Date(e.target.value) : null })}
              className={errors.validFrom ? 'border-red-500' : ''}
            />
            {errors.validFrom && <p className="text-sm text-red-500">{errors.validFrom}</p>}
          </div>

          {/* Valid Until */}
          <div className="space-y-2">
            <Label htmlFor="validUntil">{t('form.validUntil')}</Label>
            <Input
              id="validUntil"
              type="date"
              value={formatDateForInput(formData.validUntil)}
              onChange={(e) => setFormData({ ...formData, validUntil: e.target.value ? new Date(e.target.value) : null })}
              className={errors.validUntil ? 'border-red-500' : ''}
            />
            {errors.validUntil && <p className="text-sm text-red-500">{errors.validUntil}</p>}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSaving}
            >
              {t('actions.cancel')}
            </Button>
            <Button type="submit" disabled={isSaving} variant="blue">
              {isSaving ? '...' : (deal ? t('actions.update') : t('actions.create'))}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}