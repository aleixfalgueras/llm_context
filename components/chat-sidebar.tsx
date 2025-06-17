'use client'

import { Plus, MessageSquare, MoreHorizontal, Trash2, Edit2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { createChat, deleteChat, updateChatTitle } from '@/lib/actions'
import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useState } from 'react'
import { Input } from '@/components/ui/input'

interface Chat {
  id: string
  title: string
  updatedAt: Date
}

interface ChatSidebarProps {
  chats: Chat[]
}

export function ChatSidebar({ chats }: ChatSidebarProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')

  const handleEditStart = (chat: Chat) => {
    setEditingChatId(chat.id)
    setEditTitle(chat.title)
  }

  const handleEditSave = async (chatId: string) => {
    if (editTitle.trim()) {
      await updateChatTitle(chatId, editTitle.trim())
    }
    setEditingChatId(null)
  }

  const handleEditCancel = () => {
    setEditingChatId(null)
    setEditTitle('')
  }

  return (
    <div className="w-80 border-r bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">AI Chat</h1>
          <UserButton />
        </div>
        <form action={() => createChat()}>
          <Button type="submit" className="w-full" size="sm">
            <Plus className="w-4 h-4 mr-2" />
            New Chat
          </Button>
        </form>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No chats yet</p>
              <p className="text-sm">Start a new conversation</p>
            </div>
          ) : (
            chats.map((chat) => (
              <Card key={chat.id} className="mb-2 p-3 hover:shadow-sm transition-shadow">
                <div className="flex items-center justify-between">
                  <Link 
                    href={`/chat/${chat.id}`} 
                    className="flex-1 min-w-0"
                  >
                    {editingChatId === chat.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleEditSave(chat.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEditSave(chat.id)
                          } else if (e.key === 'Escape') {
                            handleEditCancel()
                          }
                        }}
                        className="h-6 px-1 text-sm"
                        autoFocus
                      />
                    ) : (
                      <div>
                        <h3 className="font-medium text-sm truncate">{chat.title}</h3>
                        <p className="text-xs text-gray-500">
                          {new Date(chat.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </Link>
                  
                  {editingChatId !== chat.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditStart(chat)}>
                          <Edit2 className="w-3 h-3 mr-2" />
                          Edit title
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteChat(chat.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </Card>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 