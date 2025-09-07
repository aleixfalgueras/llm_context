'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface ImageViewDialogProps {
  isOpen: boolean
  onClose: () => void
  imageUrl: string
  imageAlt?: string
  imageIndex?: number
}

export function ImageViewDialog({ 
  isOpen, 
  onClose, 
  imageUrl, 
  imageAlt = "Generated image", 
  imageIndex = 1 
}: ImageViewDialogProps) {
  
  const handleDownload = async () => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `generated-image-${imageIndex}-${Date.now()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to download image:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{imageAlt}</DialogTitle>
        </DialogHeader>
        
        <div className="px-6 pb-2 flex-1 overflow-auto">
          <img
            src={imageUrl}
            alt={imageAlt}
            className="w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: 'calc(80vh - 140px)', objectFit: 'contain' }}
          />
        </div>
        
        <DialogFooter className="p-4 pt-2">
          <Button onClick={handleDownload} className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Download Image
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}