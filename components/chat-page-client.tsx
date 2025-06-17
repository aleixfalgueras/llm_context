'use client'

import { useState, useEffect } from 'react'
import { ChatSidebar } from './chat-sidebar'
import { ChatContainer } from './chat-container'
import { NotesSidebar } from './notes-sidebar'
import { getUserNotes } from '@/lib/notes-actions'

interface ChatPageClientProps {
  chat: {
    id: string
    title: string
    messages: any[]
    usedNotes?: string[]
  }
  chats: any[]
  userImageUrl?: string
  userName: string
}

export function ChatPageClient({ chat, chats, userImageUrl, userName }: ChatPageClientProps) {
  const [notesOpen, setNotesOpen] = useState(true)
  const [selectedNote, setSelectedNote] = useState<string | null>(null)
  const [selectedNoteContent, setSelectedNoteContent] = useState<string | null>(null)

  // Fetch note content when a note is selected
  useEffect(() => {
    const fetchNoteContent = async () => {
      if (selectedNote) {
        try {
          const notes = await getUserNotes()
          const note = notes.find(n => n.name === selectedNote)
          setSelectedNoteContent(note?.content || null)
        } catch (error) {
          console.error('Failed to fetch note content:', error)
          setSelectedNoteContent(null)
        }
      } else {
        setSelectedNoteContent(null)
      }
    }

    fetchNoteContent()
  }, [selectedNote])

  return (
    <div className="flex h-screen">
      <ChatSidebar 
        chats={chats} 
        notesOpen={notesOpen}
        onNotesToggle={() => setNotesOpen(!notesOpen)}
      />
      <div className="flex-1 flex flex-col">
        {/* Chat Header */}
        <div className="border-b p-4">
          <h1 className="font-semibold text-lg">{chat.title}</h1>
        </div>

        {/* Chat Container with Messages and Input */}
        <ChatContainer 
          chatId={chat.id} 
          initialMessages={chat.messages}
          userImageUrl={userImageUrl}
          userName={userName}
          selectedNoteContent={selectedNoteContent}
          selectedNoteName={selectedNote}
          onNoteContextSent={() => setSelectedNote(null)}
        />
      </div>
      
      {/* Notes Sidebar */}
      <NotesSidebar 
        isOpen={notesOpen} 
        onToggle={() => setNotesOpen(!notesOpen)}
        selectedNote={selectedNote}
        onNoteSelect={setSelectedNote}
        chatId={chat.id}
        usedNotes={chat.usedNotes || []}
      />
    </div>
  )
} 