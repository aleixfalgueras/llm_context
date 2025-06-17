'use client'

import { useState } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatInterface } from './chat-interface'
import { NotesSidebar } from './notes-sidebar'

interface HomePageClientProps {
  chats: any[]
}

export function HomePageClient({ chats }: HomePageClientProps) {
  const [notesOpen, setNotesOpen] = useState(true)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)

  return (
    <div className="flex h-screen">
      <ChatSidebar 
        chats={chats} 
        notesOpen={notesOpen}
        onNotesToggle={() => setNotesOpen(!notesOpen)}
      />
      <div className="flex-1 flex items-center justify-center">
        <ChatInterface />
      </div>
      
      {/* Notes Sidebar */}
      <NotesSidebar 
        isOpen={notesOpen} 
        onToggle={() => setNotesOpen(!notesOpen)}
        selectedNote={selectedNote}
        onNoteSelect={setSelectedNote}
      />
    </div>
  )
} 