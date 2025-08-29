'use client'

import {useState} from 'react'
import {useTranslations} from '@/lib/translations/context'
import {Button} from '@/components/ui/button'
import {Edit, FileText, Trash2} from 'lucide-react'
import {Client, ClientActionHandlers} from '@/lib/types/client-list-types'
import {DeleteClientDialog} from './delete-client-dialog'
import {LanguageInfo} from "@/lib/utils/client-language";

interface ClientTableViewProps {
  clients: Client[]
  actionHandlers: ClientActionHandlers
  isDeleting: string | null
  getLanguageInfo: (languageValue: string) => LanguageInfo
}

export function ClientTableView({ 
  clients, 
  actionHandlers, 
  isDeleting, 
  getLanguageInfo 
}: ClientTableViewProps) {
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
    <div className="border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium min-w-[150px]">
                {t('table.name')}
              </th>
              <th className="text-left p-3 font-medium min-w-[180px] hidden sm:table-cell">
                {t('table.email')}
              </th>
              <th className="text-left p-3 font-medium min-w-[140px] hidden sm:table-cell">
                {t('table.phone')}
              </th>
              <th className="text-left p-3 font-medium min-w-[100px] hidden md:table-cell">
                {t('table.country')}
              </th>
              <th className="text-left p-3 font-medium min-w-[130px] hidden lg:table-cell">
                {t('table.documents')}
              </th>
              <th className="text-left p-3 font-medium min-w-[120px] sticky right-0 bg-muted">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {clients.map((client) => {
              const languageInfo = getLanguageInfo(client.documentsLanguage || 'en')
              return (
                <tr 
                  key={client.id} 
                  className="border-t hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => onViewClient(client)}
                >
                  <td className="p-3">
                    <div className="font-medium">
                      {client.name}
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <div>
                      {client.email || '-'}
                    </div>
                  </td>
                  <td className="p-3 hidden sm:table-cell">
                    <div>
                      {client.phone || '-'}
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div>
                      {client.country || '-'}
                    </div>
                  </td>
                  <td className="p-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <span>{languageInfo.flag}</span>
                      <span>{languageInfo.label}</span>
                    </div>
                  </td>
                  <td className="p-3 sticky right-0 bg-background">
                    <div className="flex justify-end gap-1">
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
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
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