'use client'

import { useState, useCallback } from 'react'
import { Upload, File, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import { uploadNote } from '@/lib/notes-actions'

interface NotesUploadProps {
  onUploadSuccess?: () => void
}

export function NotesUpload({ onUploadSuccess }: NotesUploadProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const { toast } = useToast()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = Array.from(e.dataTransfer.files).filter(
      file => file.name.endsWith('.md') || file.name.endsWith('.txt')
    )
    
    if (files.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please select .md or .txt files only',
        variant: 'destructive'
      })
      return
    }
    
    setSelectedFiles(prev => [...prev, ...files])
  }, [toast])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).filter(
      file => file.name.endsWith('.md') || file.name.endsWith('.txt')
    )
    
    if (files.length === 0) {
      toast({
        title: 'Invalid file type',
        description: 'Please select .md or .txt files only',
        variant: 'destructive'
      })
      return
    }
    
    setSelectedFiles(prev => [...prev, ...files])
  }, [toast])

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return

    setUploading(true)
    let successCount = 0
    let errorCount = 0

    for (const file of selectedFiles) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        await uploadNote(formData)
        successCount++
      } catch (error) {
        errorCount++
        console.error(`Failed to upload ${file.name}:`, error)
      }
    }

    setUploading(false)
    setSelectedFiles([])

    if (successCount > 0) {
      toast({
        title: 'Upload successful',
        description: `${successCount} file(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      })
      onUploadSuccess?.()
    } else {
      toast({
        title: 'Upload failed',
        description: 'Failed to upload files. Please try again.',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="space-y-4">
      <Card
        className={`p-6 border-2 border-dashed transition-colors relative ${
          isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-300 dark:border-gray-700'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Drop your notes here</p>
            <p className="text-xs text-gray-500">or click to select files</p>
            <p className="text-xs text-gray-400">Supports .md and .txt files</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="mt-4 bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-gray-900 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm transition-all duration-200"
            onClick={() => document.getElementById('file-input')?.click()}
          >
            Select Files
          </Button>
        </div>
        <input
          id="file-input"
          type="file"
          multiple
          accept=".md,.txt"
          onChange={handleFileSelect}
          className="hidden"
        />
      </Card>

      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">Selected files:</p>
          <div className="space-y-2">
            {selectedFiles.map((file, index) => (
              <div
                key={`${file.name}-${index}`}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
              >
                <div className="flex items-center space-x-2">
                  <File className="h-4 w-4 text-gray-500" />
                  <span className="text-sm truncate">{file.name}</span>
                  <span className="text-xs text-gray-400">
                    ({(file.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <Button
            onClick={handleUpload}
            disabled={uploading}
            variant="outline"
            className="w-full bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-gray-900 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm transition-all duration-200 disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : `Upload ${selectedFiles.length} file(s)`}
          </Button>
        </div>
      )}
    </div>
  )
} 