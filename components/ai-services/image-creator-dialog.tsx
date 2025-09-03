'use client'

import {useState} from 'react'
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Button} from '@/components/ui/button'
import {Textarea} from '@/components/ui/textarea'
import {Label} from '@/components/ui/label'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {Image, Download, X, RefreshCw} from 'lucide-react'
import {useToast} from '@/hooks/use-toast'
import {PromptSelector} from '@/components/prompts/prompt-selector'
import type {Prompt} from '@prisma/client'
import {useTranslations} from '@/lib/translations/context'

interface ImageCreatorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImageCreatorDialog({
  open,
  onOpenChange
}: ImageCreatorDialogProps) {
  const t = useTranslations('aiServices')
  const tCommon = useTranslations('common')
  const {toast} = useToast()

  const [promptContent, setPromptContent] = useState('')
  const [generatedImageUrl, setGeneratedImageUrl] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleGenerate = async () => {
    if (!promptContent.trim()) {
      toast({
        title: t('common.validationError'),
        description: t('imageCreator.validation.promptRequired'),
        variant: 'destructive'
      })
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai-services/generate-image', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          prompt: promptContent
        })
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({}))
        throw new Error(error?.error || 'Failed to generate image')
      }

      const data = await response.json()
      setGeneratedImageUrl(data.imageUrl)

    } catch (error) {
      console.error('Image generation error:', error)
      toast({
        title: t('common.generationFailed'),
        description: error instanceof Error ? error.message : t('imageCreator.error.generationFailed'),
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async () => {
    if (!generatedImageUrl) return

    try {
      const response = await fetch(generatedImageUrl)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `generated-image-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)

      toast({
        title: t('imageCreator.download.success'),
        description: t('imageCreator.download.successDescription')
      })
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: t('imageCreator.download.failed'),
        description: t('imageCreator.download.failedDescription'),
        variant: 'destructive'
      })
    }
  }

  const handleClose = () => {
    setPromptContent('')
    setGeneratedImageUrl('')
    onOpenChange(false)
  }

  const handlePromptSelect = (prompt: Prompt) => {
    const currentContent = promptContent.trim()
    const newContent = currentContent 
      ? `${currentContent}\n\n${prompt.content}`
      : prompt.content
    setPromptContent(newContent)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-visible flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Image className="h-5 w-5" />
            {t('imageCreator.title')}
          </DialogTitle>
          <DialogDescription>
            {t('imageCreator.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-6 py-4">
          {/* Prompt Selection and Input */}
          <div className="space-y-4">
            <div className="flex items-center">
              <PromptSelector
                onPromptSelect={handlePromptSelect}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="prompt-content">{t('imageCreator.promptLabel')}</Label>
              <Textarea
                id="prompt-content"
                value={promptContent}
                onChange={(e) => setPromptContent(e.target.value)}
                placeholder={t('imageCreator.promptPlaceholder')}
                className="min-h-[120px]"
              />
            </div>
          </div>

          {/* Generated Image Display */}
          {generatedImageUrl && (
            <div className="space-y-4">
              <Label>{t('imageCreator.generatedImage')}</Label>
              <div className="border rounded-lg overflow-hidden">
                <img
                  src={generatedImageUrl}
                  alt={t('imageCreator.generatedImageAlt')}
                  className="w-full h-auto max-h-[500px] object-contain"
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-shrink-0 gap-2">
          <Button variant="outline" onClick={handleClose}>
            <X className="h-4 w-4 mr-1" />
            {tCommon('cancel')}
          </Button>

          {!generatedImageUrl ? (
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg transition-all"
            >
              {isGenerating ? (
                <LoadingSpinner size="sm" text={t('common.generating')} className="text-white" />
              ) : (
                <>
                  <Image className="h-4 w-4 mr-2" />
                  {t('imageCreator.generate')}
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <LoadingSpinner size="sm" text="" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-1" />
                )}
                {t('imageCreator.regenerate')}
              </Button>
              <Button
                onClick={handleDownload}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:shadow-lg transition-all"
              >
                <Download className="h-4 w-4 mr-1" />
                {t('imageCreator.download.button')}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}