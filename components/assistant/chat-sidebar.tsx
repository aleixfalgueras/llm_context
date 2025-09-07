'use client'

import {Edit2, MessageSquare, MoreHorizontal, Plus, Trash2, TrashIcon} from 'lucide-react'
import {Button} from '@/components/ui/button'
import {Card} from '@/components/ui/card'
import {ScrollArea} from '@/components/ui/scroll-area'
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from '@/components/ui/dropdown-menu'
import {Tooltip, TooltipTrigger, TooltipContent} from '@/components/ui/tooltip'
import {deleteAllChats, deleteChat, updateChatTitle} from '@/app/actions/chat-action'
import Link from 'next/link'
import {useState, useTransition, useEffect} from 'react'
import {usePathname, useRouter} from 'next/navigation'
import {Input} from '@/components/ui/input'
import {LoadingSpinner} from '@/components/ui/loading-spinner'
import {Chat} from '@prisma/client'
import {useTranslations} from '@/lib/translations/context'

interface ChatSidebarProps {
  chats: Chat[]
  currentChatId?: string
  hideNewChatButton?: boolean // Hide the new chat button (e.g., when on assistant page)
  isMobile?: boolean // Whether this is being rendered in mobile overlay mode
  onChatSelect?: () => void // Callback for when a chat is selected (for closing mobile overlay)
}

export function ChatSidebar({ chats, currentChatId, hideNewChatButton = false, isMobile = false, onChatSelect }: ChatSidebarProps) {
  const t = useTranslations('assistant')
  const tCommon = useTranslations('common')
  const [editingChatId, setEditingChatId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [loadingChatId, setLoadingChatId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const pathname = usePathname()
  const router = useRouter()

  // Clear loading state when transition completes
  useEffect(() => {
    if (!isPending && loadingChatId) {
      setLoadingChatId(null)
    }
  }, [isPending, loadingChatId])

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

  const handleChatNavigation = (chatId: string) => {
    if (loadingChatId || editingChatId) return // Prevent navigation during loading or editing
    
    setLoadingChatId(chatId)
    startTransition(() => {
      router.push(`/assistant/chat/${chatId}`)
    })
    onChatSelect?.()
  }

  const handleDeleteAllChats = async () => {
    if (showDeleteAllConfirm) {
      setIsDeleting(true)
      try {
        await deleteAllChats(pathname)
      } finally {
        setIsDeleting(false)
        setShowDeleteAllConfirm(false)
      }
    } else {
      setShowDeleteAllConfirm(true)
      // Reset confirmation after 3 seconds
      setTimeout(() => setShowDeleteAllConfirm(false), 3000)
    }
  }

  // For mobile, return content without wrapper to let parent handle scrolling
  if (isMobile) {
    return (
      <>
        {/* Delete All Button - No header for mobile */}
        {chats.length > 0 && (
          <Button 
            onClick={handleDeleteAllChats}
            variant="outline"
            className={`w-full transition-all duration-200 ${
              showDeleteAllConfirm 
                ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900/50' 
                : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700'
            } shadow-sm mb-4`}
            size="default"
            disabled={isDeleting}
          >
            {isDeleting ? (
              <LoadingSpinner size="sm" text={tCommon('deleting')} />
            ) : (
              <>
                <TrashIcon className="w-4 h-4 mr-2" />
                {showDeleteAllConfirm ? t('clickToConfirm') : t('deleteAllChats')}
              </>
            )}
          </Button>
        )}

        {/* Chat List - No ScrollArea for mobile */}
        <div className="space-y-2">
          {chats.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>{t('noChatsYet')}</p>
              <p className="text-sm">{t('startNewConversation')}</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isCurrentChat = currentChatId === chat.id
              return (
                <Card 
                  key={chat.id} 
                  className={`p-3 transition-all duration-200 overflow-hidden ${
                    isCurrentChat 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-md ring-2 ring-blue-500/20' 
                      : 'hover:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800'
                  } ${
                    loadingChatId === chat.id ? 'opacity-70' : ''
                  }`}
                >
                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                  <div 
                    className="min-w-0 overflow-hidden cursor-pointer"
                    onClick={() => handleChatNavigation(chat.id)}
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
                    ) : loadingChatId === chat.id ? (
                      <LoadingSpinner 
                        size="sm" 
                        text={tCommon('loading')}
                        className="text-xs text-gray-600 dark:text-gray-400"
                      />
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="font-medium text-sm truncate">{chat.title}</h3>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{chat.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  {editingChatId !== chat.id && loadingChatId !== chat.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditStart(chat)}>
                          <Edit2 className="w-3 h-3 mr-2" />
                          {t('editTitle')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteChat(chat.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          {tCommon('delete')}
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
      </>
    )
  }

  // Desktop layout (unchanged)
  return (
    <div className="flex flex-col h-full border-r w-[320px] min-w-[280px] max-w-[350px]">
      {/* Header */}
      <div className="p-2 sm:p-4">
        <div className="flex items-center space-x-1 sm:space-x-2 min-w-0 flex-1">
          <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0"  />
          <h2 className="font-semibold text-sm sm:text-base truncate">{t('chats')}</h2>
        </div>
        <div className="space-y-2 mt-6">
          {!hideNewChatButton && (
            <Link href="/assistant">
              <Button 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                size="sm"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('newChat')}
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
              disabled={isDeleting}
            >
              {isDeleting ? (
                <LoadingSpinner size="sm" text={tCommon('deleting')} />
              ) : (
                <>
                  <TrashIcon className="w-4 h-4 mr-2" />
                  {showDeleteAllConfirm ? t('clickToConfirm') : t('deleteAllChats')}
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Chat List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {chats.length === 0 ? (
            <div className="text-center text-gray-500 mt-8">
              <p>{t('noChatsYet')}</p>
              <p className="text-sm">{t('startNewConversation')}</p>
            </div>
          ) : (
            chats.map((chat) => {
              const isCurrentChat = currentChatId === chat.id
              return (
                <Card 
                  key={chat.id} 
                  className={`mb-2 p-3 transition-all duration-200 overflow-hidden ${
                    isCurrentChat 
                      ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 shadow-md ring-2 ring-blue-500/20' 
                      : 'hover:shadow-sm hover:bg-gray-100 dark:hover:bg-gray-800'
                  } ${
                    loadingChatId === chat.id ? 'opacity-70' : ''
                  }`}
                >
                <div className="grid grid-cols-[1fr,auto] items-center gap-2">
                  <div 
                    className="min-w-0 overflow-hidden cursor-pointer"
                    onClick={() => handleChatNavigation(chat.id)}
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
                    ) : loadingChatId === chat.id ? (
                      <LoadingSpinner 
                        size="sm" 
                        text={tCommon('loading')}
                        className="text-xs text-gray-600 dark:text-gray-400"
                      />
                    ) : (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <h3 className="font-medium text-sm truncate">{chat.title}</h3>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{chat.title}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                  
                  {editingChatId !== chat.id && loadingChatId !== chat.id && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="w-3 h-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditStart(chat)}>
                          <Edit2 className="w-3 h-3 mr-2" />
                          {t('editTitle')}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => deleteChat(chat.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-3 h-3 mr-2" />
                          {tCommon('delete')}
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