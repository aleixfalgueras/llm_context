'use client'

import { useState } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatInterface } from './chat-interface'
import { NotesSidebar } from './notes-sidebar'

interface HomePageClientProps {
  chats: any[]
  clients: any[]
}

export function HomePageClient({ chats, clients }: HomePageClientProps) {
  const [notesOpen, setNotesOpen] = useState(true)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)

  return (
    <div className="flex h-screen">
      <ChatSidebar 
        chats={chats}
        currentChatId={undefined}
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
        clients={clients}
        selectedClientId={selectedClient}
        onClientSelect={setSelectedClient}
      />
    </div>
  )
} 