'use client'

import {useState} from 'react'
import {useTranslations} from '@/lib/translations/context'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Edit, FileText, Trash2} from 'lucide-react'
import {Client, ClientActionHandlers} from '@/lib/types/client-list-types'
import {DeleteClientDialog} from './delete-client-dialog'
import {LanguageInfo} from "@/lib/utils/client-language";

interface ClientGridViewProps {
  clients: Client[]
  actionHandlers: ClientActionHandlers
  isDeleting: string | null
  getLanguageInfo: (languageValue: string) => LanguageInfo
}

export function ClientGridView({ 
  clients, 
  actionHandlers, 
  isDeleting, 
  getLanguageInfo 
}: ClientGridViewProps) {
  const t = useTranslations('clients')
  const { onEditClient, onViewClient, onViewDocuments, onDeleteClient } = actionHandlers
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<{id: string, name: string} | null>(null)

  const handleDeleteClick = (client: Client) => {
    setClientToDelete({ id: client.id, name: client.name })
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      onDeleteClient(clientToDelete.id, clientToDelete.name)
    }
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => {
        const languageInfo = getLanguageInfo(client.documentsLanguage || 'en')
        return (
          <Card 
            key={client.id} 
            className="hover:shadow-lg transition-all duration-200 hover:bg-blue-50/30
             dark:hover:bg-blue-950/10 cursor-pointer"
            onClick={() => onViewClient(client)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg">{client.name}</CardTitle>
                  {client.email && (
                    <p className="text-sm text-muted-foreground">{client.email}</p>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewDocuments(client)
                    }}
                    title={t('actions.viewDocuments')}
                  >
                    <FileText className="h-4 w-4 text-yellow-600 hover:text-yellow-700" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      onEditClient(client)
                    }}
                    title={t('actions.editClient')}
                  >
                    <Edit className="h-4 w-4 text-blue-600 hover:text-blue-700" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteClick(client)
                    }}
                    disabled={isDeleting === client.id}
                    title={t('actions.deleteClient')}
                  >
                    <Trash2 className="h-4 w-4 text-red-600 hover:text-red-700" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                {client.phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('table.phone')}:</span>
                    <span>{client.phone}</span>
                  </div>
                )}

                {client.country && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t('table.country')}:</span>
                    <span>{client.country}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t('table.documents')}:</span>
                  <span className="flex items-center gap-1">
                    <span>{languageInfo.flag}</span>
                    <span>{languageInfo.label}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
      {clientToDelete && (
        <DeleteClientDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          clientName={clientToDelete.name}
          onDelete={handleConfirmDelete}
        />
      )}
    </div>
  )
} 