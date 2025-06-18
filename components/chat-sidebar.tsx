'use client'

import { Plus, MessageSquare, MoreHorizontal, Trash2, Edit2, User, TrashIcon, ChevronDown, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { createChat, createChatAndReturn, deleteChat, updateChatTitle, deleteAllChats } from '@/lib/actions'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { getClients } from '@/lib/client-actions'
import { useRouter } from 'next/navigation'

interface Chat {
  id: string
  title: string
  updatedAt: Date
}

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId?: string
  selectedClientId?: string | null
}

export function ChatSidebar({ chats, currentChatId, selectedClientId }: ChatSidebarProps) {
  const router = useRouter()
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [clients, setClients] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [newChatDropdownOpen, setNewChatDropdownOpen] = useState(false)
  const [clientSearchTerm, setClientSearchTerm] = useState('')

  // Fetch clients for the enhanced new chat dropdown
  useEffect(() => {
    const fetchClients = async () => {
      try {
        setLoading(true)
        const clientList = await getClients()
        setClients(clientList)
      } catch (error) {
        console.error('Failed to fetch clients:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

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
      await deleteAllChats()
    } else {
      setShowDeleteAllConfirm(true)
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteAllConfirm(false), 3000)
    }
  }

  const handleNewChatWithClient = async (clientId: string) => {
    try {
      const newChatId = await createChatAndReturn('New Chat', clientId)
      setNewChatDropdownOpen(false)
      setClientSearchTerm('')
      router.push(`/chat/${newChatId}`)
    } catch (error) {
      console.error('Failed to create new chat:', error)
      // Optionally show user feedback here
    }
  }

  const selectedClient = clients.find(client => client.id === selectedClientId)

  // Filter clients based on search term
  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(clientSearchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(clientSearchTerm.toLowerCase())
  )

  return (
    <div className="w-80 border-r bg-gray-50 dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-semibold">Chats</h1>
        </div>
        <div className="space-y-2">
          {/* Enhanced New Chat Button with Search - always visible */}
          <DropdownMenu open={newChatDropdownOpen} onOpenChange={(open) => {
            setNewChatDropdownOpen(open)
            if (!open) {
              setClientSearchTerm('')
            }
          }}>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="outline"
                disabled={clients.length === 0 || loading}
                className="w-full bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-gray-900 dark:text-gray-100 hover:bg-blue-200 dark:hover:bg-blue-900/50 shadow-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-blue-100 dark:disabled:hover:bg-blue-900/30" 
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Chat
                <ChevronDown className="w-3 h-3 ml-2" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-72" align="start">
              <DropdownMenuLabel>Start New Chat</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {currentChatId && selectedClientId && selectedClient && (
                <>
                  <DropdownMenuItem asChild>
                    <form action={() => createChat('New Chat', selectedClientId)}>
                      <button type="submit" className="w-full flex items-center text-left">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        <div>
                          <div className="font-medium">New chat with {selectedClient.name}</div>
                          <div className="text-xs text-muted-foreground">Current client</div>
                        </div>
                      </button>
                    </form>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-xs">Or choose different client:</DropdownMenuLabel>
                </>
              )}
              
              {/* Search Input */}
              <div className="flex items-center border-b px-2 sm:px-3 py-2">
                <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                <Input
                  placeholder="Search clients..."
                  value={clientSearchTerm}
                  onChange={(e) => setClientSearchTerm(e.target.value)}
                  className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm h-6"
                />
              </div>
              
              {/* Client List */}
              <div className="max-h-48 overflow-auto">
                {filteredClients.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    {clientSearchTerm ? 'No clients found' : 'No clients available'}
                  </div>
                ) : (
                  filteredClients
                    .filter(client => !currentChatId || client.id !== selectedClientId)
                    .map((client) => (
                                              <DropdownMenuItem
                          key={client.id}
                          onClick={() => handleNewChatWithClient(client.id)}
                          className="px-3 py-2 cursor-pointer"
                        >
                        <User className="w-4 h-4 mr-2" />
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{client.name}</div>
                          {client.email && (
                            <div className="text-xs text-muted-foreground truncate">{client.email}</div>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          
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