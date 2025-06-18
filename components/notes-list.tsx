'use client'

import { useState } from 'react'
import { Trash2, FileText, Calendar, Eye, EyeOff, Check, Circle, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'
import { deleteNote, type UserNote } from '@/lib/notes-actions'

interface NotesListProps {
  notes: UserNote[]
  onNotesChange?: () => void
  selectedNote?: string | null
  onNoteSelect?: (noteName: string | null) => void
  usedNotes?: string[]
}

export function NotesList({ notes, onNotesChange, selectedNote, onNoteSelect, usedNotes = [] }: NotesListProps) {
  const [expandedNote, setExpandedNote] = useState<string | null>(null)
  const [deletingNote, setDeletingNote] = useState<string | null>(null)
  const { toast } = useToast()

  const handleDelete = async (fileName: string) => {
    setDeletingNote(fileName)
    try {
      await deleteNote(fileName)
      toast({
        title: 'Note deleted',
        description: `${fileName} has been deleted successfully`,
      })
      onNotesChange?.()
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: 'Failed to delete the note. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setDeletingNote(null)
    }
  }

  const toggleExpanded = (fileName: string) => {
    setExpandedNote(expandedNote === fileName ? null : fileName)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  if (notes.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-500 dark:text-gray-400">No notes uploaded yet</p>
        <p className="text-sm text-gray-400">Upload your first .md or .txt file to get started</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3">
        {notes.map((note) => {
          const isSelected = selectedNote === note.name
          const isUsed = usedNotes.includes(note.name)
          return (
            <Card 
              key={note.name} 
              className={`p-2 sm:p-4 transition-colors relative ${
                isSelected 
                  ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                  : ''
              } ${
                isUsed 
                  ? 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800' 
                  : ''
              }`}
            >
              {/* Used Note Watermark */}
              {isUsed && (
                <div className="absolute top-1 right-1 sm:top-2 sm:right-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-1 py-0.5 sm:px-2 sm:py-1 rounded-full text-xs font-medium flex items-center space-x-1">
                  <MessageSquare className="h-2 w-2 sm:h-3 sm:w-3" />
                  <span className="hidden sm:inline">Used</span>
                  <span className="sm:hidden">✓</span>
                </div>
              )}
              <div className="space-y-2 sm:space-y-3">
              {/* Note Header */}
              <div className="flex items-center justify-between min-w-0">
                <div className="flex items-center space-x-1 sm:space-x-3 flex-1 min-w-0">
                  {/* Selection Button */}
                  {onNoteSelect && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNoteSelect(isSelected ? null : note.name)}
                      className={`h-6 w-6 sm:h-8 sm:w-8 p-0 flex-shrink-0 ${isSelected ? 'text-blue-600' : 'text-gray-500'}`}
                      title={isSelected ? 'Deselect note' : 'Select note for AI context'}
                    >
                      {isSelected ? (
                        <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                      ) : (
                        <Circle className="h-3 w-3 sm:h-4 sm:w-4" />
                      )}
                    </Button>
                  )}
                  
                  {/* Note Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-xs sm:text-sm truncate" title={note.name}>
                      {note.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                      <div className="flex items-center text-xs text-gray-500">
                        <Calendar className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
                        <span className="hidden sm:inline">{formatDate(note.lastModified)}</span>
                        <span className="sm:hidden">{new Date(note.lastModified).toLocaleDateString()}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {formatFileSize(note.size)}
                      </span>
                      <span className={`text-xs px-1 py-0.5 sm:px-1.5 rounded ${
                        note.type === 'markdown' 
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' 
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                      }`}>
                        {note.type === 'markdown' ? 'MD' : 'TXT'}
                      </span>
                    </div>
                  </div>
                </div>
                
                {/* Action Buttons */}
                <div className="flex items-center space-x-0.5 sm:space-x-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleExpanded(note.name)}
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0"
                  >
                    {expandedNote === note.name ? (
                      <EyeOff className="h-3 w-3 sm:h-4 sm:w-4" />
                    ) : (
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(note.name)}
                    disabled={deletingNote === note.name}
                    className="h-6 w-6 sm:h-8 sm:w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </div>
              </div>

              {/* Note Content (Expandable) */}
              {expandedNote === note.name && (
                <div className="border-t pt-2 sm:pt-3">
                  <div className="bg-gray-50 dark:bg-gray-800 rounded p-2 sm:p-3">
                    <pre className="text-xs sm:text-sm whitespace-pre-wrap break-words font-mono text-gray-700 dark:text-gray-300 max-h-32 sm:max-h-48 overflow-y-auto">
                      {note.content}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </Card>
        )
        })}
      </div>
    </ScrollArea>
  )
} 