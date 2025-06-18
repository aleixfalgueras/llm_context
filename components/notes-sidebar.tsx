'use client'

import { useState, useEffect, useRef } from 'react'
import { StickyNote, Plus, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { NotesUpload } from './notes-upload'
import { NotesList } from './notes-list'
import { ClientSelector } from './client-selector'
import { getUserNotes, type UserNote } from '@/lib/notes-actions'

interface NotesSidebarProps {
  isOpen: boolean
  onToggle: () => void
  selectedNote?: string | null
  onNoteSelect?: (noteName: string | null) => void
  chatId?: string
  usedNotes?: string[]
  clients?: any[]
  selectedClientId?: string | null
  onClientSelect?: (clientId: string | null) => void
}

export function NotesSidebar({ 
  isOpen, 
  onToggle, 
  selectedNote, 
  onNoteSelect, 
  chatId, 
  usedNotes = [], 
  clients = [], 
  selectedClientId = null, 
  onClientSelect 
}: NotesSidebarProps) {
  const [notes, setNotes] = useState<UserNote[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [sidebarWidth, setSidebarWidth] = useState(400) // Default 400px for better content visibility
  const [isResizing, setIsResizing] = useState(false)
  const sidebarRef = useRef<HTMLDivElement>(null)

  const fetchNotes = async () => {
    try {
      setLoading(true)
      const userNotes = await getUserNotes(selectedClientId)
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
  }, [isOpen, selectedClientId])

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
      const minWidth = 320 // Minimum 320px for better readability
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
      <div className="p-2 sm:p-4 border-b">
        <div className="flex items-center justify-between min-w-0">
          <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
            <StickyNote className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
            <h2 className="font-semibold text-sm sm:text-base truncate">Client Notes</h2>
          </div>
          <div className="flex items-center space-x-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
              title={showUpload ? "Hide upload area" : "Upload notes"}
            >
              <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="h-7 w-7 sm:h-8 sm:w-8 p-0"
            >
              <X className="h-3 w-3 sm:h-4 sm:w-4" />
            </Button>
          </div>
        </div>
        
        {/* Client Selector */}
        {clients.length > 0 && onClientSelect && (
          <div className="mt-2 sm:mt-3">
            <ClientSelector
              clients={clients}
              selectedClientId={selectedClientId}
              onClientSelect={onClientSelect}
              placeholder="Select client..."
            />
          </div>
        )}
        {notes.length > 0 && (
          <div className="mt-1 space-y-1">
            <p className="text-xs sm:text-sm text-gray-500">
              {notes.length} note{notes.length !== 1 ? 's' : ''}
            </p>
            {selectedNote && (
              <p className="text-xs text-blue-600 font-medium break-words">
                📝 "{selectedNote}" selected for AI context
              </p>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {showUpload ? (
          <div className="p-2 sm:p-4">
            <div className="mb-3 sm:mb-4">
              <h3 className="font-medium mb-1 sm:mb-2 text-sm sm:text-base">Upload Notes</h3>
              <p className="text-xs sm:text-sm text-gray-500 break-words">
                Upload your .md or .txt files to save them in the cloud
              </p>
            </div>
            <NotesUpload onUploadSuccess={handleNotesChange} clientId={selectedClientId} />
          </div>
        ) : (
          <div className="p-2 sm:p-4 h-full overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
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


      </div>
    </div>
  )
} 