'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Check, Edit2, FileText, Loader2, X } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { handleClientApiError } from '@/lib/api/api-toast'
import { useTranslations } from '@/lib/translations/context'
import { DynamicTextsByCategory } from '@/lib/types/dynamic-text-types'

export default function AdminDynamicTextTab() {
  const t = useTranslations('admin')
  const { toast } = useToast()

  const [categories, setCategories] = useState<DynamicTextsByCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    fetchDynamicTexts()
  }, [])

  const fetchDynamicTexts = async () => {
    try {
      const response = await fetch('/api/admin/dynamic-text')
      if (!response.ok) throw new Error('Failed to fetch')
      const result = await response.json()
      setCategories(result.data || [])
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('dashboard.dynamicText.errors.fetch')
      handleClientApiError(errorMessage, t('dashboard.dynamicText.errors.fetch'))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (id: string, currentValue: string) => {
    setEditingId(id)
    setEditValue(currentValue)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSave = async (id: string) => {
    setUpdating(true)
    try {
      const response = await fetch('/api/admin/dynamic-text', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, value: editValue })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Update failed')
      }

      // Update local state
      setCategories(prev => prev.map(cat => ({
        ...cat,
        groups: cat.groups.map(group => ({
          ...group,
          translations: group.translations.map(trans =>
            trans.id === id ? { ...trans, value: editValue } : trans
          )
        }))
      })))

      toast({
        title: t('dashboard.dynamicText.success.title'),
        description: t('dashboard.dynamicText.success.updated')
      })
      setEditingId(null)
      setEditValue('')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('dashboard.dynamicText.errors.update')
      handleClientApiError(errorMessage, t('dashboard.dynamicText.errors.update'))
    } finally {
      setUpdating(false)
    }
  }

  const getKeyDisplayName = (key: string): string => {
    // Convert "subscription.plans.apprentice.features" to readable format
    const parts = key.split('.')
    if (parts[0] === 'subscription' && parts[1] === 'plans') {
      const plan = parts[2]
      const type = parts[3]
      return `${plan.charAt(0).toUpperCase() + plan.slice(1)} - ${type.charAt(0).toUpperCase() + type.slice(1)}`
    }
    return key
  }

  // Check if value contains newlines (multiline content)
  const isMultiline = (value: string): boolean => value.includes('\n')

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          {t('dashboard.dynamicText.loading')}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
          <FileText className="h-5 w-5" />
          {t('dashboard.dynamicText.title')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.dynamicText.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {categories.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">
            {t('dashboard.dynamicText.empty')}
          </p>
        ) : (
          <Accordion type="multiple" className="w-full" defaultValue={categories.map(c => c.category)}>
            {categories.map((category) => (
              <AccordionItem key={category.category} value={category.category}>
                <AccordionTrigger className="text-lg font-medium">
                  <div className="flex items-center gap-2">
                    {category.categoryLabel}
                    <Badge variant="secondary">
                      {category.groups.length} {t('dashboard.dynamicText.items')}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {category.groups.map((group) => (
                      <div key={group.key} className="border rounded-lg p-4">
                        <div className="text-sm font-medium text-muted-foreground mb-3">
                          {getKeyDisplayName(group.key)}
                        </div>
                        <div className="space-y-2">
                          {group.translations.map((trans) => (
                            <div key={trans.id} className="flex items-start gap-3">
                              <Badge variant="outline" className="min-w-[40px] justify-center mt-1">
                                {trans.languageCode.toUpperCase()}
                              </Badge>

                              {editingId === trans.id ? (
                                <div className="flex-1 flex flex-col gap-2">
                                  {isMultiline(trans.value) ? (
                                    <textarea
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      disabled={updating}
                                      className="flex-1 min-h-[150px] p-2 border rounded-md text-sm resize-y"
                                      rows={6}
                                    />
                                  ) : (
                                    <Input
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      disabled={updating}
                                      className="flex-1"
                                    />
                                  )}
                                  <div className="flex gap-2 justify-end">
                                    <Button
                                      size="sm"
                                      onClick={() => handleSave(trans.id)}
                                      disabled={updating}
                                    >
                                      {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={handleCancel}
                                      disabled={updating}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="flex-1 flex items-start gap-2">
                                  <span className="flex-1 text-sm break-words whitespace-pre-line">{trans.value}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => handleEdit(trans.id, trans.value)}
                                    className="flex-shrink-0"
                                  >
                                    <Edit2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
