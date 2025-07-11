'use client'

import { MessageSquare, MoreHorizontal, Trash2, Edit2, TrashIcon, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { deleteChat, updateChatTitle, deleteAllChats } from '@/lib/actions/chat'
import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Chat } from '@/types/component-types'

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId?: string
  hideNewChatButton?: boolean // Hide the new chat button (e.g., when on assistant page)
  isMobile?: boolean // Whether this is being rendered in mobile overlay mode
  onChatSelect?: () => void // Callback for when a chat is selected (for closing mobile overlay)
}

export function ChatSidebar({ chats, currentChatId, hideNewChatButton = false, isMobile = false, onChatSelect }: ChatSidebarProps) {
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const pathname = usePathname()

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

  const handleDeleteAllChats = async () => {
    if (showDeleteAllConfirm) {
      await deleteAllChats(pathname)
    } else {
      setShowDeleteAllConfirm(true)
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteAllConfirm(false), 3000)
    }
  }

  return (
    <div className={`flex flex-col h-full ${
      isMobile 
        ? 'bg-gray-50 dark:bg-gray-900 w-full' 
        : 'border-r bg-gray-50 dark:bg-gray-900 w-[300px] min-w-[280px] max-w-[350px]'
    }`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Chats</h1>
        </div>
        <div className="space-y-2">
          {!hideNewChatButton && (
            <Link href="/assistant">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
              </Button>
            </Link>
          )}
          {chats.length > 0 && (
            <Button 
              onClick={handleDeleteAllChats}
              variant="outline"
              className={`w-full transition-all duration-200 ${
                showDeleteAllConfirm 
                  ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900/50' 
                  : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
              } shadow-sm`}
              size="sm"
            >
              <TrashIcon className="w-4 h-4 mr-2" />
              {showDeleteAllConfirm ? 'Click to Confirm' : 'Delete All Chats'}
            </Button>
          )}
        </div>
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
            chats.map((chat) => {
              const isCurrentChat = currentChatId === chat.id
              return (
                <Card 
                  key={chat.id} 
                  className={`mb-2 p-3 transition-all duration-200 ${
                    isCurrentChat 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-md ring-2 ring-blue-500/20' 
                      : 'hover:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                <div className="flex items-center justify-between">
                  <Link 
                    href={`/assistant/chat/${chat.id}`} 
                    className="flex-1 min-w-0"
                    onClick={onChatSelect}
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
            )
            })
          )}
        </div>
      </ScrollArea>
    </div>
  )
} 