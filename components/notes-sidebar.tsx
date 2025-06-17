'use client'

import { useState, useEffect, useRef } from 'react'
import { StickyNote, Plus, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { NotesUpload } from './notes-upload'
import { NotesList } from './notes-list'
import { getUserNotes, type UserNote } from '@/lib/notes-actions'

interface NotesSidebarProps {
  isOpen: boolean
  onToggle: () => void
  selectedNote?: string | null
  onNoteSelect?: (noteName: string | null) => void
  chatId?: string
  usedNotes?: string[]
}

export function NotesSidebar({ isOpen, onToggle, selectedNote, onNoteSelect, chatId, usedNotes = [] }: NotesSidebarProps) {
  const [notes, setNotes] = useState<UserNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(320) // Default 320px (w-80)
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const userNotes = await getUserNotes()
      setNotes(userNotes)
    } catch (error) {
      console.error('Failed to fetch notes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      fetchNotes()
    }
  }, [isOpen])

  const handleNotesChange = () => {
    fetchNotes()
    setShowUpload(false)
  }

  // Handle resize functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      
      const newWidth = window.innerWidth - e.clientX
      const minWidth = 240 // Minimum 240px
      const maxWidth = 600 // Maximum 600px
      
      const constrainedWidth = Math.min(Math.max(newWidth, minWidth), maxWidth)
      setSidebarWidth(constrainedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  if (!isOpen) {
    return null
  }

  return (
    <div 
      ref={sidebarRef}
      className="border-l bg-background flex h-full relative"
      style={{ width: `${sidebarWidth}px` }}
    >
      {/* Resize Handle */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-500 transition-colors z-10 group"
        onMouseDown={handleMouseDown}
      >
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-blue-500 text-white p-1 rounded">
            <GripVertical className="h-3 w-3" />
          </div>
        </div>
      </div>
      
      {/* Sidebar Content */}
      <div className="flex flex-col flex-1 ml-1">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <StickyNote className="h-5 w-5" />
            <h2 className="font-semibold">My Notes</h2>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
              className="h-8 w-8 p-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {notes.length > 0 && (
          <div className="mt-1 space-y-1">
            <p className="text-sm text-gray-500">
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </p>
            {selectedNote && (
              <p className="text-xs text-blue-600 font-medium">
                📝 "{selectedNote}" selected for AI context
              </p>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showUpload ? (
          <div className="p-4">
            <div className="mb-4">
              <h3 className="font-medium mb-2">Upload Notes</h3>
              <p className="text-sm text-gray-500">
                Upload your .md or .txt files to save them in the cloud
              </p>
            </div>
            <NotesUpload onUploadSuccess={handleNotesChange} />
          </div>
        ) : (
          <div className="p-4 h-full">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <NotesList 
                notes={notes} 
                onNotesChange={handleNotesChange}
                selectedNote={selectedNote}
                onNoteSelect={onNoteSelect}
                usedNotes={usedNotes}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer with Upload Toggle */}
      {!showUpload && !loading && (
        <div className="p-4 border-t">
          <Button
            onClick={() => setShowUpload(true)}
            variant="outline"
            className="w-full bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-gray-900 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm transition-all duration-200"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Notes
          </Button>
        </div>
      )}
      </div>
    </div>
  )
} 