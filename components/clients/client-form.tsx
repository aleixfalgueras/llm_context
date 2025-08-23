'use client'

import {Button} from '@/components/ui/button'
import {Input} from '@/components/ui/input'
import {Textarea} from '@/components/ui/textarea'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {Tooltip, TooltipContent, TooltipTrigger} from '@/components/ui/tooltip'
import {CLIENT_FIELD_LABELS} from '@/lib/types/client-types'
import {Globe, HelpCircle, Shield} from 'lucide-react'
import {useClientForm} from '@/hooks/client/use-client-form'
import {useTranslations} from '@/lib/translations/context'
import React from "react";

interface ClientFormProps {
  client?: any
  onSuccess?: () => void
  onCancel?: () => void
  hideTitle?: boolean
  viewMode?: boolean
}

export function ClientForm({ client, onSuccess, onCancel, hideTitle, viewMode = false }: ClientFormProps) {
  const t = useTranslations('clients')
  const tCommon = useTranslations('common')
  
  const {
    // Form state
    formData,
    errors,
    
    // Loading state
    isLoading,
    
    // Actions
    updateField,
    handleSubmit,
    
    // Available options
    languages,
  } = useClientForm({ client, onSuccess })

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    updateField(field, e.target.value)
  }

  const handleSelectChange = (field: keyof typeof formData) => (value: string) => {
    updateField(field, value)
  }

  const renderFormContent = () => (
    <>
      {/* Personal Information Section */}
      <div className="space-y-4">
        <div className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 dark:bg-blue-950/30 rounded-r-md">
          <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('form.personalInformation')}
          </h3>
          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1">
            {t('form.privacyMessage')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-25 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="space-y-2">
            <Label htmlFor="name">{t('form.name')} {t('form.required')}</Label>
            {viewMode ? (
              <div className="p-2 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[40px] flex items-center">
                <span className="text-sm">{formData.name || '-'}</span>
              </div>
            ) : (
              <>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={handleChange('name')}
                  required
                  placeholder={t('form.namePlaceholder')}
                  className={errors.name ? 'border-red-500' : ''}
                />
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name}</p>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t('form.email')}</Label>
            {viewMode ? (
              <div className="p-2 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[40px] flex items-center">
                <span className="text-sm">{formData.email || '-'}</span>
              </div>
            ) : (
              <>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange('email')}
                  placeholder={t('form.emailPlaceholder')}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">{t('form.phone')}</Label>
            {viewMode ? (
              <div className="p-2 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[40px] flex items-center">
                <span className="text-sm">{formData.phone || '-'}</span>
              </div>
            ) : (
              <>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={handleChange('phone')}
                  placeholder={t('form.phonePlaceholder')}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500">{errors.phone}</p>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Other Client Information Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex items-center h-5">
            <Label htmlFor="country">{t('form.country')}</Label>
          </div>
          {viewMode ? (
            <div className="p-2 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[40px] flex items-center">
              <span className="text-sm">{formData.country || '-'}</span>
            </div>
          ) : (
            <Input
              id="country"
              value={formData.country}
              onChange={handleChange('country')}
              placeholder={t('form.countryPlaceholder')}
            />
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 h-5">
            <Label htmlFor="documentsLanguage" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {t('form.documentsLanguage')}
            </Label>
            <Tooltip>
              <TooltipTrigger asChild>
                <HelpCircle className="h-4 w-4 text-muted-foreground hover:text-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  {t('form.languageTooltip')}
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          {viewMode ? (
            <div className="p-2 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[40px] flex items-center">
              {formData.documentsLanguage ? (
                (() => {
                  const lang = languages.find(l => l.value === formData.documentsLanguage)
                  return lang ? (
                    <span className="flex items-center gap-2 text-sm">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                  ) : <span className="text-sm">-</span>
                })()
              ) : <span className="text-sm">-</span>}
            </div>
          ) : (
            <Select 
              value={formData.documentsLanguage} 
              onValueChange={handleSelectChange('documentsLanguage')}
            >
              <SelectTrigger id="documentsLanguage">
                <SelectValue placeholder={t('form.languageSelectPlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="generalContext">{t('form.generalContextLabel')}</Label>
        {viewMode ? (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[100px]">
            <span className="text-sm whitespace-pre-wrap">{formData.generalContext || '-'}</span>
          </div>
        ) : (
          <Textarea
            id="generalContext"
            value={formData.generalContext}
            onChange={handleChange('generalContext')}
            placeholder={t('form.generalContextPlaceholder')}
            rows={4}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="specificContext1">{t('form.specificContext1Label')}</Label>
        {viewMode ? (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[80px]">
            <span className="text-sm whitespace-pre-wrap">{formData.specificContext1 || '-'}</span>
          </div>
        ) : (
          <Textarea
            id="specificContext1"
            value={formData.specificContext1}
            onChange={handleChange('specificContext1')}
            placeholder={t('form.specificContext1Placeholder')}
            rows={3}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="specificContext2">{t('form.specificContext2Label')}</Label>
        {viewMode ? (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[80px]">
            <span className="text-sm whitespace-pre-wrap">{formData.specificContext2 || '-'}</span>
          </div>
        ) : (
          <Textarea
            id="specificContext2"
            value={formData.specificContext2}
            onChange={handleChange('specificContext2')}
            placeholder={t('form.specificContext2Placeholder')}
            rows={3}
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="specificContext3">{t('form.specificContext3Label')}</Label>
        {viewMode ? (
          <div className="p-3 bg-gray-50 dark:bg-gray-800 border rounded-md min-h-[80px]">
            <span className="text-sm whitespace-pre-wrap">{formData.specificContext3 || '-'}</span>
          </div>
        ) : (
          <Textarea
            id="specificContext3"
            value={formData.specificContext3}
            onChange={handleChange('specificContext3')}
            placeholder={t('form.specificContext3Placeholder')}
            rows={3}
          />
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        {viewMode ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            {tCommon('close')}
          </Button>
        ) : (
          <>
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                {tCommon('cancel')}
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading}
              variant="blue"
            >
              {isLoading ? tCommon('saving') : (client?.id ? t('form.updateClient') : t('form.createClient'))}
            </Button>
          </>
        )}
      </div>
    </>
  )

  return (
    <Card className="w-full max-w-2xl mx-auto">
      {!hideTitle && (
        <CardHeader>
          <CardTitle>
            {viewMode ? t('form.viewClient') : (client?.id ? t('form.editClient') : t('form.addNewClient'))}
          </CardTitle>
        </CardHeader>
      )}
      <CardContent className={hideTitle ? "mt-4" : ""}>
        {viewMode ? (
          <div className="space-y-6">
            {renderFormContent()}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {renderFormContent()}
          </form>
        )}
      </CardContent>
    </Card>
  )
} 