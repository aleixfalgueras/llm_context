'use client'

import { useTranslations } from '@/lib/translations/context'
import { useState, useEffect, useRef } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Deal } from '@prisma/client'
import { DealFormData, getDealCategoriesWithLabels } from '@/lib/types/deal-types'
import { X, Upload, Loader2 } from 'lucide-react'
import Image from 'next/image'
import { optimizeImage, OptimizationResult } from '@/lib/utils/image-optimization'
import { formatFileSize } from '@/lib/constants/image-optimization-constants'

interface DealFormDialogProps {
  deal: Deal | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (formData: FormData) => Promise<void>
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  const [formData, setFormData] = useState<DealFormData>({
    title: '',
    description: '',
    price: '',
    category: 'COLIVING' as any,
    externalUrl: '',
    validFrom: null,
    validUntil: null,
    isActive: true
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeImage, setRemoveImage] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null)
  // Logo state
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [removeLogo, setRemoveLogo] = useState(false)
  const [isOptimizingLogo, setIsOptimizingLogo] = useState(false)
  const [logoOptimizationResult, setLogoOptimizationResult] = useState<OptimizationResult | null>(null)

  // Reset form when dialog opens or deal changes
  useEffect(() => {
    if (open) {
      if (deal) {
        setFormData({
          title: deal.title,
          description: deal.description,
          price: deal.price,
          category: deal.category as any,
          externalUrl: deal.externalUrl,
          validFrom: deal.validFrom,
          validUntil: deal.validUntil,
          isActive: deal.isActive
        })
        setImagePreview(deal.imageUrl || null)
        setImageFile(null)
        setRemoveImage(false)
        setIsOptimizing(false)
        setOptimizationResult(null)
        // Logo state
        setLogoPreview(deal.logoUrl || null)
        setLogoFile(null)
        setRemoveLogo(false)
        setIsOptimizingLogo(false)
        setLogoOptimizationResult(null)
      } else {
        setFormData({
          title: '',
          description: '',
          price: '',
          category: 'COLIVING' as any,
          externalUrl: '',
          validFrom: null,
          validUntil: null,
          isActive: true
        })
        setImagePreview(null)
        setImageFile(null)
        setRemoveImage(false)
        setIsOptimizing(false)
        setOptimizationResult(null)
        // Logo state
        setLogoPreview(null)
        setLogoFile(null)
        setRemoveLogo(false)
        setIsOptimizingLogo(false)
        setLogoOptimizationResult(null)
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
    if (!formData.category) {
      newErrors.category = t('form.categoryRequired')
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsOptimizing(true)
      setRemoveImage(false)

      // Optimize image before setting it
      const result = await optimizeImage(file)

      setImageFile(result.optimizedFile)
      setOptimizationResult(result)

      // Create preview URL from optimized file
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(result.optimizedFile)
    } catch (error) {
      console.error('Image optimization error:', error)
      // Fallback to original file if optimization fails
      setImageFile(file)
      setOptimizationResult(null)

      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } finally {
      setIsOptimizing(false)
    }
  }

  const handleRemoveImage = (): void => {
    setImageFile(null)
    setImagePreview(deal?.imageUrl || null)
    setRemoveImage(true)
    setOptimizationResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setIsOptimizingLogo(true)
      setRemoveLogo(false)

      // Optimize logo before setting it
      const result = await optimizeImage(file)

      setLogoFile(result.optimizedFile)
      setLogoOptimizationResult(result)

      // Create preview URL from optimized file
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(result.optimizedFile)
    } catch (error) {
      console.error('Logo optimization error:', error)
      // Fallback to original file if optimization fails
      setLogoFile(file)
      setLogoOptimizationResult(null)

      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    } finally {
      setIsOptimizingLogo(false)
    }
  }

  const handleRemoveLogo = (): void => {
    setLogoFile(null)
    setLogoPreview(deal?.logoUrl || null)
    setRemoveLogo(true)
    setLogoOptimizationResult(null)
    if (logoInputRef.current) {
      logoInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    // Create FormData for file upload
    const submitFormData = new FormData()
    submitFormData.append('title', formData.title || '')
    submitFormData.append('description', formData.description || '')
    submitFormData.append('price', formData.price || '')
    submitFormData.append('externalUrl', formData.externalUrl || '')
    submitFormData.append('isActive', formData.isActive ? 'true' : 'false')
    submitFormData.append('category', formData.category || '')

    if (formData.validFrom) {
      submitFormData.append('validFrom', formData.validFrom.toISOString())
    }
    if (formData.validUntil) {
      submitFormData.append('validUntil', formData.validUntil.toISOString())
    }

    // Handle image
    if (imageFile) {
      submitFormData.append('imageFile', imageFile)
    }
    if (removeImage) {
      submitFormData.append('removeImage', 'true')
    }

    // Handle logo
    if (logoFile) {
      submitFormData.append('logoFile', logoFile)
    }
    if (removeLogo) {
      submitFormData.append('removeLogo', 'true')
    }

    await onSubmit(submitFormData)
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

          {/* Valid From and Valid Until in one row */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
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

            <div className="flex-1 space-y-2">
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
          </div>

          {/* Price and Category */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
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

            <div className="flex-1 space-y-2">
              <Label htmlFor="category">{t('form.category')} *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value as any })}
              >
                <SelectTrigger className={errors.category ? 'border-red-500' : ''}>
                  <SelectValue placeholder={t('form.categoryPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  {getDealCategoriesWithLabels(t).map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && <p className="text-sm text-red-500">{errors.category}</p>}
            </div>
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

          {/* Image Upload */}
          <div className="space-y-2">
            <Label htmlFor="image">
              {t('form.image')} <span className="text-muted-foreground text-xs">{t('form.imageOptional')}</span>
            </Label>

            {imagePreview && !removeImage && (
              <div className="relative w-full h-48 border rounded-md overflow-hidden">
                <Image
                  src={imagePreview}
                  alt={t('form.imagePreview')}
                  fill
                  className="object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={isOptimizing}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                disabled={isOptimizing}
              >
                {isOptimizing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t('form.imageOptimizing')}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    {imagePreview && !removeImage ? t('form.imageChange') : t('form.imageChoose')}
                  </>
                )}
              </Button>
              {imagePreview && !removeImage && !isOptimizing && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRemoveImage}
                >
                  {t('form.imageRemove')}
                </Button>
              )}
            </div>

            {/* Optimization Result Display */}
            {optimizationResult && !removeImage && (
              <div className="text-xs text-muted-foreground">
                {optimizationResult.skipped ? (
                  <span>{formatFileSize(optimizationResult.originalSize)} (already optimized)</span>
                ) : (
                  <span className="text-green-600 dark:text-green-500">
                    {t('form.imageOptimized', {
                      stats: `${formatFileSize(optimizationResult.originalSize)} → ${formatFileSize(optimizationResult.compressedSize)} (-${optimizationResult.compressionPercentage}%)`
                    })}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label htmlFor="logo">
              {t('form.logo')} <span className="text-muted-foreground text-xs">{t('form.logoOptional')}</span>
            </Label>

            <div className="flex items-center gap-4">
              {/* Logo Preview */}
              {logoPreview && !removeLogo && (
                <div className="relative w-20 h-20 border rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={logoPreview}
                    alt={t('form.logoPreview')}
                    fill
                    className="object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute -top-1 -right-1 h-5 w-5 p-0 rounded-full"
                    onClick={handleRemoveLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              )}

              <div className="flex-1 flex gap-2">
                <Input
                  ref={logoInputRef}
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  disabled={isOptimizingLogo}
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex-1"
                  disabled={isOptimizingLogo}
                >
                  {isOptimizingLogo ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {t('form.imageOptimizing')}
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      {logoPreview && !removeLogo ? t('form.logoChange') : t('form.logoChoose')}
                    </>
                  )}
                </Button>
                {logoPreview && !removeLogo && !isOptimizingLogo && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleRemoveLogo}
                  >
                    {t('form.logoRemove')}
                  </Button>
                )}
              </div>
            </div>

            {/* Logo Optimization Result Display */}
            {logoOptimizationResult && !removeLogo && (
              <div className="text-xs text-muted-foreground">
                {logoOptimizationResult.skipped ? (
                  <span>{formatFileSize(logoOptimizationResult.originalSize)} (already optimized)</span>
                ) : (
                  <span className="text-green-600 dark:text-green-500">
                    {t('form.imageOptimized', {
                      stats: `${formatFileSize(logoOptimizationResult.originalSize)} → ${formatFileSize(logoOptimizationResult.compressedSize)} (-${logoOptimizationResult.compressionPercentage}%)`
                    })}
                  </span>
                )}
              </div>
            )}
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